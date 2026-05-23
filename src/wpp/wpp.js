import { config } from "dotenv";
import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import { resolve } from "path";
import express from "express";
import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";
import { getShrekLines } from "../helpers/shrek/shrek-script.js";
import { runShrekScript } from "../helpers/shrek/run-shrek-script.js";

const { Client, LocalAuth } = pkg;

config();

const PORT = process.env.PORT ?? process.env.WPP_PORT ?? 3001;
const API_SECRET = process.env.WPP_API_SECRET;
const DEFAULT_TARGET = process.env.WHATSAPP_TARGET;
const INIT_RETRIES = Number(process.env.WPP_INIT_RETRIES ?? 3);
const READY_TIMEOUT_MS = Number(process.env.WPP_READY_TIMEOUT_MS ?? 120_000);
const SEND_READY_WAIT_MS = Number(process.env.WPP_SEND_READY_WAIT_MS ?? 30_000);
const SHREK_DELAY_MS = Number(process.env.SHREK_DELAY_MS ?? 250);

const puppeteerOptions = {
    headless: true,
    defaultViewport: null,
    args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-extensions",
    ],
};

const SYSTEM_CHROME_PATHS = [
    process.env.CHROME_EXECUTABLE_PATH,
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome-stable",
].filter(Boolean);

const chromePath = SYSTEM_CHROME_PATHS.find((path) => existsSync(path));

if (process.env.CHROME_EXECUTABLE_PATH && !chromePath) {
    console.error(`CHROME_EXECUTABLE_PATH not found: ${process.env.CHROME_EXECUTABLE_PATH}`);
    process.exit(1);
}

if (chromePath) {
    puppeteerOptions.executablePath = chromePath;
    console.log(`Using Chrome at ${chromePath}`);
} else {
    console.log("Using Puppeteer bundled Chrome");
}

if (!API_SECRET) {
    console.error("WPP_API_SECRET is missing in .env");
    process.exit(1);
}

const state = {
    status: "starting",
    isReady: false,
    loadingPercent: null,
    lastError: null,
};

const scriptJob = {
    running: false,
    sent: 0,
    total: 0,
    startedAt: null,
    finishedAt: null,
    error: null,
};

let readyPromise = createReadyPromise();

function createReadyPromise() {
    let resolveReady;
    let rejectReady;

    const promise = new Promise((resolve, reject) => {
        resolveReady = resolve;
        rejectReady = reject;
    });

    return { promise, resolve: resolveReady, reject: rejectReady };
}

function resetReadyPromise() {
    readyPromise = createReadyPromise();
}

function markReady() {
    if (state.isReady) return;

    state.isReady = true;
    state.status = "ready";
    readyPromise.resolve();
    console.log("WhatsApp client is ready!");
}

function markNotReady(status, error = null) {
    state.isReady = false;
    state.status = status;
    state.lastError = error;
}

const waClient = new Client({
    authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
    puppeteer: puppeteerOptions,
    webVersionCache: {
        type: "remote",
        remotePath:
            "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1017054665.html",
        strict: false,
    },
});

waClient.on("qr", (qr) => {
    markNotReady("qr");
    console.log("Scan the QR code with WhatsApp (Aparelhos conectados):");
    qrcode.generate(qr, { small: true });
    console.log("Waiting for authentication...");
});

waClient.on("authenticated", () => {
    markNotReady("authenticating");
    console.log("Authenticated. Syncing WhatsApp...");
});

waClient.on("loading_screen", (percent) => {
    state.loadingPercent = percent;
    markNotReady("loading");
    console.log(`Loading WhatsApp: ${percent}%`);
});

waClient.on("ready", markReady);

waClient.on("auth_failure", (message) => {
    markNotReady("auth_failure", message);
    readyPromise.reject(new Error(`auth failure: ${message}`));
    console.error("WhatsApp auth failure:", message);
});

waClient.on("disconnected", (reason) => {
    markNotReady("disconnected", reason);
    resetReadyPromise();
    console.error("WhatsApp disconnected:", reason);
});

