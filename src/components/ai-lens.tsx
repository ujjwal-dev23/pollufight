"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, RotateCcw, Upload, FileText, Activity, AlertTriangle, CheckCircle } from "lucide-react"
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

  // Handle file selection from input
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  // Handle captured image from camera
  const handleCameraCapture = (file: File) => {
    processFile(file)
  }

  const handleUploadClick = () => {
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
        {state === "capture" && <CaptureView key="capture" onCapture={handleCameraCapture} onUpload={handleUploadClick} />}
        {(state === "uploading" || state === "analyzing") && <ProcessingView key="processing" state={state} progress={progress} />}
        {state === "verified" && analysisResult && <ResultView key="result" result={analysisResult} onReset={handleReset} />}
        {state === "error" && <ErrorView key="error" message={errorMsg} onRetry={handleReset} />}
      </AnimatePresence>
    </div>
  )
}

function CaptureView({ onCapture, onUpload }: { onCapture: (file: File) => void; onUpload: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // const [stream, setStream] = useState<MediaStream | null>(null) // Removed unused state
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null) // Added for keying
  const [error, setError] = useState<string>("")

  // Start camera on mount with proper cleanup
  useEffect(() => {
    let currentStream: MediaStream | null = null;
    let isMounted = true;

    const initCamera = async () => {
      try {
        // Try with environment facing mode for rear camera
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false
        })

        if (!isMounted) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        currentStream = mediaStream;
        setActiveStream(mediaStream);
        setError("")
      } catch (err) {
        if (isMounted) {
          console.error("Camera error:", err)
          setError("Camera unavailable. " + String(err))
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    }
  }, [])

  // Attach stream to video element whenever it changes
  useEffect(() => {
    if (activeStream && videoRef.current) {
      videoRef.current.srcObject = activeStream;
      // Note: play() is triggered by onLoadedMetadata in the video tag
    }
  }, [activeStream])

  const handleShutter = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      // Set canvas dimensions to match video stream
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })
            onCapture(file)
          }
        }, 'image/jpeg', 0.9)
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col z-0"
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* Viewfinder */}
      <div className="flex-1 relative bg-black m-4 rounded-xl overflow-hidden shadow-2xl border border-white/10 min-h-[60vh]">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div className="space-y-4">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
              <p className="text-white font-mono text-sm">{error}</p>
              <Button onClick={onUpload} variant="outline" className="mt-2">Use Upload Instead</Button>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => {
              videoRef.current?.play().catch(e => console.error("Play error:", e));
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Viewfinder overlay */}
        {!error && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border border-neon-green/30 rounded-lg relative">
                {/* Corners */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-neon-green" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-neon-green" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-neon-green" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-neon-green" />
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 pb-10 flex items-center justify-center relative">
        {/* Upload Button */}
        <div className="absolute left-6">
          <Button
            onClick={onUpload}
            variant="outline"
            className="font-mono text-xs tracking-wider border-border text-muted-foreground hover:text-foreground bg-transparent hover:bg-card/50 group px-3"
          >
            <Upload className="w-4 h-4 group-hover:animate-pulse" />
            <span className="hidden sm:inline ml-2">UPLOAD IMAGE</span>
          </Button>
        </div>

        {/* Shutter Button */}
        <Button
          onClick={handleShutter}
          disabled={!!error}
          className="w-20 h-20 rounded-full bg-neon-green hover:bg-neon-green/90 p-1 border-4 border-background ring-2 ring-neon-green shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-transform active:scale-95 z-10"
        >
          <Camera className="w-8 h-8 text-black" />
        </Button>
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
