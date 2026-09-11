"use client";

import { Bot, Check, CheckCheck, Copy, RefreshCcw, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";

import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { CitationChips } from "@/components/chat/citation-chips";
import { useCurrentUser } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage, Repository } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

function formatTime(iso: string | undefined) {
    if (!iso) return "";
    try {
        return format(new Date(iso), "h:mm a");
    } catch {
        return "";
    }
}

function TypingIndicator() {
    return (
        <div
            className="flex items-start gap-3 animate-fade-in px-3 sm:px-6"
            role="status"
            aria-live="polite"
            aria-label="AutoDev is thinking"
        >
            <Avatar className="mt-1 size-7 shrink-0 rounded-full shadow-sm shadow-[oklch(0.5_0.14_240)_/_0.2] overflow-hidden">
                <AvatarFallback className="rounded-full bg-gradient-to-br from-[oklch(0.48_0.14_265)] to-[oklch(0.52_0.14_220)] text-white">
                    <Bot className="size-3.5" />
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-center gap-2 rounded-3xl bg-muted px-4 py-3 ring-1 ring-foreground/5">
                    <span className="size-1.5 rounded-full bg-muted-foreground/55 animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-1.5 rounded-full bg-muted-foreground/55 animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-1.5 rounded-full bg-muted-foreground/55 animate-bounce" />
                    <span className="ml-2 text-xs font-medium text-muted-foreground/80">
                        Thinking…
                    </span>
                </div>
            </div>
        </div>
    );
}

function MessageActions({
                            message,
                            isUser,
                            isLatestAssistant,
                            onRegenerate,
                            regenerating,
                        }: {
    message: ChatMessage;
    isUser: boolean;
    isLatestAssistant: boolean;
    onRegenerate?: () => void;
    regenerating?: boolean;
}) {
    const [copied, setCopied] = useState(false);

    async function copy() {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            toast.add({
                title: isUser ? "Message copied" : "Response copied",
                description: isUser
                    ? "Your message is in the clipboard."
                    : "AutoDev's response is in the clipboard.",
                type: "success",
            });
            setTimeout(() => setCopied(false), 1800);
        } catch {
            toast.add({
                title: "Could not copy",
                description: "Clipboard access is unavailable.",
                type: "error",
            });
        }
    }

    return (
        <div
            className={cn(
                "flex items-center gap-0.5 opacity-0 transition-all duration-200 group-hover/message:opacity-100 focus-within:opacity-100",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            {!isUser && isLatestAssistant && (
                <button
                    type="button"
                    onClick={onRegenerate}
                    disabled={regenerating}
                    aria-label="Regenerate response"
                    title="Regenerate"
                    className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50 disabled:hover:bg-transparent",
                        regenerating && "opacity-80"
                    )}
                >
                    <RefreshCcw
                        className={cn("size-3.5", regenerating && "animate-spin")}
                    />
                </button>
            )}

            <button
                type="button"
                onClick={copy}
                aria-label={copied ? "Copied" : "Copy message"}
                aria-pressed={copied}
                title={copied ? "Copied" : "Copy"}
                className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/40",
                    copied && "text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
                )}
            >
                {copied ? (
                    <Check className="size-3.5" strokeWidth={2.5} />
                ) : (
                    <Copy className="size-3.5" />
                )}
            </button>
        </div>
    );
}

