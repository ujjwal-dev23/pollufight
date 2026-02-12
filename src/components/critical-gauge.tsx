"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface CriticalGaugeProps {
  value: number
  city?: string
}

function OdometerDigit({ digit, color }: { digit: string; color: string }) {
  return (
    <motion.span
      key={digit}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="inline-block"
      style={{ color }}
    >
      {digit}
    </motion.span>
  )
}

export function CriticalGauge({ value, city }: CriticalGaugeProps) {
  const [displayValue, setDisplayValue] = useState(0)

  // AQI Scale is usually 0-500
  // Handle percentage for the SVG arc (map 0-500 to 0-100)
  const percentage = Math.min(100, (value / 500) * 100)
  const strokeDasharray = 283
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100

  useEffect(() => {
    const duration = 1500
    const steps = 30
    const targetValue = value
    let current = 0
    const increment = targetValue / steps

    const timer = setInterval(() => {
      current += increment
      if (current >= targetValue) {
        setDisplayValue(targetValue)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  const getColor = () => {
    if (value <= 50) return "#00e400" // Good (Green)
    if (value <= 100) return "#ffff00" // Moderate (Yellow)
    if (value <= 150) return "#ff7e00" // Unhealthy for Sensitive Groups (Orange)
    if (value <= 200) return "#ff0000" // Unhealthy (Red)
    if (value <= 300) return "#8f3f97" // Very Unhealthy (Purple)
    return "#7e0023" // Hazardous (Maroon)
  }

  const getStatus = () => {
    if (value <= 50) return "GOOD"
    if (value <= 100) return "MODERATE"
    if (value <= 150) return "SENSITIVE"
    if (value <= 200) return "UNHEALTHY"
    if (value <= 300) return "VERY UNHEALTHY"
    return "HAZARDOUS"
  }

  return (
    <div className="relative flex flex-col items-center">
      <svg width="220" height="220" className="transform -rotate-90">
        {/* Background arc */}
        <circle
          cx="110"
          cy="110"
          r="90"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDasharray * 0.25}
        />
        {/* Value arc */}
        <motion.circle
          cx="110"
          cy="110"
          r="90"
          fill="none"
          stroke={getColor()}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: strokeDasharray }}
          animate={{ strokeDashoffset: strokeDashoffset + strokeDasharray * 0.25 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            filter: `drop-shadow(0 0 15px ${getColor()}66)`,
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {city && (
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase mb-1">
            {city}
          </span>
        )}
        <div className="font-mono text-6xl font-black tabular-nums tracking-tighter" style={{ color: getColor() }}>
          {String(displayValue)
            .split("")
            .map((digit, i) => (
              <OdometerDigit key={`${i}-${digit}`} digit={digit} color={getColor()} />
            ))}
        </div>
        <div className="flex flex-col items-center mt-1">
          <span className="font-mono text-[10px] text-muted-foreground font-bold tracking-[0.2em]">LIVE AQI</span>
          <motion.span
            className="font-mono text-sm font-black tracking-widest mt-0.5"
            style={{ color: getColor() }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {getStatus()}
          </motion.span>
        </div>
      </div>
    </div>
  )
}
