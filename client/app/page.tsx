"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-auth";
import { BrandMark } from "@/components/layout/app-shell";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/icons/github-icon";
import { getGithubLoginUrl } from "@/lib/api";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Brain, Code2, GitBranch, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const features = [
    {
        icon: Code2,
        title: "Code-aware conversations",
        description: "Ask questions about your codebase and get precise, contextual answers backed by real source files.",
    },
    {
        icon: GitBranch,
        title: "GitHub sync",
        description: "One-click indexing of any public or private repository. Always in sync with your default branch.",
    },
    {
        icon: Brain,
        title: "Intelligent retrieval",
        description: "Semantic search across code chunks finds relevant context even across files and modules.",
    },
];

export default function Home() {
    const router = useRouter();
    const { data: user, isLoading } = useCurrentUser();

    useEffect(() => {
        if (!isLoading && user) {
            router.replace("/dashboard");
        }
    }, [user, isLoading, router]);

    if (isLoading || user) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-background">
                <div className="animate-pulse text-sm text-muted-foreground">
                    Loading…
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-svh flex-col overflow-hidden bg-background">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[oklch(0.55_0.14_265_/_0.12)] blur-3xl" />
                <div className="absolute bottom-0 right-0 h-[380px] w-[520px] rounded-full bg-[oklch(0.5_0.14_220_/_0.10)] blur-3xl" />
            </div>

            <header className="relative z-10 flex h-16 items-center justify-between px-4 md:px-8">
                <Link href="/" className="transition-transform duration-200 hover:scale-[1.02]">
                    <BrandMark />
                </Link>
                <div className="flex items-center gap-3">
                    <ModeToggle />
                    <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link href="/login" />}
                    >
                        Sign in
                    </Button>
                </div>
            </header>

            <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-16 md:px-8">
                <section className="mx-auto w-full max-w-4xl flex flex-col items-center text-center animate-fade-up">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
                        <Sparkles className="size-3.5 text-primary" />
                        Chat with any repository, instantly
                    </div>

                    <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
                        Understand your codebase
                        <span className="block bg-gradient-to-r from-[oklch(0.55_0.16_265)] via-[oklch(0.58_0.14_245)] to-[oklch(0.52_0.14_220)] bg-clip-text text-transparent">
                            through conversation.
                        </span>
                    </h1>

                    <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
                        AutoDev indexes your GitHub repositories and turns them into
                        AI-searchable knowledge. Ask questions, trace bugs, and ship
                        faster with code-aware answers.
                    </p>

                    <div className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
                        <a
                            href={getGithubLoginUrl()}
                            className={cn(
                                "inline-flex min-w-[220px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[oklch(0.55_0.16_265)] via-[oklch(0.58_0.14_245)] to-[oklch(0.52_0.14_220)] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.98] shadow-xl shadow-primary/25"
                            )}
                        >
                            <GitHubIcon className="size-5" />
                            Get started with GitHub
                        </a>
                    </div>
                </section>

                <section
                    id="features"
                    className="mx-auto mt-24 grid w-full max-w-5xl gap-4 sm:grid-cols-3"
                >
                    {features.map((feature, idx) => (
                        <Card
                            key={feature.title}
                            className={cn(
                                "animate-fade-up gradient-border glass",
                                idx === 0 && "[animation-delay:100ms]",
                                idx === 1 && "[animation-delay:200ms]",
                                idx === 2 && "[animation-delay:300ms]"
                            )}
                        >
                            <CardHeader>
                                <div className="mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.55_0.14_265_/_0.18)] to-[oklch(0.5_0.14_220_/_0.18)] text-[oklch(0.45_0.14_250)] dark:text-[oklch(0.75_0.14_260)]">
                                    <feature.icon className="size-5" />
                                </div>
                                <CardTitle className="tracking-tight">{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-sm leading-relaxed">
                                    {feature.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </section>
            </main>

            <footer className="relative z-10 border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
                Built for developers who move fast.
            </footer>
        </div>
    );
}
