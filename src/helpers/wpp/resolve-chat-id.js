import { applyLidPatch, resolveChatIdInBrowser } from "./lid-sync.js";

const chatIdCache = new Map();

export async function resolveChatId(waClient, number) {
    const digits = number.replace(/\D/g, "");
    if (!digits) {
        throw new Error("Numero de destino invalido");
    }

    if (chatIdCache.has(digits)) {
        return chatIdCache.get(digits);
    }

    await applyLidPatch(waClient);

    const chatId = await resolveChatIdInBrowser(waClient, digits);
    if (!chatId) {
        throw new Error(
            `Nao foi possivel abrir chat com ${digits}. Confira WHATSAPP_TARGET com DDI (ex: 5511999999999) e se o numero tem WhatsApp.`,
        );
    }

    chatIdCache.set(digits, chatId);
    console.log(`Chat resolvido: ${digits} -> ${chatId}`);
    return chatId;
}
