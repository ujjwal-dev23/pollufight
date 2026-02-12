"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Send, CheckCircle2, User, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useAuth } from "@/context/AuthContext"
import { AuthModal } from "../AuthModal"

export function VoiceMatter() {
    const { user } = useAuth()
    const [comment, setComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!comment.trim()) return

        setIsSubmitting(true)
        setError(null)

        try {
            await addDoc(collection(db, "comments"), {
                text: comment.trim(),
                timestamp: serverTimestamp(),
                author: user?.displayName || "Citizen",
                userId: user?.uid || null,
            })

            setIsSuccess(true)
            setComment("")
            setTimeout(() => setIsSuccess(false), 5000)
        } catch (err) {
            console.error("Error adding comment:", err)
            setError("Failed to submit your feedback. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="text-orange-500">Your</span> Voice <span className="text-green-500">Matters!</span>
                        </h2>
                        <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto">
                            Share your insights, concerns, or ideas with us. Your feedback directly
                            powers our AI policy analysis engine to build a better future.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <Card className="border-emerald-500/20 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors duration-500" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -ml-16 -mb-16 group-hover:bg-cyan-500/10 transition-colors duration-500" />

                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                        <MessageSquare className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Community Feedback</CardTitle>
                                        <CardDescription>We listen to every voice</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="relative">
                                        <Textarea
                                            placeholder="Type your feedback here..."
                                            className="min-h-[160px] bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all text-base resize-none"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            disabled={isSubmitting || isSuccess}
                                        />
                                        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground/50">
                                            {comment.length} characters
                                        </div>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {error && (
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-sm text-red-400 px-1"
                                            >
                                                {error}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-lg font-medium relative group overflow-hidden"
                                        disabled={isSubmitting || isSuccess || !comment.trim()}
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {isSubmitting ? (
                                                <>Submitting...</>
                                            ) : isSuccess ? (
                                                <>
                                                    <CheckCircle2 className="h-5 w-5" />
                                                    Feedback Shared!
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                    Share My Voice
                                                </>
                                            )}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Button>
                                </form>

                                <div className="flex flex-wrap gap-6 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
                                        <User className="h-4 w-4" />
                                        <span>
                                            {user ? (
                                                <span className="text-emerald-400 font-mono">OFFICER: {user.displayName}</span>
                                            ) : (
                                                <button
                                                    onClick={() => setIsAuthModalOpen(true)}
                                                    className="hover:text-emerald-400 transition-colors underline decoration-dotted"
                                                >
                                                    SIGN IN TO IDENTIFY
                                                </button>
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
                                        <Clock className="h-4 w-4" />
                                        <span>Real-time AI Integration</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </section>
    )
}
