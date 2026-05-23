import { SHREK_SCRIPT } from "./shrek-text.js";

export function parseScriptLines(scriptText) {
    return scriptText
        .split(/[\n\t]+/)
        .map((line) => line.trim())
        .filter(Boolean);
}

export function getShrekLines() {
    return parseScriptLines(SHREK_SCRIPT);
}
