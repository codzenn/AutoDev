"use client"

import React, {useState} from 'react'
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

const QueryProvider = ({children}: { children: React.ReactNode }) => {
    const [query, setQuery] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={query}>{children}</QueryClientProvider>
    )
}
export default QueryProvider
