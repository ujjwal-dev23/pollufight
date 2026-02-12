"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Camera, Map, Wallet, Activity, LogOut, User, LogIn } from "lucide-react"
import type { TacticalTab } from "@/App"
import { useAuth } from "@/context/AuthContext"
import { AuthModal } from "../AuthModal"

interface LandingHeaderProps {
  onEnterTactical: (tab?: TacticalTab) => void
}

export function LandingHeader({ onEnterTactical }: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const { user, logout } = useAuth()

  const navLinks = [
    { label: "AI Lens", href: "#", icon: Camera, tab: "ai-lens" as TacticalTab },
    { label: "Pollution Tracker", href: "#", icon: Map, tab: "pollution-tracker" as TacticalTab },
    { label: "Wallet", href: "#", icon: Wallet, tab: "wallet" as TacticalTab },
    { label: "Pulse", href: "#", icon: Activity, tab: "pulse" as TacticalTab },
  ]

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg bg-emerald flex items-center justify-center">
              <Activity className="w-5 h-5 text-white animate-heartbeat" />
              <div className="absolute inset-0 rounded-lg bg-emerald/50 animate-ping-ripple" />
            </div>
            <span className="font-semibold text-lg text-foreground">Jan-Kavach</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <button
                  key={link.label}
                  onClick={() => onEnterTactical(link.tab)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </button>
              )
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald/10 border border-emerald/20">
                  <User className="w-4 h-4 text-emerald" />
                  <span className="text-xs font-mono font-bold text-emerald">{user.displayName || "OFFICER"}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAuthModalOpen(true)}
                className="border-border text-foreground hover:bg-emerald/5 hover:border-emerald/50"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}

            <Button
              size="sm"
              className="bg-emerald hover:bg-emerald/90 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              onClick={() => onEnterTactical("pulse")}
            >
              Dashboard
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <button
                    key={link.label}
                    onClick={() => {
                      setMobileMenuOpen(false)
                      onEnterTactical(link.tab)
                    }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </button>
                )
              })}
              <div className="flex flex-col gap-2 pt-3 border-t border-border">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald/10 border border-emerald/20">
                      <User className="w-5 h-5 text-emerald" />
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest leading-none mb-1">Authenticated Officer</span>
                        <span className="text-sm font-bold text-emerald">{user.displayName || "Unknown"}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-400 hover:bg-red-400/5 hover:text-red-400 border-red-400/20"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        logout()
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setIsAuthModalOpen(true)
                    }}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                )}

                <Button
                  className="bg-emerald hover:bg-emerald/90 text-white"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onEnterTactical("pulse")
                  }}
                >
                  Dashboard
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  )
}
