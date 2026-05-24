function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableSendError(error) {
    const message = error?.message ?? String(error);
    return (
        message.includes("No LID for user") ||
        message.includes("LID") ||
        message.includes("timed out") ||
        message.includes("Protocol error")
    );
}

export async function runShrekScript(waClient, chatId, { delayMs = 250, lines, onProgress }) {
    for (let i = 0; i < lines.length; i++) {
        let sent = false;

        for (let attempt = 1; attempt <= 3 && !sent; attempt++) {
            try {
                await waClient.sendMessage(chatId, lines[i]);
                sent = true;
            } catch (error) {
                if (attempt === 3 || !isRetryableSendError(error)) {
                    throw error;
                }

                console.warn(
                    `Shrek linha ${i + 1} falhou (tentativa ${attempt}/3): ${error.message}`,
                );
                await sleep(delayMs * attempt * 2);
            }
        }

        onProgress?.(i + 1, lines.length);

        if (i < lines.length - 1) {
            await sleep(delayMs);
        }
    }

    return lines.length;
}
