// TODO: replace with the actual Shrek script runner
export async function runShrekScript(client, chatId, { delayMs, lines, onProgress } = {}) {
  for (let i = 0; i < (lines?.length ?? 0); i++) {
    await client.sendMessage(chatId, lines[i]);
    if (onProgress) onProgress(i + 1, lines.length);
    await new Promise((r) => setTimeout(r, delayMs ?? 250));
  }
}
