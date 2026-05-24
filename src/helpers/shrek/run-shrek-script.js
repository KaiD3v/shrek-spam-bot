import { applyLidPatch, resolveChatIdInBrowser } from "../wpp/lid-sync.js";

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function refreshChatId(waClient, target, currentChatId) {
    try {
        await applyLidPatch(waClient);
        const digits = target.replace(/\D/g, "");
        const refreshed = await resolveChatIdInBrowser(waClient, digits);
        return refreshed ?? currentChatId;
    } catch {
        return currentChatId;
    }
}

async function sendLine(waClient, chatId, line, { target, onChatIdRefresh }) {
    const maxAttempts = 8;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await waClient.sendMessage(chatId, line, { sendSeen: false });
            return { chatId, ok: true };
        } catch (error) {
            const waitMs = Math.min(2000 * attempt, 30_000);
            console.warn(
                `Shrek send falhou (tentativa ${attempt}/${maxAttempts}): ${error.message}. Pausa ${waitMs}ms`,
            );

            if (error.message.includes("LID") && target) {
                chatId = await refreshChatId(waClient, target, chatId);
                onChatIdRefresh?.(chatId);
            }

            if (attempt === maxAttempts) {
                console.warn(`Shrek pulando linha apos ${maxAttempts} tentativas: "${line.slice(0, 40)}..."`);
                return { chatId, ok: false };
            }

            await sleep(waitMs);
        }
    }

    return { chatId, ok: false };
}

export async function runShrekScript(
    waClient,
    chatId,
    { delayMs = 250, lines, onProgress, target, batchSize = 20, batchPauseMs = 5000 },
) {
    let sent = 0;
    let failed = 0;
    let activeChatId = chatId;

    for (let i = 0; i < lines.length; i++) {
        if (i > 0 && i % batchSize === 0) {
            console.log(`Shrek pausa entre lotes (${i}/${lines.length}) por ${batchPauseMs}ms`);
            await sleep(batchPauseMs);
        }

        const result = await sendLine(waClient, activeChatId, lines[i], {
            target,
            onChatIdRefresh: (id) => {
                activeChatId = id;
            },
        });

        activeChatId = result.chatId;

        if (result.ok) {
            sent++;
        } else {
            failed++;
        }

        onProgress?.(sent, lines.length, failed);

        if (i < lines.length - 1) {
            await sleep(delayMs);
        }
    }

    console.log(`Shrek script done: ${sent} enviadas, ${failed} falharam, ${lines.length} total`);
    return { sent, failed, total: lines.length };
}
