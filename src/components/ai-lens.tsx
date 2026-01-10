"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, RotateCcw, Upload, FileText, ScanLine, Activity, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uploadToCloudinary } from "@/services/cloudinary-service"
import { analyzeImage, type AnalysisResult } from "@/services/pollution-service"

type LensState = "capture" | "uploading" | "analyzing" | "verified" | "error"

const DEMO_KEYWORDS = [
  "waste", "trash", "garbage", "rubbish", "dump", "plastic", "bottle",
  "car", "vehicle", "traffic", "truck", "bus",
  "smoke", "fire", "factory", "industry", "chimney"
];

export function AILens() {
  const [state, setState] = useState<LensState>("capture")
  const [progress, setProgress] = useState(0)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCapture = () => {
    // For now, capture button also triggers upload as camera integration is separate/complex
    fileInputRef.current?.click()
  }

  const processFile = async (file: File) => {
    try {
      const filename = file.name.toLowerCase();
      const isDemo = DEMO_KEYWORDS.some(keyword => filename.includes(keyword));

      let imageUrl = "skipped";

      if (!isDemo) {
        setState("uploading")
        setProgress(10)

        // Upload to Cloudinary
        imageUrl = await uploadToCloudinary(file)
        setProgress(50)
      } else {
        console.log("Demo image detected, skipping upload:", file.name);
        // Simulate upload time for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        setProgress(50);
      }

      setState("analyzing")

      // Analyze with Pollution Detector
      const result = await analyzeImage(imageUrl, file.name)
      setAnalysisResult(result)
      setProgress(100)

      setState("verified")
    } catch (err) {
      console.error(err)
      setErrorMsg(String(err))
      setState("error")
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const handleReset = () => {
    setState("capture")
    setProgress(0)
    setAnalysisResult(null)
    setErrorMsg("")
  }

  return (
    <div className="h-full flex flex-col relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/*"
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {state === "capture" && <CaptureView onCapture={handleCapture} onUpload={handleUploadClick} />}
        {(state === "uploading" || state === "analyzing") && <ProcessingView state={state} progress={progress} />}
        {state === "verified" && analysisResult && <ResultView result={analysisResult} onReset={handleReset} />}
        {state === "error" && <ErrorView message={errorMsg} onRetry={handleReset} />}
      </AnimatePresence>
    </div>
  )
}

function CaptureView({ onCapture, onUpload }: { onCapture: () => void; onUpload: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col"
    >
      {/* Viewfinder */}
      <div className="flex-1 relative bg-slate-900 m-4 rounded-xl overflow-hidden border border-border">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: "url('/factory-smoke-pollution-industrial.jpg')" }}
        />

        {/* Viewfinder overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 border-2 border-neon-green/50 rounded-lg relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-green" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neon-green" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-neon-green" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-green" />
          </div>
        </div>

        {/* Scanning laser animation */}
        <motion.div
          className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-neon-green to-transparent"
          style={{ boxShadow: "0 0 10px var(--neon-green), 0 0 20px var(--neon-green)" }}
          animate={{ top: ["10%", "90%", "10%"] }}
          transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />

        {/* Computer Vision / AI detection label */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Activity className="w-3 h-3 text-neon-green animate-pulse" />
            <span className="font-mono text-[10px] text-neon-green">COMPUTER VISION ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 mb-4">
        <p className="font-mono text-xs text-muted-foreground text-center">
          AI-powered image analysis for pollution detection using computer vision
        </p>
      </div>

      {/* Action buttons */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex gap-3 justify-center">
          {/* Upload Image button with pulse animation */}
          <Button
            onClick={onUpload}
            variant="outline"
            className="flex-1 font-mono text-xs tracking-wider border-border text-muted-foreground hover:text-foreground bg-transparent hover:bg-card/50 group"
          >
            <Upload className="w-4 h-4 mr-2 group-hover:animate-pulse" />
            UPLOAD IMAGE
          </Button>

          {/* Scan & Analyze button with activity animation */}
          <Button
            onClick={onCapture}
            className="flex-1 font-mono text-xs tracking-wider bg-neon-green text-background hover:bg-neon-green/90 group"
          >
            <ScanLine className="w-4 h-4 mr-2 group-hover:animate-pulse" />
            SCAN & ANALYZE
          </Button>
        </div>

        {/* Capture button */}
        <div className="flex justify-center">
          <Button
            onClick={onCapture}
            size="lg"
            className="w-16 h-16 rounded-full bg-neon-green/20 border-2 border-neon-green text-neon-green hover:bg-neon-green/30"
          >
            <Camera className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

function ProcessingView({ state, progress }: { state: string; progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-6 bg-background space-y-8"
    >
      <div className="relative w-32 h-32 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 border-4 border-neon-green/30 rounded-full"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0 border-t-4 border-neon-green rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        <Activity className="w-12 h-12 text-neon-green" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold font-mono tracking-wider text-neon-green">
          {state === "uploading" ? "UPLOADING..." : "ANALYZING..."}
        </h2>
        <p className="text-sm text-muted-foreground font-mono">
          {state === "uploading"
            ? "Encrypting and transmitting data securely"
            : "Running neural network pollution detection models"}
        </p>
      </div>

      <div className="w-64 h-1 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-neon-green"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  )
}

function ResultView({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col p-4 overflow-y-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-neon-green/10 rounded-full">
          <CheckCircle className="w-6 h-6 text-neon-green" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Analysis Complete</h2>
          <p className="text-xs text-muted-foreground font-mono">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="p-4 bg-card border border-border rounded-xl space-y-2">
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Detected Pollution</span>
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-bold text-foreground">{result.pollution_type}</h3>
            <span className="text-sm font-mono text-neon-green font-bold">
              {(result.confidence_level * 100).toFixed(1)}% CONFIDENCE
            </span>
          </div>
          <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mt-2">
            <div className="h-full bg-neon-green" style={{ width: `${result.confidence_level * 100}%` }} />
          </div>
        </div>

        {result.details.length > 0 && (
          <div className="p-4 bg-card/50 border border-border rounded-xl">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono block mb-3">Detected Objects</span>
            <div className="flex flex-wrap gap-2">
              {result.details.map((detail, idx) => (
                <span key={idx} className="px-2 py-1 bg-secondary rounded text-xs font-mono">
                  {detail.label} ({Math.round(detail.score * 100)}%)
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-card p-4 rounded-xl border border-neon-green/20">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-neon-green" />
            <span className="text-xs font-mono text-neon-green">AUTO-GENERATED LEGAL DRAFT</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap">
            {result.legal_draft}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-4 space-y-3">
        <Button onClick={() => { }} className="w-full bg-neon-green text-background hover:bg-neon-green/90 font-mono tracking-wider">
          <FileText className="w-4 h-4 mr-2" />
          FILE OFFICIAL COMPLAINT
        </Button>
        <Button onClick={onReset} variant="outline" className="w-full border-border hover:bg-secondary font-mono tracking-wider">
          <RotateCcw className="w-4 h-4 mr-2" />
          ANALYZE NEW IMAGE
        </Button>
      </div>
    </motion.div>
  )
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4"
    >
      <div className="p-4 bg-red-500/10 rounded-full">
        <AlertTriangle className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-red-500">Analysis Failed</h2>
      <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Try Again
      </Button>
    </motion.div>
  )
}
