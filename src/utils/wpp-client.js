import { WPP_API_SECRET, WPP_API_URL } from "./tokens.js";

export async function sendWhatsAppMessage({ message, to }) {
    if (!WPP_API_SECRET) {
        throw new Error("WPP_API_SECRET is not configured");
    }

    const response = await fetch(`${WPP_API_URL}/send`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${WPP_API_SECRET}`,
        },
        body: JSON.stringify({ message, to }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const details = data.status ? ` (${data.status})` : "";
        throw new Error((data.error ?? `HTTP ${response.status}`) + details);
    }

    return data;
}

export async function startShrekScript() {
    if (!WPP_API_SECRET) {
        throw new Error("WPP_API_SECRET is not configured");
    }

    const response = await fetch(`${WPP_API_URL}/script/shrek`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${WPP_API_SECRET}`,
        },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const details = data.status ? ` (${data.status})` : "";
        throw new Error((data.error ?? `HTTP ${response.status}`) + details);
    }

    return data;
}
