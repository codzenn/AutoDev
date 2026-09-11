import type {Metadata} from "next";
import {Geist, Geist_Mono, JetBrains_Mono, Merriweather} from "next/font/google";
import "./globals.css";
import {cn} from "@/lib/utils";
import {ThemeProvider} from "@/components/providers/theme-provider";
import QueryProvider from "@/components/providers/query-provider";

const merriweatherHeading = Merriweather({subsets: ['latin'], variable: '--font-heading'});

const jetbrainsMono = JetBrains_Mono({subsets: ['latin'], variable: '--font-mono'});

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        default: "AutoDev — Chat with Your Code",
        template: "%s · AutoDev",
    },
    description: "AutoDev indexes your GitHub repositories and lets you chat with your codebase using AI. Search, understand, and build faster with code-aware conversations.",
    metadataBase: new URL("http://localhost"),
    openGraph: {
        title: "AutoDev — Chat with Your Code",
        description: "AI-powered code understanding for your GitHub repositories. Index your codebase and have intelligent conversations with it.",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "AutoDev — Chat with Your Code",
        description: "AI-powered code understanding for your GitHub repositories.",
    },
};

export default function RootLayout({children}: LayoutProps<"/">) {
    return (
        <html
            lang="en"
            className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-mono", jetbrainsMono.variable, merriweatherHeading.variable)}
        >
        <body className="min-h-full flex flex-col">
        <QueryProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {children}
            </ThemeProvider>
        </QueryProvider>
        </body>
        </html>
    );
}
