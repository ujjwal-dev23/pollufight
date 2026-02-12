import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mail, Lock, User, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile
} from "firebase/auth"
import { auth } from "@/lib/firebase"

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password)
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password)
                await updateProfile(userCredential.user, { displayName: name })
            }
            onClose()
        } catch (err: any) {
            console.error("Auth error:", err)
            setError(err.message || "Authentication failed. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold font-mono tracking-tight">
                                    {isLogin ? "IDENTITY VERIFICATION" : "COMMUNITY ENROLLMENT"}
                                </h2>
                                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {!isLogin && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                placeholder="Officer Name / Citizen Name"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                            placeholder="citizen@jan-kavch.org"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs font-mono uppercase tracking-tight">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full font-mono tracking-widest h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        isLogin ? "INITIALIZE SESSION" : "CREATE ACCOUNT"
                                    )}
                                </Button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-xs font-mono text-muted-foreground">
                                    {isLogin ? "First mission?" : "Already verified?"}{" "}
                                    <button
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="text-primary hover:underline font-bold"
                                    >
                                        {isLogin ? "ENLIST HERE" : "SIGN IN"}
                                    </button>
                                </p>
                            </div>
                        </div>

                        <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-data-flow" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
