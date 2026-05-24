export async function applyLidPatch(waClient) {
    await waClient.pupPage.evaluate(() => {
        if (typeof window.injectToFunction === "function") {
            const safeInject = (target, handler) => {
                try {
                    window.injectToFunction(target, handler);
                } catch {
                    // ignore unsupported modules
                }
            };

            safeInject(
                { module: "WAWebLid1X1MigrationGating", function: "Lid1X1MigrationUtils.isLidMigrated" },
                () => false,
            );
            safeInject(
                { module: "WAWebLid1X1MigrationGating", function: "shouldHaveAccountLid" },
                () => false,
            );
            safeInject(
                { module: "WAWebLidMigrationUtils", function: "toUserLid" },
                (func, wid) => {
                    try {
                        return func(wid);
                    } catch {
                        return wid;
                    }
                },
            );
        }

        async function findOrCreateChat(wid) {
            const findOrCreate =
                window.require("WAWebFindChatAction") ??
                (window.Store?.FindOrCreateChat
                    ? { findOrCreateLatestChat: (w) => window.Store.FindOrCreateChat.findOrCreateLatestChat(w) }
                    : null);

            if (!findOrCreate?.findOrCreateLatestChat) return null;

            try {
                const result = await findOrCreate.findOrCreateLatestChat(wid);
                return result?.chat ?? null;
            } catch {
                return null;
            }
        }

        async function syncLidAndOpenChat(phone) {
            const widFactory = window.require("WAWebWidFactory") ?? window.Store?.WidFactory;
            const contactSync = window.require("WAWebContactSyncUtils");
            if (!widFactory || !contactSync) return null;

            const chatWid = widFactory.createWid(`${phone}@c.us`);
            let chat = await findOrCreateChat(chatWid);
            if (chat) return chat;

            try {
                const query = contactSync.constructUsyncDeltaQuery([{ type: "add", phoneNumber: phone }]);
                const result = await query.execute();
                const lid = result?.list?.[0]?.lid;

                if (lid) {
                    const lidWid = widFactory.createWid(lid);
                    chat = await findOrCreateChat(lidWid);
                    if (chat) return chat;
                }
            } catch {
                // fall through
            }

            const chatStore = window.require("WAWebCollections")?.Chat ?? window.Store?.Chat;
            return chatStore?.get?.(chatWid) ?? null;
        }

        window.WWebJS.getChat = async (chatId, { getAsModel = true } = {}) => {
            const isChannel = /@\w*newsletter\b/.test(chatId);
            const widFactory = window.require("WAWebWidFactory") ?? window.Store?.WidFactory;
            const chatWid = widFactory.createWid(chatId);
            let chat;

            if (isChannel) {
                try {
                    chat = window
                        .require("WAWebCollections")
                        .WAWebNewsletterCollection.get(chatId);
                    if (!chat) {
                        await window
                            .require("WAWebLoadNewsletterPreviewChatAction")
                            .loadNewsletterPreviewChat(chatId);
                        chat = await window
                            .require("WAWebCollections")
                            .WAWebNewsletterCollection.find(chatWid);
                    }
                } catch {
                    chat = null;
                }
            } else {
                chat = await findOrCreateChat(chatWid);
                if (!chat) {
                    chat = await syncLidAndOpenChat(chatWid.user);
                }
            }

            return getAsModel && chat
                ? await window.WWebJS.getChatModel(chat, { isChannel })
                : chat;
        };
    });

    console.log("WhatsApp LID patch applied");
}

export async function resolveChatIdInBrowser(waClient, number) {
    const digits = number.replace(/\D/g, "");

    return waClient.pupPage.evaluate(async (phone) => {
        async function findOrCreateChat(wid) {
            const findOrCreate =
                window.require("WAWebFindChatAction") ??
                (window.Store?.FindOrCreateChat
                    ? { findOrCreateLatestChat: (w) => window.Store.FindOrCreateChat.findOrCreateLatestChat(w) }
                    : null);

            if (!findOrCreate?.findOrCreateLatestChat) return null;

            try {
                const result = await findOrCreate.findOrCreateLatestChat(wid);
                return result?.chat ?? null;
            } catch {
                return null;
            }
        }

        async function syncLidAndOpenChat(targetPhone) {
            const widFactory = window.require("WAWebWidFactory") ?? window.Store?.WidFactory;
            const contactSync = window.require("WAWebContactSyncUtils");
            if (!widFactory || !contactSync) return null;

            const chatWid = widFactory.createWid(`${targetPhone}@c.us`);
            let chat = await findOrCreateChat(chatWid);
            if (chat) return chat;

            try {
                const query = contactSync.constructUsyncDeltaQuery([
                    { type: "add", phoneNumber: targetPhone },
                ]);
                const result = await query.execute();
                const lid = result?.list?.[0]?.lid;

                if (lid) {
                    const lidWid = widFactory.createWid(lid);
                    chat = await findOrCreateChat(lidWid);
                    if (chat) return chat;
                }
            } catch {
                // fall through
            }

            return null;
        }

        const chat = await syncLidAndOpenChat(phone);
        if (!chat?.id) return null;

        return chat.id._serialized ?? String(chat.id);
    }, digits);
}
