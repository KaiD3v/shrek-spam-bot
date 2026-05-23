const chatIdCache = new Map();

export async function resolveChatId(waClient, number) {
    const digits = number.replace(/\D/g, "");
    if (!digits) {
        throw new Error("Numero de destino invalido");
    }

    if (chatIdCache.has(digits)) {
        return chatIdCache.get(digits);
    }

    const numberId = await waClient.getNumberId(digits);
    if (!numberId?._serialized) {
        throw new Error(
            `Numero ${digits} nao encontrado no WhatsApp. Use DDI+DDD+numero (ex: 5511999999999).`,
        );
    }

    try {
        await waClient.getChatById(numberId._serialized);
    } catch {
        // getChat patch handles LID sync on the next send.
    }

    chatIdCache.set(digits, numberId._serialized);
    return numberId._serialized;
}
