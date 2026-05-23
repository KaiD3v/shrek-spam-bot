import { execSync } from "child_process";
import { rmSync } from "fs";
import { resolve } from "path";

const projectRoot = resolve(import.meta.dirname, "../..");
const sessionDir = resolve(projectRoot, ".wwebjs_auth/session");
const port = process.env.WPP_PORT ?? 3001;

function run(command) {
    try {
        execSync(command, { stdio: "ignore" });
    } catch {
        // Process may not exist.
    }
}

console.log("Stopping WhatsApp service...");

run(`fuser -k ${port}/tcp`);
run(`pkill -f "${sessionDir}"`);

try {
    rmSync(`${sessionDir}/SingletonLock`, { force: true });
    rmSync(`${sessionDir}/SingletonCookie`, { force: true });
    rmSync(`${sessionDir}/SingletonSocket`, { force: true });
} catch {
    // Lock files may not exist.
}

console.log("Done.");
