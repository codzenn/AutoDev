"use client";

import { useMemo, useState } from "react";
import {
    FolderGit2,
    Lock,
    MessageSquare,
    MessageSquarePlus,
    PanelLeftClose,
    PanelLeftOpen,
    RotateCcw,
    Search,
    X,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

import { IndexStatusBadge } from "@/components/dashboard/repo-status";
import { LanguageBadge } from "@/components/dashboard/language-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatSessions, useCreateChatSession } from "@/hooks/use-chat";
import { useStartIndexing } from "@/hooks/use-repos";
import type { ChatSession, Repository } from "@/lib/api";
import { cn } from "@/lib/utils";

function TimeBadge({ iso }: { iso: string | undefined }) {
    if (!iso) return null;
    const date = new Date(iso);
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();
    const diffHrs = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return (
        <span className="shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground/80">
            {sameDay
                ? format(date, "h:mm a")
                : diffHrs < 24 * 5
                    ? formatDistanceToNow(date, { addSuffix: false })
                    : format(date, "MMM d")}
        </span>
    );
}

function ConversationRow({
                             session,
                             active,
                             collapsed,
                             onClick,
                             delay,
                         }: {
    session: ChatSession;
    active: boolean;
    collapsed: boolean;
    onClick: () => void;
    delay: number;
}) {
    const content = (
        <button
            type="button"
            onClick={onClick}
            aria-label={`Conversation ${session.title}`}
            aria-current={active ? "page" : undefined}
            className={cn(
                "group/row w-full text-left transition-all duration-200",
                collapsed
                    ? "flex size-9 items-center justify-center rounded-xl"
                    : "rounded-xl p-2"
            )}
        >
            <div
                className={cn(
                    collapsed
                        ? "flex size-8 items-center justify-center rounded-lg transition-colors"
                        : "flex items-start gap-2.5 rounded-xl p-2 transition-all duration-200"
                )}
                style={!collapsed ? { animationDelay: `${delay}ms` } : undefined}
            >
                {collapsed ? (
                    <>
                        <MessageSquare
                            className={cn(
                                "size-4 transition-colors",
                                active
                                    ? "text-[oklch(0.55_0.16_265)] dark:text-[oklch(0.7_0.16_265)]"
                                    : "text-muted-foreground group-hover/row:text-foreground"
                            )}
                        />
                    </>
                ) : (
                    <>
                        <div
                            className={cn(
                                "mt-0.5 flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg transition-all",
                                active
                                    ? "bg-gradient-to-br from-[oklch(0.52_0.16_265)] to-[oklch(0.5_0.14_220)] text-white shadow-sm shadow-[oklch(0.5_0.14_240)_/_0.18]"
                                    : "bg-muted text-muted-foreground group-hover/row:bg-[oklch(0.55_0.14_265_/_0.12)] group-hover/row:text-[oklch(0.48_0.14_250)] dark:group-hover/row:text-[oklch(0.72_0.14_260)]"
                            )}
                        >
                            <MessageSquare className="size-3.5" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center justify-between gap-2">
                                <p
                                    className={cn(
                                        "truncate text-[13px] leading-tight",
                                        active
                                            ? "font-semibold text-foreground"
                                            : "font-medium text-foreground/90 group-hover/row:text-foreground"
                                    )}
                                >
                                    {session.title}
                                </p>
                                <TimeBadge iso={session.createdAt} />
                            </div>
                            <p className="line-clamp-1 truncate text-[11.5px] leading-tight text-muted-foreground/80">
                                {session.title}
                            </p>
                        </div>
                    </>
                )}
            </div>
            {!collapsed && (
                <div
                    className={cn(
                        "pointer-events-none absolute inset-y-1 left-1 w-0.5 rounded-full opacity-0 transition-opacity",
                        active && "bg-[oklch(0.55_0.16_265)] dark:bg-[oklch(0.7_0.16_265)] opacity-100"
                    )}
                    aria-hidden
                />
            )}
        </button>
    );

    if (collapsed) {
        return (
            <div className="relative animate-fade-in">
                <div
                    title={`${session.title} · ${format(new Date(session.createdAt), "MMM d, h:mm a")}`}
                >
                    {content}
                </div>
            </div>
        );
    }

    return (
        <div className="relative animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
            {content}
        </div>
    );
}

function SidebarPanel({
                          repo,
                          sessionId,
                          onSelectSession,
                          collapsed,
                          onToggleCollapse,
                          onCloseMobile,
                          showCollapseButton = true,
                      }: {
    repo: Repository;
    sessionId: string | null;
    onSelectSession: (id: string) => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
    onCloseMobile?: () => void;
    showCollapseButton?: boolean;
}) {
    const ready = repo.indexStatus === "READY";
    const sessionsQuery = useChatSessions(repo.id, ready);
    const createSession = useCreateChatSession(repo.id);
    const reindex = useStartIndexing();
    const [search, setSearch] = useState("");

    const sorted = useMemo(() => {
        const list = sessionsQuery.data ?? [];
        const q = search.trim().toLowerCase();
        const filtered = q
            ? list.filter((s) => s.title.toLowerCase().includes(q))
            : list;
        return [...filtered].sort(
            (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [sessionsQuery.data, search]);

    const today: ChatSession[] = [];
    const week: ChatSession[] = [];
    const earlier: ChatSession[] = [];
    const sections = useMemo(() => {
        if (sorted.length === 0) return { t: [], w: [], e: [] };
        const latestTime = new Date(sorted[0].createdAt).getTime();
        const t: ChatSession[] = [];
        const w: ChatSession[] = [];
        const e: ChatSession[] = [];
        for (const s of sorted) {
            const d = new Date(s.createdAt).getTime();
            const diffDays = (latestTime - d) / (1000 * 60 * 60 * 24);
            if (diffDays < 1) t.push(s);
            else if (diffDays < 7) w.push(s);
            else e.push(s);
        }
        return { t, w, e };
    }, [sorted]);
    today.push(...sections.t);
    week.push(...sections.w);
    earlier.push(...sections.e);

    return (
        <aside
            aria-label="Conversation history"
            className={cn(
                "relative z-10 flex h-full min-h-0 shrink-0 flex-col border-b border-border/60 transition-[width,transform] duration-200 ease-linear md:border-b-0 md:border-r md:border-border/60 md:bg-sidebar/40 backdrop-blur-xl",
                collapsed ? "md:w-[72px]" : "w-full md:w-[280px]"
            )}
        >
            {/* Header: New chat + collapse */}
            <div
                className={cn(
                    "flex items-center gap-2 border-b border-border/50",
                    collapsed ? "p-2 flex-col" : "p-3"
                )}
            >
                {collapsed ? (
                    <>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9"
                            disabled={!ready || createSession.isPending}
                            onClick={() =>
                                createSession.mutate("New chat", {
                                    onSuccess: (s) => onSelectSession(s.id),
                                })
                            }
                            aria-label="New chat"
                            title="New chat"
                        >
                            <MessageSquarePlus className="size-4.5" />
                        </Button>
                        {showCollapseButton && (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={onToggleCollapse}
                                className="h-9 w-9"
                                aria-label="Expand sidebar"
                                title="Expand sidebar"
                            >
                                <PanelLeftOpen className="size-4" />
                            </Button>
                        )}
                    </>
                ) : (
                    <>
                        <Button
                            size="sm"
                            className={cn(
                                "flex-1 justify-start gap-2 border border-border/60 bg-background/50 shadow-sm transition-all hover:bg-background hover:shadow-md",
                                createSession.isPending && "opacity-70"
                            )}
                            variant="outline"
                            disabled={!ready || createSession.isPending}
                            onClick={() =>
                                createSession.mutate("New chat", {
                                    onSuccess: (s) => onSelectSession(s.id),
                                })
                            }
                        >
                            <MessageSquarePlus className="size-4" />
                            <span className="truncate">New chat</span>
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={onToggleCollapse}
                            aria-label="Collapse sidebar"
                            className="shrink-0"
                        >
                            <PanelLeftClose className="size-4" />
                        </Button>
                        {onCloseMobile && (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={onCloseMobile}
                                aria-label="Close sidebar"
                                className="shrink-0 md:hidden"
                            >
                                <X className="size-4" />
                            </Button>
                        )}
                    </>
                )}
            </div>

            {/* Repo summary row */}
            {!collapsed && (
                <div className="space-y-2 border-b border-border/50 p-3">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[oklch(0.55_0.14_265_/_0.18)] to-[oklch(0.5_0.14_220_/_0.14)] ring-1 ring-border/60">
                            {repo.language ? (
                                <LanguageBadge language={repo.language} showLabel={false} />
                            ) : (
                                <FolderGit2 className="size-4.5 text-[oklch(0.45_0.14_250)] dark:text-[oklch(0.75_0.14_260)]" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[13px] leading-tight">
                                <span className="truncate text-muted-foreground">
                                    {repo.owner}
                                </span>
                                <span className="text-muted-foreground/50">/</span>
                                <span className="truncate font-semibold text-foreground">
                                    {repo.name}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                                <IndexStatusBadge status={repo.indexStatus} />
                                {repo.isPrivate && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/90">
                                        <Lock className="size-2.5" />
                                        Private
                                    </span>
                                )}
                                {repo.language && (
                                    <span className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/90">
                                        {repo.language}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground/80" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search conversations"
                                className="h-8 border-dashed bg-background/50 pl-8 pr-3 text-xs shadow-sm focus-visible:ring-2 focus-visible:ring-ring/20"
                            />
                        </div>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => reindex.mutate(repo.id)}
                            disabled={
                                reindex.isPending || repo.indexStatus === "INDEXING"
                            }
                            aria-label="Re-index repository"
                            title="Re-index repo"
                            className="shrink-0 h-8 w-8"
                        >
                            <RotateCcw
                                className={cn("size-3.5", reindex.isPending && "animate-spin")}
                            />
                        </Button>
                    </div>
                </div>
            )}

            {/* Body: grouped list */}
            <ScrollArea className="min-h-0 flex-1">
                <div
                    className={cn(
                        "space-y-0.5 pb-3",
                        collapsed ? "flex flex-col items-center gap-1 p-2" : "p-2"
                    )}
                >
                    {sessionsQuery.isLoading &&
                        Array.from({ length: collapsed ? 4 : 5 }).map((_, i) =>
                            collapsed ? (
                                <Skeleton key={i} className="size-8 rounded-lg" />
                            ) : (
                                <div key={i} className="p-2">
                                    <div className="flex items-start gap-3">
                                        <Skeleton className="size-7 shrink-0 rounded-lg" />
                                        <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
                                            <Skeleton className="h-3 w-3/4 rounded-md" />
                                            <Skeleton className="h-2.5 w-full rounded-md" />
                                        </div>
                                    </div>
                                </div>
                            )
                        )}

                    {!collapsed && !ready && (
                        <div className="mx-1 mb-2 rounded-xl border border-dashed border-border/70 bg-muted/30 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground/90">
                            Conversations unlock after indexing completes.
                        </div>
                    )}

                    {!sessionsQuery.isLoading && sorted.length === 0 && ready && !collapsed && (
                        <div className="mx-1 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center">
                            <MessageSquare className="size-5 text-muted-foreground/60" />
                            <p className="text-xs font-medium text-muted-foreground/90">
                                No conversations yet
                            </p>
                            <p className="px-2 text-[11px] text-muted-foreground/70">
                                Start a new chat to begin chatting with your code.
                            </p>
                        </div>
                    )}

                    {[
                        { label: "Today", list: today },
                        { label: "Previous 7 days", list: week },
                        { label: "Earlier", list: earlier },
                    ].map((section) => {
                        if (section.list.length === 0 || collapsed) return null;
                        return (
                            <div key={section.label} className="pt-2">
                                <div className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                                    {section.label}
                                </div>
                                <div className="space-y-0.5">
                                    {section.list.map((session, idx) => (
                                        <ConversationRow
                                            key={session.id}
                                            session={session}
                                            active={sessionId === session.id}
                                            collapsed={false}
                                            delay={Math.min(idx, 6) * 20}
                                            onClick={() => {
                                                onSelectSession(session.id);
                                                onCloseMobile?.();
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {collapsed &&
                        sorted.slice(0, 10).map((session, idx) => (
                            <ConversationRow
                                key={session.id}
                                session={session}
                                active={sessionId === session.id}
                                collapsed
                                delay={Math.min(idx, 6) * 20}
                                onClick={() => onSelectSession(session.id)}
                            />
                        ))}

                    {search.trim() !== "" && sorted.length === 0 && !collapsed && (
                        <p className="px-3 py-4 text-center text-xs text-muted-foreground/80">
                            No conversations match “{search}”.
                        </p>
                    )}
                </div>
            </ScrollArea>

            {/* Footer stats */}
            {!collapsed && (
                <>
                    <Separator className="opacity-60" />
                    <div className="flex items-center justify-between gap-2 px-4 py-3 text-[11px] text-muted-foreground/85">
                        <span className="truncate">
                            {repo.chunkCount > 0
                                ? `${repo.chunkCount.toLocaleString()} indexed chunks`
                                : "Waiting for index"}
                        </span>
                        <span className="shrink-0 tabular-nums">
                            {repo.filesTotal > 0
                                ? `${repo.filesProcessed}/${repo.filesTotal} files`
                                : null}
                        </span>
                    </div>
                </>
            )}
        </aside>
    );
}

export function ChatSidebar({
                                repo,
                                sessionId,
                                onSelectSession,
                            }: {
    repo: Repository;
    sessionId: string | null;
    onSelectSession: (id: string) => void;
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    return (
        <>
            <div className="hidden min-h-0 md:block">
                <SidebarPanel
                    repo={repo}
                    sessionId={sessionId}
                    onSelectSession={onSelectSession}
                    collapsed={collapsed}
                    onToggleCollapse={() => setCollapsed((c) => !c)}
                />
            </div>

            {/* Mobile: top conversation switcher */}
            <div className="flex items-center gap-2 border-b border-border/60 glass-strong px-3 py-2.5 md:hidden">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMobileOpen(true)}
                    className="flex-1 justify-start gap-2 border-dashed shadow-sm"
                >
                    <div className="flex size-6 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[oklch(0.55_0.14_265_/_0.18)] to-[oklch(0.5_0.14_220_/_0.14)]">
                        <FolderGit2 className="size-3.5 text-[oklch(0.45_0.14_250)] dark:text-[oklch(0.75_0.14_260)]" />
                    </div>
                    <div className="min-w-0 text-left">
                        <p className="truncate text-[12px] font-semibold leading-tight tracking-tight">
                            {repo.fullName}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground/90 leading-tight">
                            Tap to open conversations
                        </p>
                    </div>
                </Button>
            </div>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent
                    side="left"
                    className="w-full max-w-[88%] border-r-0 p-0 sm:max-w-sm bg-background"
                >
                    <SheetTitle className="sr-only">Conversations</SheetTitle>
                    <div className="h-[100dvh]">
                        <SidebarPanel
                            repo={repo}
                            sessionId={sessionId}
                            onSelectSession={onSelectSession}
                            collapsed={false}
                            onToggleCollapse={() => {}}
                            onCloseMobile={() => setMobileOpen(false)}
                            showCollapseButton={false}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
