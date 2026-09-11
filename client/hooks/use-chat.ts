"use client";

import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {useCallback, useEffect, useRef, useState} from "react";

import {api, type ChatMessage} from "@/lib/api";
import {queryKeys} from "@/lib/query-keys";
import {streamChatMessage} from "@/lib/stream-chat";
import {toast} from "@/components/ui/toast";

export function useChatSessions(repositoryId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.chat.sessions(repositoryId),
        queryFn: () => api.listSessions(repositoryId),
        enabled: Boolean(repositoryId) && enabled,
    });
}

export function useChatMessages(sessionId: string | null) {
    return useQuery({
        queryKey: queryKeys.chat.messages(sessionId ?? ""),
        queryFn: () => api.getMessages(sessionId!),
        enabled: Boolean(sessionId),
    });
}

export function useCreateChatSession(repositoryId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (title?: string) => api.createSession(repositoryId, title),
        onSuccess: (session) => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.chat.sessions(repositoryId),
            });
            queryClient.setQueryData(queryKeys.chat.messages(session.id), []);
        },
        onError: (error: Error) => {
            toast.add({
                title: "Could not create chat",
                description: error.message,
                type: "error",
            });
        },
    });
}

export function useStreamChat(sessionId: string | null) {
    const queryClient = useQueryClient();
    const [streaming, setStreaming] = useState(false);
    const [streamText, setStreamText] = useState("");
    const abortRef = useRef<AbortController | null>(null);
    const streamingRef = useRef(false);
    const sessionIdRef = useRef<string | null>(null);

    useEffect(() => {
        sessionIdRef.current = sessionId;
    }, [sessionId]);

    const send = useCallback(
        async (content: string) => {
            const activeSessionId = sessionIdRef.current;
            if (!activeSessionId || !content.trim() || streamingRef.current) {
                return;
            }

            streamingRef.current = true;
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            const optimisticId = `temp-${Date.now()}`;
            const optimistic: ChatMessage = {
                id: optimisticId,
                role: "USER",
                content: content.trim(),
                citations: [],
                createdAt: new Date().toISOString(),
            };

            queryClient.setQueryData<ChatMessage[]>(
                queryKeys.chat.messages(activeSessionId),
                (prev) => [...(prev ?? []), optimistic]
            );

            setStreaming(true);
            setStreamText("");

            try {
                await streamChatMessage(activeSessionId, content.trim(), {
                    signal: controller.signal,
                    onUserMessage: (message) => {
                        queryClient.setQueryData<ChatMessage[]>(
                            queryKeys.chat.messages(activeSessionId),
                            (prev) => [
                                ...(prev ?? []).filter((m) => m.id !== optimisticId),
                                message,
                            ]
                        );
                    },
                    onToken: (rawToken) => {
                        const tokenStr = typeof rawToken === "string" ? rawToken : String(rawToken ?? "");
                        const trimmed = tokenStr.replace(
                            /^[\s\0\u200B-\u200D\uFEFF\d\W]+?(?=[A-Za-z])/,
                            ""
                        );
                        const safe = tokenStr.length === 0 ? "" : (trimmed.length > 0 ? tokenStr : "");
                        const numericNoise =
                            safe.length <= 12 && safe.length > 0 && /^\d+$/.test(safe);
                        if (safe && !numericNoise) {
                            setStreamText((prev) => prev + safe);
                        }
                    },
                    onAssistantMessage: (message) => {
                        queryClient.setQueryData<ChatMessage[]>(
                            queryKeys.chat.messages(activeSessionId),
                            (prev) => [...(prev ?? []), message]
                        );
                        setStreamText("");
                    },
                    onDone: () => {
                    },
                    onError: (err) => {
                        if ((err as Error)?.name === "AbortError") return;
                        setStreamText("");
                        toast.add({
                            title: "Stream interrupted",
                            description: err instanceof Error ? err.message : "Unknown error",
                            type: "error",
                        });
                    },
                });
            } catch (err) {
                if ((err as Error).name === "AbortError") return;
                toast.add({
                    title: "Message failed",
                    description: err instanceof Error ? err.message : "Unknown error",
                    type: "error",
                });
                queryClient.setQueryData<ChatMessage[]>(
                    queryKeys.chat.messages(activeSessionId),
                    (prev) => (prev ?? []).filter((m) => m.id !== optimisticId)
                );
                setStreamText("");
            } finally {
                streamingRef.current = false;
                setStreaming(false);
            }
        },
        [queryClient]
    );

    const stop = useCallback(() => {
        abortRef.current?.abort();
        streamingRef.current = false;
        setStreaming(false);
    }, []);

    return {send, stop, streaming, streamText};
}