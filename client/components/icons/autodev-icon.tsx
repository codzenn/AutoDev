import type {SVGProps} from "react";

import {cn} from "@/lib/utils";

type AutoDevIconProps = SVGProps<SVGSVGElement> & {
    variant?: "color" | "mono";
};

export function AutodevIcon({
                                 className,
                                 variant = "color",
                                 ...props
                             }: AutoDevIconProps) {
    const mono = variant === "mono";

    return (
        <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={cn("shrink-0", className)}
            {...props}
        >
            <defs>
                <linearGradient id="autodev-icon-bg" x1="5" y1="3" x2="59" y2="62" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#172554"/>
                    <stop offset=".52" stopColor="#312E81"/>
                    <stop offset="1" stopColor="#0F172A"/>
                </linearGradient>
                <linearGradient id="autodev-icon-a" x1="17" y1="48" x2="47" y2="14" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#67E8F9"/>
                    <stop offset="1" stopColor="#A7F3D0"/>
                </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill={mono ? "currentColor" : "url(#autodev-icon-bg)"}/>
            <path
                d="M10 49.5 19 14h7l9 35.5h-6.5l-2-8.5H18.5l-2 8.5H10Zm10-14h5l-2.5-10.8L20 35.5Z"
                fill={mono ? "var(--background)" : "url(#autodev-icon-a)"}
            />
            <path
                d="m35 23 7 7m0 0 8-8m-8 8v11m0 0-8 7m8-7 8 7"
                fill="none"
                stroke={mono ? "var(--background)" : "#C4B5FD"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="42" cy="30" r="3.5" fill={mono ? "var(--background)" : "#FDE68A"}/>
            <circle cx="50" cy="22" r="3" fill={mono ? "var(--background)" : "#67E8F9"}/>
            <circle cx="42" cy="41" r="3" fill={mono ? "var(--background)" : "#A7F3D0"}/>
            <circle cx="34" cy="48" r="3" fill={mono ? "var(--background)" : "#C4B5FD"}/>
            <circle cx="50" cy="48" r="3" fill={mono ? "var(--background)" : "#C4B5FD"}/>
        </svg>
    );
}

export function AutoDevLogo({
                                 className,
                                 ...props
                             }: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 220 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={cn("shrink-0", className)}
            {...props}
        >
            <defs>
                <linearGradient id="autodev-logo-bg" x1="5" y1="3" x2="59" y2="62" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#172554"/>
                    <stop offset=".52" stopColor="#312E81"/>
                    <stop offset="1" stopColor="#0F172A"/>
                </linearGradient>
                <linearGradient id="autodev-logo-a" x1="17" y1="48" x2="47" y2="14" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#67E8F9"/>
                    <stop offset="1" stopColor="#A7F3D0"/>
                </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill="url(#autodev-logo-bg)"/>
            <path
                d="M10 49.5 19 14h7l9 35.5h-6.5l-2-8.5H18.5l-2 8.5H10Zm10-14h5l-2.5-10.8L20 35.5Z"
                fill="url(#autodev-logo-a)"
            />
            <path
                d="m35 23 7 7m0 0 8-8m-8 8v11m0 0-8 7m8-7 8 7"
                fill="none"
                stroke="#C4B5FD"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="42" cy="30" r="3.5" fill="#FDE68A"/>
            <circle cx="50" cy="22" r="3" fill="#67E8F9"/>
            <circle cx="42" cy="41" r="3" fill="#A7F3D0"/>
            <circle cx="34" cy="48" r="3" fill="#C4B5FD"/>
            <circle cx="50" cy="48" r="3" fill="#C4B5FD"/>
            <path
                fill="currentColor"
                d="M80 44.5V19.5h8.4c5.2 0 8.6 2.7 8.6 7.2 0 3.1-1.6 5.4-4.2 6.4l5.1 11.4h-5.9l-4.6-10.4h-2.4v10.4H80zm5.2-14.6h2.8c2.5 0 3.9-1.2 3.9-3.3s-1.4-3.2-3.9-3.2h-2.8v6.5zM108.2 44.9c-6.1 0-10.1-4.2-10.1-10.6s4-10.6 10.1-10.6 10.1 4.2 10.1 10.6-4 10.6-10.1 10.6zm0-4.5c3.1 0 4.9-2.3 4.9-6.1s-1.8-6.1-4.9-6.1-4.9 2.3-4.9 6.1 1.8 6.1 4.9 6.1zM131.6 44.5V19.5h5.2v25h-5.2zM145.8 44.5l8.7-25h5.7l8.7 25h-5.6l-1.5-4.6h-9.1l-1.5 4.6h-5.4zm10.1-15.9-3.1 9.6h6.2l-3.1-9.6zM176.8 44.9c-6.1 0-10.1-4.2-10.1-10.6s4-10.6 10.1-10.6c3.6 0 6.4 1.5 7.9 4.1l-4.4 2.5c-.7-1.3-1.9-2-3.5-2-2.8 0-4.7 2.2-4.7 6s1.9 6 4.7 6c1.6 0 2.8-.7 3.5-2l4.4 2.5c-1.5 2.6-4.3 4.1-7.9 4.1zM199.8 44.5V19.5h8.4c5.2 0 8.6 2.7 8.6 7.2 0 3.1-1.6 5.4-4.2 6.4l5.1 11.4h-5.9l-4.6-10.4h-2.4v10.4h-5.2zm5.2-14.6h2.8c2.5 0 3.9-1.2 3.9-3.3s-1.4-3.2-3.9-3.2h-2.8v6.5z"
            />
        </svg>
    );
}