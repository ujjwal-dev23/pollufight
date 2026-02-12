"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowUp, Clock, Car, Factory, Banknote, Award, HardHat, User as UserIcon, Copy, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { doc, onSnapshot, setDoc, updateDoc, query, collection, where, orderBy, QuerySnapshot, DocumentData } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getUserId } from "@/lib/user-id"
import { useAuth } from "@/context/AuthContext"
import { AuthModal } from "./AuthModal"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"

const TYPE_ICONS: Record<string, any> = {
  "Vehicle Emission": Car,
  "Factory Discharge": Factory,
  "Construction Dust": HardHat,
  "Industrial": Factory,
  "Construction": HardHat,
  "Waste Management": Factory,
}

function AnimatedCheckmark({ delay }: { delay: number }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neon-green">
      <motion.path
        d="M5 12l5 5L19 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
      />
    </svg>
  )
}

export function EcoWallet() {
  const { user, logout } = useAuth()
  const [displayCredits, setDisplayCredits] = useState(0)
  const [history, setHistory] = useState<any[]>([])
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [redeemedCoupon, setRedeemedCoupon] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Fetch/Create User and Subscribe to Credits
  useEffect(() => {
    // Priority: Authenticated User ID > Local Storage User ID
    const id = user?.uid || getUserId()
    const userRef = doc(db, "user_credits", id)

    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        setDisplayCredits(data.credits || 0)
      } else {
        // Create document if it doesn't exist
        try {
          await setDoc(userRef, {
            credits: 150,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        } catch (error) {
          console.error("Error creating user document:", error)
        }
      }
    })

    // Subscribe to User's History
    const historyQuery = query(
      collection(db, "pollution_reports"),
      where("userId", "==", id),
      orderBy("timestamp", "desc")
    )

    const historyUnsubscribe = onSnapshot(historyQuery, (snapshot: QuerySnapshot<DocumentData>) => {
      const reports = snapshot.docs.map(doc => {
        const data = doc.data()
        const timestamp = data.timestamp?.toDate()
        let timeStr = "Just now"

        if (timestamp) {
          const diff = Math.floor((Date.now() - timestamp.getTime()) / 60000)
          if (diff < 1) timeStr = "JUST NOW"
          else if (diff < 60) timeStr = `${diff}M AGO`
          else if (diff < 1440) timeStr = `${Math.floor(diff / 60)}H AGO`
          else timeStr = `${Math.floor(diff / 1440)}D AGO`
        }

        return {
          id: doc.id,
          type: data.type || "Pollution Report",
          credits: data.severity === "critical" ? 50 : 25, // Mock credit values for display
          time: timeStr,
          verified: data.status === "resolved",
          status: data.status
        }
      })
      setHistory(reports)
    })

    return () => {
      unsubscribe()
      historyUnsubscribe()
    }
  }, [user])

  const handleRedeem = async () => {
    if (!user && !getUserId()) return
    if (displayCredits <= 0) {
      toast.error("You need credits to redeem a subsidy!")
      return
    }

    setIsRedeeming(true)
    const id = user?.uid || getUserId()
    const userRef = doc(db, "user_credits", id)

    try {
      // Reset credits to 0
      await updateDoc(userRef, {
        credits: 0,
        updatedAt: new Date()
      })

      // Generate a fun coupon code
      const coupon = `CITIZEN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      setRedeemedCoupon(coupon)
      setShowSuccessModal(true)
      toast.success("Credits redeemed successfully!")
    } catch (error) {
      console.error("Redemption error:", error)
      toast.error("Failed to redeem credits. Please try again.")
    } finally {
      setIsRedeeming(false)
    }
  }

  const copyCoupon = () => {
    if (redeemedCoupon) {
      navigator.clipboard.writeText(redeemedCoupon)
      toast.success("Coupon code copied!")
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center bg-card/30 p-4 rounded-2xl border border-border">
        <div className="flex flex-col items-start">
          <h2 className="font-mono text-lg tracking-widest text-foreground">ECOWALLET</h2>
          {user && (
            <p className="font-mono text-[10px] text-primary uppercase tracking-widest mt-1">
              Officer: {user.displayName || "Anonymous Scout"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="font-mono text-[10px] uppercase tracking-tighter h-8"
            >
              Sign Out
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAuthModalOpen(true)}
              className="font-mono text-[10px] uppercase tracking-tighter h-8 border-primary text-primary hover:bg-primary/10"
            >
              Link Account
            </Button>
          )}
          <Button variant="ghost" size="icon" className="rounded-full">
            <UserIcon className="w-5 h-5 text-foreground" />
          </Button>
        </div>
      </motion.div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Credits Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-card/50 border border-neon-green/30 rounded-xl p-6 text-center"
      >
        <p className="font-mono text-xs text-muted-foreground tracking-wider mb-2">AVAILABLE CREDITS</p>
        <div className="flex items-center justify-center gap-2">
          <p className="font-mono text-5xl font-bold animate-gold-shimmer tabular-nums">{displayCredits}</p>
          <span className="font-mono text-2xl text-neon-gold">Credits</span>
          <ArrowUp className="w-5 h-5 text-neon-green" />
        </div>

        <div className="flex items-center justify-center gap-2 mt-4">
          <motion.div
            className="animate-metallic-sheen"
            animate={{ rotateY: [0, 5, 0, -5, 0] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <Award className="w-5 h-5 text-neon-yellow" style={{ filter: "drop-shadow(0 0 4px var(--neon-yellow))" }} />
          </motion.div>
          <p className="font-mono text-xs text-neon-yellow tracking-wider">ELITE SCOUT TIER</p>
        </div>
      </motion.div>

      {/* Verification History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-mono text-xs tracking-wider text-muted-foreground">VERIFICATION HISTORY</h3>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-muted-foreground/30 rounded-xl">
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
              No reports filed yet
            </p>
          </div>
        ) : (
          history.map((item, index) => {
            const Icon = TYPE_ICONS[item.type] || Factory
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`flex items-center justify-between p-4 rounded-xl border bg-card/30 transition-all border-border`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <p className="font-mono text-sm text-foreground">{item.type}</p>
                    <div className="flex items-center gap-1">
                      <AnimatedCheckmark delay={0.5 + index * 0.2} />
                      <p className="font-mono text-[10px] text-neon-green tracking-wider">
                        {item.status === 'resolved' ? 'VERIFIED' : item.status.toUpperCase()} {item.time}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="font-mono text-lg text-neon-green">+{item.credits}</p>
              </motion.div>
            )
          })
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Button
          className="w-full font-mono text-xs tracking-wider bg-neon-green text-background hover:bg-neon-green/90 h-12"
          onClick={handleRedeem}
          disabled={isRedeeming || displayCredits <= 0}
        >
          {isRedeeming ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-background/20 border-t-background animate-spin" />
              REDEEMING...
            </div>
          ) : (
            <>
              <Banknote className="w-4 h-4 mr-2" />
              REDEEM CREDITS
            </>
          )}
        </Button>
      </motion.div>

      {/* Redemption Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 max-w-sm mx-auto rounded-3xl p-8">
          <DialogHeader className="items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-neon-green/10 flex items-center justify-center mb-2">
              <Award className="w-8 h-8 text-neon-green" />
            </div>
            <DialogTitle className="font-mono text-2xl font-bold tracking-tighter text-foreground uppercase text-center">
              You are the true citizen!
            </DialogTitle>
            <DialogDescription className="font-mono text-xs text-muted-foreground leading-relaxed uppercase tracking-widest text-center">
              Your contribution to the air quality of our city is being rewarded. Use this coupon for your next clean energy subsidy.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 space-y-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-green to-emerald-500 rounded-xl opacity-20 blur group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em]">UNIQUE SUBSIDY CODE</span>
                <div className="flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-neon-green" />
                  <span className="font-mono text-2xl font-bold tracking-widest text-foreground">{redeemedCoupon}</span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full font-mono text-xs tracking-widest border-neon-green/20 hover:bg-neon-green/5 py-6"
              onClick={copyCoupon}
            >
              <Copy className="w-4 h-4 mr-2" />
              COPY COUPON CODE
            </Button>

            <p className="text-[10px] font-mono text-center text-muted-foreground uppercase tracking-widest pt-2">
              Valid for 30 days • Applied to EV/Solar subsidies
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
