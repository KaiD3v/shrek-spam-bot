function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runShrekScript(waClient, chatId, { delayMs = 250, lines, onProgress }) {
    for (let i = 0; i < lines.length; i++) {
        await waClient.sendMessage(chatId, lines[i]);
        onProgress?.(i + 1, lines.length);

        if (i < lines.length - 1) {
            await sleep(delayMs);
        }
    }

    return lines.length;
}
