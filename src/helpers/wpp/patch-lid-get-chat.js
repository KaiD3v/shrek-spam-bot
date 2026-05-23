export async function patchLidGetChat(waClient) {
    await waClient.pupPage.evaluate(() => {
        window.WWebJS.getChat = async (chatId, { getAsModel = true } = {}) => {
            const isChannel = /@\w*newsletter\b/.test(chatId);
            const chatWid = window.require("WAWebWidFactory").createWid(chatId);
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
                chat = window.require("WAWebCollections").Chat.get(chatWid);

                if (!chat) {
                    chat = await window
                        .require("WAWebFindChatAction")
                        .findOrCreateLatestChat(chatWid)
                        .then((result) => result?.chat ?? null)
                        .catch(() => null);
                }

                if (!chat) {
                    try {
                        const query = window
                            .require("WAWebContactSyncUtils")
                            .constructUsyncDeltaQuery([
                                { type: "add", phoneNumber: chatWid.user },
                            ]);
                        const result = await query.execute();
                        const lid = result?.list?.[0]?.lid;

                        if (lid) {
                            const chatLid = window.require("WAWebWidFactory").createWid(lid);
                            chat = await window
                                .require("WAWebFindChatAction")
                                .findOrCreateLatestChat(chatLid)
                                .then((retry) => retry?.chat ?? null)
                                .catch(() => null);
                        }
                    } catch {
                        // LID sync failed; downstream send will surface the error.
                    }
                }
            }

            return getAsModel && chat
                ? await window.WWebJS.getChatModel(chat, { isChannel })
                : chat;
        };
    });

    console.log("WhatsApp LID patch applied (getChat)");
}
