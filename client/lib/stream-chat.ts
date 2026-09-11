import {getApiBaseUrl, ApiError, type ChatMessage} from "@/lib/api";

export type StreamChatHandlers = {
    onUserMessage?: (message: ChatMessage) => void;
    onToken?: (token: string) => void;
    onAssistantMessage?: (message: ChatMessage) => void;
    onDone?: () => void;
    onError?: (error: Error) => void;
    signal?: AbortSignal;
};

export async function streamChatMessage(
    sessionId: string,
    content: string,
    handlers: StreamChatHandlers = {}
): Promise<void> {
    const res = await fetch(
        `${getApiBaseUrl()}/api/chat/sessions/${sessionId}/messages`,
        {
            method: "POST",
            credentials: "include",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({content}),
            signal: handlers.signal,
        }
    );

    if (!res.ok) {
        let message = res.statusText;
        try {
            const data = await res.json();
            message = data.message ?? data.error ?? message;
        } catch {
            // ignore
        }
        throw new ApiError(res.status, message);
    }

    if (!res.body) {
        throw new Error("No response body for SSE stream");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const {done, value} = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, {stream: true});
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
            if (!part.trim()) continue;

            const lines = part.split("\n");
            let event = "message";
            const dataLines: string[] = [];

            for (const line of lines) {
                if (line.startsWith("event:")) {
                    event = line.slice(6).trim();
                } else if (line.startsWith("data:")) {
                    dataLines.push(line.slice(5).trimStart());
                }
            }

            const data = dataLines.join("\n");
            if (!data) continue;

            try {
                if (event === "token") {
                    const raw = JSON.parse(data);
                    const tokenSafe =
                        typeof raw === "string"
                            ? raw
                            : typeof raw === "number" || typeof raw === "bigint" || typeof raw === "boolean"
                                ? String(raw)
                                : Array.isArray(raw)
                                    ? raw.map((x) => (typeof x === "string" ? x : "")).join("")
                                    : raw && typeof raw === "object" && "text" in raw && typeof (raw as {text?: unknown}).text === "string"
                                        ? (raw as {text: string}).text
                                        : raw && typeof raw === "object" && "token" in raw && typeof (raw as {token?: unknown}).token === "string"
                                            ? (raw as {token: string}).token
                                            : typeof raw === "object" && raw !== null
                                                ? ""
                                                : String(raw ?? "");
                    if (tokenSafe.length > 0) {
                        handlers.onToken?.(tokenSafe);
                    }
                } else if (event === "user_message") {
                    handlers.onUserMessage?.(JSON.parse(data) as ChatMessage);
                } else if (event === "assistant_message") {
                    handlers.onAssistantMessage?.(JSON.parse(data) as ChatMessage);
                } else if (event === "done") {
                    handlers.onDone?.();
                }
            } catch (err) {
                if (event === "token") {
                    const fallback =
                        typeof data === "string"
                            ? data.replace(/^["']|["']$/g, "")
                            : "";
                    if (fallback.length > 0 && /[A-Za-z0-9_\-.,!?;:'"()\s]/.test(fallback)) {
                        handlers.onToken?.(fallback);
                    }
                } else {
                    handlers.onError?.(
                        err instanceof Error ? err : new Error("Failed to parse SSE event")
                    );
                }
            }
        }
    }

    handlers.onDone?.();
}