function MessageRow({
                        idx,
                        message,
                        repo,
                        userAvatar,
                        userDisplay,
                        isLatestUser,
                        hasAssistantAfter,
                        isLatestAssistant,
                        onRegenerate,
                        regenerating,
                    }: {
    idx: number;
    message: ChatMessage;
    repo: Repository;
    userAvatar?: string | null;
    userDisplay?: string | null;
    isLatestUser: boolean;
    hasAssistantAfter: boolean;
    isLatestAssistant: boolean;
    onRegenerate?: () => void;
    regenerating?: boolean;
}) {
    const isUser = message.role === "USER";
    const time = formatTime(message.createdAt);

    return (
        <article
            data-message-id={message.id}
            role="article"
            aria-label={`${isUser ? "You" : "AutoDev"} — ${time ? time : ""}`}
            className={cn(
                "group/message relative flex w-full gap-3 px-3 sm:px-6 animate-fade-up",
                isUser ? "flex-row justify-end" : "flex-row justify-start"
            )}
            style={idx < 16 ? { animationDelay: `${Math.min(idx, 16) * 18}ms` } : undefined}
        >
            {/* Assistant avatar */}
            {!isUser && (
                <Avatar className="mt-0.5 size-7 shrink-0 rounded-full overflow-hidden shadow-sm shadow-[oklch(0.5_0.14_240)_/_0.2]">
                    <AvatarFallback className="rounded-full bg-gradient-to-br from-[oklch(0.48_0.14_265)] to-[oklch(0.52_0.14_220)] text-white">
                        <Bot className="size-3.5" />
                    </AvatarFallback>
                </Avatar>
            )}

            {/* Content */}
            <div
                className={cn(
                    "flex min-w-0 flex-col gap-1.5",
                    isUser
                        ? "items-end max-w-[85%] sm:max-w-[78%]"
                        : "items-start w-full max-w-[92%] sm:max-w-[85%]"
                )}
            >
                {/* Sender label + time, ChatGPT style — only show time near bubble corner */}
                <div
                    className={cn(
                        "flex items-center gap-2 text-[11px] text-muted-foreground/80 tabular-nums",
                        isUser ? "flex-row-reverse" : "flex-row"
                    )}
                >
                    {isUser ? (
                        <>
                            <span className="font-medium text-foreground/85">
                                {userDisplay ?? "You"}
                            </span>
                            {time && <span aria-hidden>·</span>}
                            {time && <time dateTime={message.createdAt}>{time}</time>}
                        </>
                    ) : (
                        <>
                            <span className="font-semibold text-foreground/85 tracking-tight">
                                AutoDev
                            </span>
                            {time && <span aria-hidden>·</span>}
                            {time && <time dateTime={message.createdAt}>{time}</time>}
                        </>
                    )}
                </div>

                {/* Bubble */}
                <div
                    className={cn(
                        "relative flex w-full flex-col",
                        isUser ? "items-end" : "items-start"
                    )}
                >
                    {isUser ? (
                        <div className="w-fit max-w-full rounded-3xl bg-foreground/[0.07] px-4 py-2.5 text-[0.94rem]/relaxed text-foreground ring-1 ring-foreground/5 shadow-sm">
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                    ) : (
                        <div className="w-full max-w-full py-0.5 text-[0.95rem]/relaxed">
                            <ChatMarkdown content={message.content} />
                        </div>
                    )}
                </div>

                {/* Citations (assistant only) */}
                {!isUser && message.citations?.length > 0 && (
                    <div className="w-full pt-1">
                        <CitationChips repo={repo} citations={message.citations} />
                    </div>
                )}

                {/* Actions + read receipt (user) */}
                {isUser ? (
                    <div className="flex items-center gap-2">
                        <MessageActions
                            message={message}
                            isUser
                            isLatestAssistant={false}
                        />
                        {isLatestUser && (
                            <span
                                className={cn(
                                    "inline-flex items-center text-[10px] font-medium tabular-nums",
                                    hasAssistantAfter
                                        ? "text-[oklch(0.55_0.16_265)] dark:text-[oklch(0.7_0.16_265)]"
                                        : "text-muted-foreground/80"
                                )}
                                aria-label={hasAssistantAfter ? "Read" : "Delivered"}
                                title={hasAssistantAfter ? "Read" : "Delivered"}
                            >
                                {hasAssistantAfter ? (
                                    <CheckCheck className="size-3.5" strokeWidth={2.5} />
                                ) : (
                                    <Check className="size-3.5" strokeWidth={2.5} />
                                )}
                            </span>
                        )}
                    </div>
                ) : (
                    <MessageActions
                        message={message}
                        isUser={false}
                        isLatestAssistant={isLatestAssistant}
                        onRegenerate={onRegenerate}
                        regenerating={regenerating}
                    />
                )}
            </div>

            {/* User avatar (only latest user message to match ChatGPT) */}
            {isUser && isLatestUser && (
                <Avatar className="mt-0.5 size-7 shrink-0 rounded-full overflow-hidden ring-1 ring-border/60">
                    {userAvatar ? (
                        <AvatarImage src={userAvatar} alt={userDisplay ?? "You"} />
                    ) : null}
                    <AvatarFallback className="rounded-full bg-gradient-to-br from-[oklch(0.55_0.14_265)] to-[oklch(0.5_0.14_220)] text-white text-[11px] font-medium">
                        {userDisplay ? (
                            userDisplay.slice(0, 2).toUpperCase()
                        ) : (
                            <UserRound className="size-3.5" />
                        )}
                    </AvatarFallback>
                </Avatar>
            )}
        </article>
    );
}

