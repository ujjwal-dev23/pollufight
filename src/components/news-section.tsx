"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Newspaper, ExternalLink, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface NewsItem {
    id: string
    title: string
    source: string
    time: string
    summary: string
    tag: "CRITICAL" | "UPDATE" | "GLOBAL" | "POLCY"
    url: string
}

export function NewsSection() {
    const [news, setNews] = useState<NewsItem[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchNews = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)

        try {
            // Add timestamp to bypass browser caching
            const response = await fetch(`http://localhost:8000/api/pollution/news?t=${Date.now()}`, {
                cache: 'no-store'
            })
            if (!response.ok) throw new Error("Failed to fetch news")
            const data = await response.json()
            console.log("News fetched successfully:", data.length, "items")

            if (!data || data.length === 0) throw new Error("No news items returned")

            // Format relative time if possible, or just use the pubDate
            const formattedNews = data.map((item: any) => {
                const date = new Date(item.time)
                const now = new Date()
                const diffMs = now.getTime() - date.getTime()
                const diffMins = Math.floor(diffMs / 60000)

                let timeLabel = item.time
                if (diffMins < 60) timeLabel = `${diffMins}m ago`
                else if (diffMins < 1440) timeLabel = `${Math.floor(diffMins / 60)}h ago`
                else timeLabel = `${Math.floor(diffMins / 1440)}d ago`

                return { ...item, time: timeLabel }
            })

            setNews(formattedNews)
        } catch (err) {
            console.error("News API failed, providing randomized fallback:", err)

            const fallbackPool: NewsItem[] = [
                {
                    id: "demo-1",
                    title: "Policy Update: New Emission Standards for Industrial Zones",
                    source: "Jan-Kavch Intelligence",
                    time: "2h ago",
                    summary: "Recent reports suggest a 15% reduction in particulate matter after the implementation of new industrial scrubbers.",
                    tag: "POLCY",
                    url: "#"
                },
                {
                    id: "demo-2",
                    title: "Community Spotlight: Solar Park Expansion in Haryana",
                    source: "Eco Watch",
                    time: "5h ago",
                    summary: "Local energy projects continue to offset carbon footprints of neighboring manufacturing clusters.",
                    tag: "UPDATE",
                    url: "#"
                },
                {
                    id: "demo-3",
                    title: "Global Observation: Himalayan Air Quality Stabilizes",
                    source: "World News",
                    time: "1d ago",
                    summary: "Satellite data confirms a seasonal improvement in upper atmospheric clarity across the northern belt.",
                    tag: "GLOBAL",
                    url: "#"
                },
                {
                    id: "demo-4",
                    title: "Action Alert: GRAP-III Measures Re-evaluated for Weekend",
                    source: "Pollution Desk",
                    time: "12m ago",
                    summary: "Authorities may restrict non-essential construction activities if AQI remains above 400 for 24 hours.",
                    tag: "CRITICAL",
                    url: "#"
                },
                {
                    id: "demo-5",
                    title: "Innovation: AI-Powered Smog Towers Show 30% Efficiency Gain",
                    source: "Tech Journal",
                    time: "3h ago",
                    summary: "New filtration algorithms allow local towers to process 5,000 cubic meters more air per hour.",
                    tag: "UPDATE",
                    url: "#"
                },
                {
                    id: "demo-6",
                    title: "Policy: Electric Vehicle Subsidy Extended for Goods Carriers",
                    source: "State Gazette",
                    time: "6h ago",
                    summary: "The transport department aims to convert 40% of last-mile delivery fleets to EV by year-end.",
                    tag: "POLCY",
                    url: "#"
                }
            ]

            // Shuffle and pick 4 random items for the fallback
            const randomized = [...fallbackPool]
                .sort(() => Math.random() - 0.5)
                .slice(0, 4)
                .map(item => ({ ...item, id: `${item.id}-${Date.now()}` })) // Ensure unique keys for re-animation

            setNews(randomized)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchNews()
    }, [])

    const handleMoreNews = () => {
        fetchNews(true)
    }

    const getTagStyle = (tag: string) => {
        switch (tag) {
            case "CRITICAL": return "bg-red-500/10 text-red-500 border-red-500/20"
            case "POLCY": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
            case "GLOBAL": return "bg-purple-500/10 text-purple-500 border-purple-500/20"
            default: return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <Newspaper className="w-5 h-5 text-primary" />
                        Live Pollution News
                    </h2>
                    <p className="text-sm text-muted-foreground font-mono">Real-time environmental intelligence</p>
                </div>
                <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mt-1.5" />
                    <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">LIVE FEED</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-32 rounded-xl bg-muted/20 animate-pulse border border-border/50" />
                    ))
                ) : (
                    news.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card className="border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all group cursor-pointer overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getTagStyle(item.tag)}`}>
                                            {item.tag}
                                        </span>
                                        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {item.time}
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">
                                        {item.title}
                                    </h3>

                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                                        {item.summary}
                                    </p>

                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <span className="text-[10px] font-mono font-bold tracking-tight text-muted-foreground group-hover:text-foreground transition-colors">
                                            {item.source}
                                        </span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full group-hover:bg-primary/20 group-hover:text-primary">
                                            <ExternalLink className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>

            {!loading && (
                <Button
                    variant="outline"
                    onClick={handleMoreNews}
                    disabled={refreshing}
                    className="w-full border-primary/20 hover:bg-primary/5 font-mono text-xs tracking-widest uppercase py-6"
                >
                    {refreshing ? (
                        <div className="flex items-center gap-3">
                            <span className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                            FETCHING INTELLIGENCE...
                        </div>
                    ) : (
                        "Discover More News"
                    )}
                </Button>
            )}
        </div>
    )
}
