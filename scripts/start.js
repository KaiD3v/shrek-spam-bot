import { spawn } from "child_process";
import { resolve } from "path";

const root = resolve(import.meta.dirname, "..");

// Railway injeta PORT; alinha WPP e URL da API no mesmo container.
const port = process.env.PORT ?? process.env.WPP_PORT ?? 3001;
if (!process.env.WPP_PORT) process.env.WPP_PORT = String(port);
if (!process.env.WPP_API_URL) {
    process.env.WPP_API_URL = `http://localhost:${port}`;
}

const children = [];

function spawnService(label, entry) {
    const child = spawn("node", [entry], {
        cwd: root,
        stdio: "inherit",
        env: process.env,
    });

    child.on("exit", (code, signal) => {
        if (signal) {
            console.error(`[${label}] stopped (${signal})`);
        } else if (code !== 0) {
            console.error(`[${label}] exited with code ${code}`);
        }
        shutdown(code ?? 1);
    });

    return child;
}

function shutdown(exitCode = 0) {
    for (const child of children) {
        if (!child.killed) child.kill("SIGTERM");
    }
    setTimeout(() => process.exit(exitCode), 500);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log(`Starting services (WPP port ${port})...`);

children.push(spawnService("wpp", "src/wpp/wpp.js"));

// API HTTP precisa estar escutando antes do bot Discord chamar /send.
setTimeout(() => {
    children.push(spawnService("discord", "src/index.js"));
}, 2000);
