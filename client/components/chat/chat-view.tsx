"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ArrowLeft,
    FolderGit2,
    MessageSquarePlus,
} from "lucide-react";

import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { IndexingState } from "@/components/chat/indexing-state";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    useChatMessages,
    useChatSessions,
    useCreateChatSession,
    useStreamChat,
} from "@/hooks/use-chat";
import { useIndexStatus, useRepository } from "@/hooks/use-repos";
import { toast } from "@/components/ui/toast";
import type { ChatMessage } from "@/lib/api";

export function ChatView({ repoId }: { repoId: string }) {
    const repoQuery = useRepository(repoId);
    const isIndexing = repoQuery.data?.indexStatus === "INDEXING";
    const statusQuery = useIndexStatus(
        repoId,
        isIndexing || repoQuery.data?.indexStatus === "PENDING"
    );

    const indexStatus =
        statusQuery.data?.indexStatus ?? repoQuery.data?.indexStatus;
    const ready = indexStatus === "READY";

    const sessionsQuery = useChatSessions(repoId, ready);
    const createSession = useCreateChatSession(repoId);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
        null
    );
    const autoCreateRef = useRef(false);

    const sessionId =
        selectedSessionId ?? sessionsQuery.data?.[0]?.id ?? null;

    const messagesQuery = useChatMessages(sessionId);
    const { send, stop, streaming, streamText } = useStreamChat(sessionId);

    const [regenerating, setRegenerating] = useState(false);
    const regeneratingRef = useRef(false);
    const sendRef = useRef(send);
    const streamingRef = useRef(streaming);
    useEffect(() => {
        sendRef.current = send;
    }, [send]);
    useEffect(() => {
        streamingRef.current = streaming;
    }, [streaming]);

    const regenerate = useCallback(async () => {
        if (
            !sessionId ||
            streamingRef.current ||
            regeneratingRef.current ||
            !messagesQuery.isSuccess ||
            !ready
        ) {
            return;
        }

        const messages: ChatMessage[] = messagesQuery.data ?? [];

        let lastAssistantIdx = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === "ASSISTANT") {
                lastAssistantIdx = i;
                break;
            }
        }

        if (lastAssistantIdx <= 0) {
            toast.add({
                title: "Nothing to regenerate",
                description: "Send a message first to generate a response.",
                type: "info",
            });
            return;
        }

        const precedingUser = messages
            .slice(0, lastAssistantIdx)
            .reverse()
            .find((m) => m.role === "USER");

        if (!precedingUser) {
            toast.add({
                title: "Nothing to regenerate",
                description: "Could not find the original user prompt.",
                type: "info",
            });
            return;
        }

        try {
            regeneratingRef.current = true;
            setRegenerating(true);
            await sendRef.current(precedingUser.content);
        } finally {
            regeneratingRef.current = false;
            setRegenerating(false);
        }
    }, [sessionId, messagesQuery.isSuccess, messagesQuery.data, ready]);

    function newChat() {
        if (!ready || createSession.isPending) return;
        createSession.mutate("New chat", {
            onSuccess: (session) => {
                setSelectedSessionId(session.id);
                toast.add({
                    title: "New chat started",
                    description: session.title,
                    type: "success",
                });
            },
        });
    }

    useEffect(() => {
        if (!ready || sessionsQuery.isLoading) return;
        if (sessionsQuery.data && sessionsQuery.data.length > 0) return;
        if (
            !sessionsQuery.isSuccess ||
            (sessionsQuery.data?.length ?? 0) > 0 ||
            autoCreateRef.current
        ) {
            return;
        }

        autoCreateRef.current = true;
        createSession.mutate(undefined, {
            onSuccess: (session) => setSelectedSessionId(session.id),
            onError: () => {
                autoCreateRef.current = false;
            },
        });
    }, [
        ready,
        sessionsQuery.isLoading,
        sessionsQuery.isSuccess,
        sessionsQuery.data,
        createSession,
    ]);

    if (repoQuery.isLoading) {
        return (
            <AppShell title="Loading chat…">
                <div className="grid flex-1 gap-4 p-4 md:h-[calc(100dvh-var(--header)-var(--shell-header))] md:grid-cols-[18rem_1fr] md:p-6">
                    <Skeleton className="min-h-80 rounded-2xl" />
                    <div className="flex min-h-[70vh] flex-col gap-4">
                        <Skeleton className="flex-1 rounded-2xl" />
                        <Skeleton className="h-24 rounded-2xl" />
                    </div>
                </div>
            </AppShell>
        );
    }

    if (repoQuery.isError || !repoQuery.data) {
        return (
            <AppShell title="Repository unavailable">
                <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 animate-fade-up">
                    <p className="text-sm text-muted-foreground">
                        {(repoQuery.error as Error)?.message ?? "Repository not found"}
                    </p>
                    <Button render={<Link href="/dashboard" />}>Back to dashboard</Button>
                </div>
            </AppShell>
        );
    }

    const repo = repoQuery.data;

    const enhancedRepo = {
        ...repo,
        indexStatus: (indexStatus ?? repo.indexStatus) as NonNullable<typeof indexStatus>,
        filesProcessed:
            statusQuery.data?.filesProcessed ?? repo.filesProcessed,
        filesTotal: statusQuery.data?.filesTotal ?? repo.filesTotal,
        chunkCount: statusQuery.data?.chunkCount ?? repo.chunkCount,
        errorMessage: statusQuery.data?.errorMessage ?? repo.errorMessage,
    } as const;

    return (
        <AppShell
            title={repo.fullName}
            description={
                ready
                    ? "Ask questions grounded in this repository"
                    : "Waiting for indexing to finish"
            }
            actions={
                <div className="flex items-center gap-2">
                    {ready && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={newChat}
                            disabled={createSession.isPending}
                        >
                            <MessageSquarePlus className="size-4" />
                            <span className="hidden sm:inline">New chat</span>
                        </Button>
                    )}
                    <Button variant="outline" size="sm" render={<Link href="/dashboard" />}>
                        <ArrowLeft className="size-4" />
                        <span className="hidden sm:inline">Repos</span>
                        <FolderGit2 className="size-4 sm:hidden" />
                    </Button>
                </div>
            }
        >
            <div className="relative flex min-h-0 flex-1 flex-col md:flex-row md:h-[calc(100dvh-var(--header)-var(--shell-header))]">
                <ChatSidebar
                    repo={enhancedRepo}
                    sessionId={sessionId}
                    onSelectSession={setSelectedSessionId}
                />

                <section
                    key={sessionId ?? "empty"}
                    className="relative flex min-h-[72vh] min-w-0 flex-1 flex-col md:min-h-0 overflow-hidden"
                >
                    {!ready ? (
                        <IndexingState repo={repo} status={statusQuery.data} />
                    ) : (
                        <div className="absolute inset-0 flex min-w-0 flex-col animate-fade-in">
                            <ChatMessages
                                repo={enhancedRepo}
                                messages={messagesQuery.data ?? []}
                                streamText={streamText}
                                isLoading={messagesQuery.isLoading}
                                streaming={streaming}
                                onRegenerate={regenerate}
                                regenerating={regenerating}
                            />
                            <ChatComposer
                                disabled={!sessionId}
                                streaming={streaming}
                                onSend={send}
                                onStop={stop}
                            />
                        </div>
                    )}
                </section>
            </div>
        </AppShell>
    );
}
