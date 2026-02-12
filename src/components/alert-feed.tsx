"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle } from "lucide-react"

import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore"

interface AlertItem {
  id: string
  message: string
  time: string
  severity: "critical" | "high" | "medium" | "low"
}

export function AlertFeed() {
  const [visibleAlerts, setVisibleAlerts] = useState<AlertItem[]>([])

  useEffect(() => {
    const q = query(
      collection(db, "pollution_reports"),
      orderBy("timestamp", "desc"),
      limit(5)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newAlerts: AlertItem[] = snapshot.docs.map(doc => {
        const data = doc.data()
        const timestamp = data.timestamp?.toDate()
        let timeStr = "Just now"

        if (timestamp) {
          const diff = Math.floor((Date.now() - timestamp.getTime()) / 60000)
          if (diff < 1) timeStr = "Just now"
          else if (diff < 60) timeStr = `${diff}m ago`
          else if (diff < 1440) timeStr = `${Math.floor(diff / 60)}h ago`
          else timeStr = `${Math.floor(diff / 1440)}d ago`
        }

        return {
          id: doc.id,
          message: `${data.site || "Pollution detected"} reported...`,
          time: timeStr,
          severity: (data.severity as any) || "high"
        }
      })

      setVisibleAlerts(newAlerts)
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className="space-y-3">
      <h3 className="font-mono text-xs tracking-wider text-muted-foreground">RECENT ALERTS</h3>

      <AnimatePresence>
        {visibleAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className={`flex items-start gap-3 p-3 rounded-lg border bg-card/30 backdrop-blur-sm ${alert.severity === "critical" || alert.severity === "high"
                ? "border-neon-red/50 shadow-[0_0_15px_rgba(255,68,68,0.15)]"
                : "border-border"
              }`}
          >
            <div
              className={`p-1.5 rounded-full ${alert.severity === "critical" || alert.severity === "high"
                  ? "bg-neon-red/20 text-neon-red animate-pulse-glow"
                  : alert.severity === "medium"
                    ? "bg-neon-yellow/20 text-neon-yellow"
                    : "bg-muted text-muted-foreground"
                }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs text-foreground leading-relaxed truncate">
                &ldquo;{alert.message}&rdquo;
              </p>
              <p className="font-mono text-[10px] text-muted-foreground mt-1">{alert.time}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