export function ChatMessages({
                                 repo,
                                 messages,
                                 streamText,
                                 isLoading,
                                 streaming,
                                 onRegenerate,
                                 regenerating,
                             }: {
    repo: Repository;
    messages: ChatMessage[];
    streamText?: string;
    isLoading?: boolean;
    streaming?: boolean;
    onRegenerate?: () => void;
    regenerating?: boolean;
}) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const { data: user } = useCurrentUser();
    const [manualScrollLock, setManualScrollLock] = useState(false);
    const scrollViewportRef = useRef<HTMLDivElement>(null);

    const lastAssistant = useMemo(
        () =>
            [...messages].reverse().find((m) => m.role === "ASSISTANT") ??
            null,
        [messages]
    );

    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const lastIsUser = lastMessage?.role === "USER";

    const streamTextClean =
        typeof streamText === "string" ? streamText : String(streamText ?? "");
    const numericNoise =
        streamTextClean.length > 0 &&
        streamTextClean.length <= 16 &&
        /^\d+$/.test(streamTextClean);
    const showTyping =
        (streaming && !streamText) ||
        (streaming && numericNoise) ||
        (streaming && lastIsUser && !streamTextClean);
    const showStreamBubble =
        Boolean(streamText) && !numericNoise && streaming;

    // Smooth auto-scroll to bottom on new content; stop if user scrolls up manually
    useEffect(() => {
        if (manualScrollLock) return;
        const el = bottomRef.current;
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, [messages.length, streamText, streaming, manualScrollLock]);

    // Detect manual scroll up > 120px from bottom → lock auto-scroll
    function onViewportScroll(e: React.UIEvent<HTMLDivElement>) {
        const viewport = e.currentTarget;
        const distanceFromBottom =
            viewport.scrollHeight - (viewport.clientHeight + viewport.scrollTop);
        setManualScrollLock(distanceFromBottom > 160);
    }

    const hasAnyMessages = messages.length > 0 || Boolean(streamText) || streaming;

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-6 px-3 py-8 sm:px-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex items-start gap-3",
                            i % 2 === 1 ? "justify-end" : "justify-start"
                        )}
                    >
                        <Skeleton
                            className={cn(
                                "size-7 shrink-0 rounded-full",
                                i % 2 === 1 && "order-2"
                            )}
                        />
                        <Skeleton
                            className={cn(
                                "rounded-3xl",
                                i % 2 === 1 ? "h-14 w-[62%]" : "h-28 w-[80%]"
                            )}
                        />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <ScrollArea
            className="flex-1 bg-[radial-gradient(ellipse_at_top,_oklch(0.55_0.14_265_/_0.04),transparent_55%)]"
            data-slot="chat-scroll"
        >
            <div
                ref={scrollViewportRef as never}
                onScroll={onViewportScroll}
            />
            <div
                role="log"
                aria-live="polite"
                aria-label="Conversation"
                className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-8 sm:gap-7 sm:py-10"
            >
                {/* Empty state (ChatGPT style welcome card) */}
                {!hasAnyMessages && (
                    <div
                        className="animate-fade-up flex flex-col items-center justify-center gap-5 px-4 text-center"
                        style={{ animationDelay: "50ms" }}
                    >
                        <div className="flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[oklch(0.55_0.14_265)_/_0.18] via-[oklch(0.55_0.14_255_/_0.14)] to-[oklch(0.5_0.14_220_/_0.12)] text-[oklch(0.45_0.14_250)] dark:text-[oklch(0.75_0.14_260)] shadow-inner ring-1 ring-border/60">
                            <Bot className="size-8" strokeWidth={2} />
                        </div>
                        <div className="space-y-2.5">
                            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                                Chat with <span className="italic font-semibold">{repo.name}</span>
                            </h2>
                            <p className="max-w-xl text-sm text-muted-foreground leading-relaxed sm:text-[0.95rem]">
                                Ask questions, trace through bugs, or explore architecture.
                                AutoDev answers grounded in real source code from{" "}
                                <span className="font-medium text-foreground/90">{repo.fullName}</span>.
                            </p>
                        </div>
                        <div className="mt-2 grid w-full max-w-2xl gap-2 sm:grid-cols-2 sm:gap-2.5">
                            {[
                                "Where is authentication handled?",
                                "Explain the repository indexing flow.",
                                "How do sessions and messages connect?",
                                "Summarize the project architecture.",
                            ].map((suggestion, i) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    className="group/suggestion flex w-full items-start gap-2.5 rounded-2xl border border-border/70 bg-card/40 p-3.5 text-left text-sm shadow-sm transition-all hover:border-primary/30 hover:bg-card hover:shadow-md"
                                    style={{ animationDelay: `${140 + i * 90}ms` }}
                                >
                                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[oklch(0.55_0.14_265_/_0.18)] to-[oklch(0.5_0.14_220_/_0.14)] text-[oklch(0.48_0.14_250)] dark:text-[oklch(0.75_0.14_260)]">
                                        <Bot className="size-3" strokeWidth={2.5} />
                                    </span>
                                    <span className="flex-1 font-medium leading-snug text-foreground/90 group-hover/suggestion:text-foreground">
                                        {suggestion}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Messages */}
                {messages.map((message, idx) => {
                    const isLatestAssistant =
                        message.role === "ASSISTANT" && message.id === lastAssistant?.id;
                    const next = messages.slice(idx + 1);
                    const isLatestUser =
                        message.role === "USER" &&
                        next.every((m) => m.role !== "USER");
                    const hasAssistantAfter =
                        message.role === "USER" &&
                        next.some((m) => m.role === "ASSISTANT");

                    return (
                        <MessageRow
                            key={message.id}
                            idx={idx}
                            message={message}
                            repo={repo}
                            userAvatar={user?.avatarUrl}
                            userDisplay={user?.displayName}
                            isLatestUser={isLatestUser}
                            hasAssistantAfter={hasAssistantAfter}
                            isLatestAssistant={isLatestAssistant}
                            onRegenerate={onRegenerate}
                            regenerating={regenerating}
                        />
                    );
                })}

                {/* Streaming bubble: ChatGPT-style assistant row with avatar + inline caret */}
                {showStreamBubble && (
                    <div
                        className="group/message relative flex w-full items-start gap-3 px-3 sm:px-6 animate-fade-in"
                        role="article"
                        aria-live="polite"
                        aria-label="AutoDev is responding"
                    >
                        <Avatar className="mt-0.5 size-7 shrink-0 rounded-full overflow-hidden shadow-sm shadow-[oklch(0.5_0.14_240)_/_0.2]">
                            <AvatarFallback className="rounded-full bg-gradient-to-br from-[oklch(0.48_0.14_265)] to-[oklch(0.52_0.14_220)] text-white">
                                <Bot className="size-3.5" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 w-full max-w-[92%] sm:max-w-[85%] flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80 tabular-nums">
                                <span className="font-semibold text-foreground/85 tracking-tight">
                                    AutoDev
                                </span>
                                <span aria-hidden>·</span>
                                <span className="text-[10px] uppercase tracking-wider">
                                    generating
                                </span>
                            </div>
                            <div className="w-full max-w-full py-0.5 text-[0.95rem]/relaxed">
                                <ChatMarkdown content={streamTextClean} isStreaming />
                                <span className="ml-1 inline-block h-5 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-primary/75 align-middle" />
                            </div>
                        </div>
                    </div>
                )}

                {showTyping && <TypingIndicator />}

                {/* Bottom anchor */}
                <div ref={bottomRef} aria-hidden tabIndex={-1} />
            </div>
        </ScrollArea>
    );
}
