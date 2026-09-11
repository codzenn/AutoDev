"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizontal, Square, CornerDownLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function ChatComposer({
                                 disabled,
                                 streaming,
                                 onSend,
                                 onStop,
                             }: {
    disabled?: boolean;
    streaming?: boolean;
    onSend: (content: string) => void | Promise<void>;
    onStop?: () => void;
}) {
    const [value, setValue] = useState("");
    const [focused, setFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const pendingSendRef = useRef(false);

    const hasValue = value.trim().length > 0;

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const next = Math.min(Math.max(el.scrollHeight, 52), 240);
        el.style.height = `${next}px`;
    }, [value, focused]);

    useEffect(() => {
        if (!streaming) pendingSendRef.current = false;
    }, [streaming]);

    async function submit() {
        const content = value.trim();
        if (!content || disabled || streaming || pendingSendRef.current) {
            return;
        }
        pendingSendRef.current = true;
        setValue("");
        try {
            await onSend(content);
        } finally {
            pendingSendRef.current = false;
        }
        requestAnimationFrame(() => {
            const el = textareaRef.current;
            if (el) el.style.height = "auto";
        });
    }

    return (
        <div
            className="relative z-10 border-t border-border/55 bg-gradient-to-b from-transparent via-background/80 to-background/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-4 sm:pb-5 backdrop-blur-xl"
            role="region"
            aria-label="Message input"
        >
            <div className="mx-auto w-full max-w-3xl space-y-2.5">
                <div
                    className={cn(
                        "relative flex items-end gap-2 rounded-2xl border bg-background/80 px-2.5 py-2 shadow-[0_0_0_1px_transparent] transition-all duration-200",
                        focused
                            ? "border-ring/60 shadow-[0_0_0_4px_oklch(0.55_0.14_265_/_0.10),0_8px_28px_-10px_oklch(0.5_0.14_260_/_0.25)]"
                            : "border-border/70 shadow-sm hover:border-border/90 hover:shadow-md"
                    )}
                >
                    <Textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={
                            disabled
                                ? "Waiting for index to complete…"
                                : "Message AutoDev…"
                        }
                        disabled={disabled}
                        rows={1}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        aria-label={
                            disabled ? "Chat disabled until index completes" : "Type your message"
                        }
                        className={cn(
                            "min-h-[52px] max-h-60 flex-1 resize-none border-0 bg-transparent px-2.5 py-2.5 pr-0 pb-1.5 text-[0.95rem]/relaxed shadow-none focus-visible:ring-0 focus-visible:outline-none placeholder:text-muted-foreground/75",
                        )}
                        onKeyDown={(e) => {
                            if (
                                e.key === "Enter" &&
                                !e.shiftKey &&
                                !e.nativeEvent.isComposing &&
                                !(e.metaKey || e.ctrlKey || e.altKey)
                            ) {
                                e.preventDefault();
                                void submit();
                            }
                        }}
                    />

                    <div className="flex shrink-0 items-end gap-1.5 pb-1.5 pr-1">
                        {streaming ? (
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={onStop}
                                aria-label="Stop generating"
                                className="h-9 w-9 transition-all duration-200 border-border/70 hover:bg-muted"
                            >
                                <Square className="size-4" fill="currentColor" />
                            </Button>
                        ) : (
                            <Button
                                size="icon"
                                disabled={disabled || !hasValue}
                                onClick={() => void submit()}
                                aria-label="Send message"
                                className={cn(
                                    "h-9 w-9 transition-all duration-200",
                                    hasValue && !disabled
                                        ? "bg-foreground text-background shadow-md shadow-foreground/10 hover:bg-foreground/90 active:scale-95"
                                        : ""
                                )}
                            >
                                {disabled ? (
                                    <Spinner />
                                ) : (
                                    <SendHorizontal
                                        className={cn(
                                            "size-4 transition-transform duration-200",
                                            hasValue ? "translate-x-0 opacity-100" : "-translate-x-0.5 opacity-80"
                                        )}
                                    />
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 px-0.5">
                    <p className="flex items-center gap-2 text-[11px] text-muted-foreground/85">
                        <span className="inline-flex items-center gap-1.5">
                            <Kbd>
                                <span className="inline-flex items-center font-mono">Enter</span>
                            </Kbd>
                            <span>to send</span>
                        </span>
                        <span className="text-muted-foreground/50">·</span>
                        <span className="inline-flex items-center gap-1.5">
                            <Kbd>Shift</Kbd>
                            <span>+</span>
                            <Kbd>
                                <span className="inline-flex items-center gap-1">
                                    <CornerDownLeft className="size-2.5 -ml-0.5" />
                                    <span className="font-mono">Enter</span>
                                </span>
                            </Kbd>
                            <span>new line</span>
                        </span>
                    </p>
                    <span
                        className={cn(
                            "text-[10px] font-medium tabular-nums transition-colors",
                            value.length > 1800
                                ? "text-destructive"
                                : value.length > 0
                                    ? "text-muted-foreground/75"
                                    : "text-muted-foreground/40"
                        )}
                        aria-live="polite"
                    >
                        {value.length}/2000
                    </span>
                </div>
            </div>
        </div>
    );
}
