"use client";

import Link from "next/link";
import {
    AlertCircle,
    CheckCircle2,
    FolderGit2,
    LoaderCircle,
    MessageSquareCode,
} from "lucide-react";

import { RepoCard } from "@/components/dashboard/repo-card";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRepos } from "@/hooks/use-repos";
import { cn } from "@/lib/utils";

function StatCard({
                      label,
                      value,
                      hint,
                      icon: Icon,
                      accent,
                  }: {
    label: string;
    value: string | number;
    hint?: string;
    icon: typeof FolderGit2;
    accent?: string;
}) {
    return (
        <Card size="sm" className="animate-fade-up gradient-border overflow-visible">
            <CardHeader className="pb-0">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <CardDescription className="tracking-tight">{label}</CardDescription>
                        <CardTitle className="mt-1 text-2xl font-semibold tracking-tight">{value}</CardTitle>
                    </div>
                    <div
                        className={cn(
                            "rounded-lg p-2 transition-all duration-300",
                            accent ?? "bg-muted text-muted-foreground"
                        )}
                    >
                        <Icon className="size-4" />
                    </div>
                </div>
            </CardHeader>
            {hint ? (
                <CardContent className="pt-0 text-xs text-muted-foreground">
                    {hint}
                </CardContent>
            ) : null}
        </Card>
    );
}

export function OverviewDashboard() {
    const reposQuery = useRepos();
    const repos = reposQuery.data ?? [];

    const readyCount = repos.filter((repo) => repo.indexStatus === "READY").length;
    const indexingCount = repos.filter(
        (repo) => repo.indexStatus === "INDEXING"
    ).length;
    const failedCount = repos.filter((repo) => repo.indexStatus === "FAILED").length;
    const totalChunks = repos.reduce((sum, repo) => sum + repo.chunkCount, 0);
    const recentRepos = [...repos]
        .sort((a, b) => {
            const aTime = a.indexedAt ? new Date(a.indexedAt).getTime() : 0;
            const bTime = b.indexedAt ? new Date(b.indexedAt).getTime() : 0;
            return bTime - aTime;
        })
        .slice(0, 3);

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {reposQuery.isLoading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-28 rounded-xl" />
                    ))
                ) : (
                    <>
                        <StatCard
                            label="Repositories"
                            value={repos.length}
                            hint="Connected from GitHub"
                            icon={FolderGit2}
                            accent="bg-[oklch(0.88_0.06_265_/_0.35)] text-[oklch(0.42_0.14_265)] dark:bg-[oklch(0.35_0.1_265_/_0.35)] dark:text-[oklch(0.78_0.14_265)]"
                        />
                        <StatCard
                            label="Ready to chat"
                            value={readyCount}
                            hint={`${indexingCount} currently indexing`}
                            icon={CheckCircle2}
                            accent="bg-[oklch(0.86_0.08_150_/_0.35)] text-[oklch(0.42_0.12_150)] dark:bg-[oklch(0.32_0.08_150_/_0.35)] dark:text-[oklch(0.76_0.14_150)]"
                        />
                        <StatCard
                            label="Indexed chunks"
                            value={totalChunks.toLocaleString()}
                            hint="Searchable code segments"
                            icon={MessageSquareCode}
                            accent="bg-[oklch(0.86_0.07_200_/_0.35)] text-[oklch(0.4_0.12_200)] dark:bg-[oklch(0.32_0.08_200_/_0.35)] dark:text-[oklch(0.76_0.13_200)]"
                        />
                        <StatCard
                            label="Needs attention"
                            value={failedCount}
                            hint={failedCount > 0 ? "Review failed indexing jobs" : "All repos healthy"}
                            icon={failedCount > 0 ? AlertCircle : LoaderCircle}
                            accent={cn(
                                failedCount > 0
                                    ? "bg-[oklch(0.86_0.08_27_/_0.35)] text-[oklch(0.5_0.18_27)] dark:bg-[oklch(0.38_0.1_27_/_0.35)] dark:text-[oklch(0.76_0.17_22)]"
                                    : "bg-[oklch(0.88_0.05_265_/_0.25)] text-[oklch(0.52_0.1_265)] dark:bg-[oklch(0.34_0.07_265_/_0.3)] dark:text-[oklch(0.72_0.12_265)]"
                            )}
                        />
                    </>
                )}
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <section className="space-y-4 animate-fade-up [animation-delay:120ms]">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="font-heading text-lg font-semibold tracking-tight">Recent repositories</h2>
                            <p className="text-sm text-muted-foreground">
                                Jump back into a repo you have indexed recently.
                            </p>
                        </div>
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium text-primary hover:underline transition-colors"
                        >
                            View all
                        </Link>
                    </div>

                    {reposQuery.isLoading ? (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                            {Array.from({ length: 2 }).map((_, index) => (
                                <Skeleton key={index} className="h-44 rounded-xl" />
                            ))}
                        </div>
                    ) : recentRepos.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                            {recentRepos.map((repo, idx) => (
                                <div key={repo.id} className={cn("animate-fade-up", { "[animation-delay:160ms]": idx === 0, "[animation-delay:200ms]": idx === 1, "[animation-delay:240ms]": idx === 2 })}>
                                    <RepoCard repo={repo} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Card className="animate-fade-up">
                            <CardHeader>
                                <CardTitle>No repositories yet</CardTitle>
                                <CardDescription>
                                    Sync your GitHub repositories to start indexing and chatting
                                    with your code.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link
                                    href="/dashboard"
                                    className="text-sm font-medium text-primary hover:underline transition-colors"
                                >
                                    Go to repositories
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </section>

                <section className="space-y-4 animate-fade-up [animation-delay:280ms]">
                    <div>
                        <h2 className="font-heading text-lg font-semibold tracking-tight">Workspace status</h2>
                        <p className="text-sm text-muted-foreground">
                            A quick snapshot of indexing across your connected repos.
                        </p>
                    </div>

                    <Card className="gradient-border">
                        <CardContent className="space-y-3 pt-6">
                            {reposQuery.isLoading ? (
                                Array.from({ length: 4 }).map((_, index) => (
                                    <Skeleton key={index} className="h-8 rounded-lg" />
                                ))
                            ) : (
                                <>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-muted-foreground">Ready</span>
                                        <Badge variant="secondary" className="bg-[oklch(0.86_0.08_150_/_0.35)] text-[oklch(0.42_0.12_150)] dark:bg-[oklch(0.32_0.08_150_/_0.35)] dark:text-[oklch(0.76_0.14_150)] hover:bg-[oklch(0.86_0.08_150_/_0.45)]">{readyCount}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-muted-foreground">Indexing</span>
                                        <Badge variant="secondary" className="bg-[oklch(0.86_0.07_200_/_0.35)] text-[oklch(0.4_0.12_200)] dark:bg-[oklch(0.32_0.08_200_/_0.35)] dark:text-[oklch(0.76_0.13_200)] hover:bg-[oklch(0.86_0.07_200_/_0.45)]">{indexingCount}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-muted-foreground">Pending</span>
                                        <Badge variant="secondary" className="bg-[oklch(0.88_0.05_265_/_0.25)] text-[oklch(0.52_0.1_265)] dark:bg-[oklch(0.34_0.07_265_/_0.3)] dark:text-[oklch(0.72_0.12_265)] hover:bg-[oklch(0.88_0.05_265_/_0.35)]">
                                            {repos.filter((repo) => repo.indexStatus === "PENDING").length}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-muted-foreground">Failed</span>
                                        <Badge variant={failedCount > 0 ? "destructive" : "secondary"}>
                                            {failedCount}
                                        </Badge>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    );
}