function auth(req, res, next) {
    if (req.headers.authorization !== `Bearer ${API_SECRET}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}

function toChatId(number) {
    if (number.includes("@")) return number;
    return `${number.replace(/\D/g, "")}@c.us`;
}

function getHealthPayload() {
    return {
        ready: state.isReady,
        status: state.status,
        loadingPercent: state.loadingPercent,
        lastError: state.lastError,
        hint: state.isReady
            ? null
            : state.status === "qr"
              ? "Escaneie o QR code no terminal do npm run wpp"
              : "Aguarde a sincronizacao do WhatsApp terminar",
    };
}

async function waitForReady(timeoutMs) {
    if (state.isReady) return;

    await Promise.race([
        readyPromise.promise,
        new Promise((_, reject) => {
            setTimeout(
                () => reject(new Error(`WhatsApp not ready after ${timeoutMs}ms (${state.status})`)),
                timeoutMs,
            );
        }),
    ]);
}

const app = express();
app.use(express.json());

app.get("/health", auth, (_req, res) => {
    res.json(getHealthPayload());
});

app.post("/send", auth, async (req, res) => {
    try {
        await waitForReady(SEND_READY_WAIT_MS);
    } catch (error) {
        return res.status(503).json({
            error: error.message,
            ...getHealthPayload(),
        });
    }

    const { message, to } = req.body ?? {};
    if (!message?.trim()) {
        return res.status(400).json({ error: "message is required" });
    }

    const target = to ?? DEFAULT_TARGET;
    if (!target) {
        return res.status(400).json({
            error: 'No recipient. Set WHATSAPP_TARGET in .env or pass "to"',
        });
    }

    try {
        const sent = await waClient.sendMessage(toChatId(target), message);
        res.json({ success: true, id: sent.id._serialized });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/script/status", auth, (_req, res) => {
    res.json({
        running: scriptJob.running,
        sent: scriptJob.sent,
        total: scriptJob.total,
        startedAt: scriptJob.startedAt,
        finishedAt: scriptJob.finishedAt,
        error: scriptJob.error,
    });
});

app.post("/script/shrek", auth, async (req, res) => {
    if (scriptJob.running) {
        return res.status(409).json({
            error: "Shrek script is already running",
            sent: scriptJob.sent,
            total: scriptJob.total,
        });
    }

    try {
        await waitForReady(SEND_READY_WAIT_MS);
    } catch (error) {
        return res.status(503).json({
            error: error.message,
            ...getHealthPayload(),
        });
    }

    const target = DEFAULT_TARGET;
    if (!target) {
        return res.status(400).json({
            error: "WHATSAPP_TARGET is not set in .env",
        });
    }

    const lines = getShrekLines();
    const chatId = toChatId(target);
    const estimatedMinutes = Math.ceil((lines.length * SHREK_DELAY_MS) / 60_000);

    scriptJob.running = true;
    scriptJob.sent = 0;
    scriptJob.total = lines.length;
    scriptJob.startedAt = new Date().toISOString();
    scriptJob.finishedAt = null;
    scriptJob.error = null;

    console.log(`Starting Shrek script: ${lines.length} messages to ${target}`);

    res.status(202).json({
        started: true,
        total: lines.length,
        estimatedMinutes,
        delayMs: SHREK_DELAY_MS,
    });

    runShrekScript(waClient, chatId, {
        delayMs: SHREK_DELAY_MS,
        lines,
        onProgress: (sent, total) => {
            scriptJob.sent = sent;
            scriptJob.total = total;
            if (sent % 50 === 0 || sent === total) {
                console.log(`Shrek script progress: ${sent}/${total}`);
            }
        },
    })
        .then(() => {
            console.log(`Shrek script finished: ${scriptJob.sent} messages sent`);
        })
        .catch((error) => {
            scriptJob.error = error.message;
            console.error("Shrek script failed:", error);
        })
        .finally(() => {
            scriptJob.running = false;
            scriptJob.finishedAt = new Date().toISOString();
        });
});

function cleanupStaleBrowserLock() {
    const sessionDir = resolve(".wwebjs_auth/session");
    runQuiet(`pkill -f "${sessionDir}"`);

    for (const file of ["SingletonLock", "SingletonCookie", "SingletonSocket"]) {
        try {
            rmSync(`${sessionDir}/${file}`, { force: true });
        } catch {
            // Ignore missing lock files.
        }
    }
}

function runQuiet(command) {
    try {
        execSync(command, { stdio: "ignore" });
    } catch {
        // Ignore missing processes.
    }
}

function isRetryableInitError(error) {
    const message = error?.message ?? String(error);
    return (
        message.includes("Execution context was destroyed") ||
        message.includes("Protocol error") ||
        message.includes("auth timeout") ||
        message.includes("ready timeout") ||
        message.includes("browser is already running")
    );
}

async function initializeWhatsApp() {
    cleanupStaleBrowserLock();

    for (let attempt = 1; attempt <= INIT_RETRIES; attempt++) {
        try {
            markNotReady("starting");
            resetReadyPromise();

            await waClient.initialize();
            console.log("WhatsApp initialized. Waiting for ready...");

            await waitForReady(READY_TIMEOUT_MS);
            return;
        } catch (error) {
            console.error(
                `WhatsApp init failed (attempt ${attempt}/${INIT_RETRIES}):`,
                error?.message ?? error,
            );

            if (attempt === INIT_RETRIES || !isRetryableInitError(error)) {
                throw error;
            }

            console.log("Retrying in 3s...");
            cleanupStaleBrowserLock();
            try {
                await waClient.destroy();
            } catch {
                // Client may not be fully initialized yet.
            }
            await new Promise((resolve) => setTimeout(resolve, 3000));
        }
    }
}

const server = app.listen(PORT, () => {
    console.log(`WhatsApp API listening on http://localhost:${PORT}`);
});

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use.`);
        console.error("Kill the old process: fuser -k 3001/tcp");
        process.exit(1);
    }
    throw error;
});

initializeWhatsApp().catch((error) => {
    console.error("Failed to start WhatsApp client.");
    console.error("If this keeps happening, run: npm run wpp:stop");
    console.error(error);
    process.exit(1);
});

async function shutdown() {
    console.log("Shutting down WhatsApp service...");
    try {
        await waClient.destroy();
    } catch {
        // Ignore shutdown errors.
    }
    cleanupStaleBrowserLock();
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
