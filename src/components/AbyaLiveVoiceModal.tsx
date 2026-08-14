import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Sparkles,
  Radio,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  GraduationCap,
  Award,
  Zap,
} from "lucide-react";
import { StudentProfile } from "../types";
import { float32To16BitPCMBase64, LiveAudioPlayer } from "../utils/audioUtils";

interface AbyaLiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStudent: StudentProfile;
  customApiKey?: string;
}

type VoiceSessionMode = "tutor" | "viva" | "rapid_quiz";

export const AbyaLiveVoiceModal: React.FC<AbyaLiveVoiceModalProps> = ({
  isOpen,
  onClose,
  activeStudent,
  customApiKey,
}) => {
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "speaking" | "listening" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [transcript, setTranscript] = useState<
    { speaker: "user" | "abya"; text: string; time: string }[]
  >([]);
  const [sessionMode, setSessionMode] = useState<VoiceSessionMode>("tutor");
  const [audioLevel, setAudioLevel] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const liveAudioPlayerRef = useRef<LiveAudioPlayer | null>(null);
  const isSpeakingRef = useRef(false);
  const isMicMutedRef = useRef(false);

  // Sync ref with state to prevent stale closures in onaudioprocess
  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  const addTranscript = (speaker: "user" | "abya", text: string) => {
    if (!text.trim()) return;
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setTranscript((prev) => [...prev, { speaker, text, time }]);
  };

  const cleanupAudio = useCallback(() => {
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current.onaudioprocess = null;
      } catch (e) {
        // ignore
      }
      scriptProcessorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== "closed") {
      try {
        inputAudioCtxRef.current.close();
      } catch (e) {
        // ignore
      }
      inputAudioCtxRef.current = null;
    }

    if (liveAudioPlayerRef.current) {
      liveAudioPlayerRef.current.close();
      liveAudioPlayerRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        // ignore
      }
      wsRef.current = null;
    }
  }, []);

  const startVoiceSession = useCallback(async () => {
    cleanupAudio();
    setStatus("connecting");
    setErrorMessage(null);

    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Initialize 16kHz Input Audio Context for Recording
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      // Buffer size 4096 gives smooth 256ms chunk delivery
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      // 3. Initialize 24kHz Output Live Audio Player
      liveAudioPlayerRef.current = new LiveAudioPlayer();

      // 4. Connect to Backend WebSocket
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const queryParams = new URLSearchParams({
        studentName: activeStudent.name || "Student",
        classLevel: activeStudent.classLevel || "Class 12",
        stream: activeStudent.stream || "Science",
        board: activeStudent.board || "CBSE",
        mode: sessionMode,
      });
      if (customApiKey) {
        queryParams.set("apiKey", customApiKey);
      }

      const wsUrl = `${protocol}//${host}/api/live-voice?${queryParams.toString()}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[Abya Live Voice] WebSocket connection established.");
        setStatus("listening");
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "ready") {
            setStatus("listening");
          } else if (msg.type === "audio" && msg.audio) {
            setStatus("speaking");
            isSpeakingRef.current = true;
            liveAudioPlayerRef.current?.playChunk(msg.audio, () => {
              // chunk ended
            });
            if (msg.text) {
              addTranscript("abya", msg.text);
            }
          } else if (msg.type === "interrupted") {
            liveAudioPlayerRef.current?.stopAndClear();
            setStatus("listening");
            isSpeakingRef.current = false;
          } else if (msg.type === "turnComplete") {
            setStatus("listening");
            isSpeakingRef.current = false;
          } else if (msg.type === "error") {
            console.error("[Abya Live Voice] Server reported error:", msg.error);
            setErrorMessage(msg.error || "Voice conversation error occurred.");
            setStatus("error");
          }
        } catch (e) {
          console.error("[Abya Live Voice] Error parsing incoming WS message:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("[Abya Live Voice] WebSocket error:", err);
        setErrorMessage("Could not connect to Live Voice session.");
        setStatus("error");
      };

      ws.onclose = () => {
        console.log("[Abya Live Voice] WebSocket closed.");
        if (status !== "error") {
          setStatus("idle");
        }
      };

      // 5. Connect Audio Processing Pipeline
      processor.onaudioprocess = (e) => {
        if (isMicMutedRef.current || ws.readyState !== WebSocket.OPEN) {
          setAudioLevel(0);
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate simple volume level for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setAudioLevel(Math.min(100, Math.round(rms * 400)));

        // Send PCM Base64 to Live API
        const base64Pcm = float32To16BitPCMBase64(inputData);
        ws.send(JSON.stringify({ type: "audio", audio: base64Pcm }));
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
    } catch (err: any) {
      console.error("[Abya Live Voice] Failed to start voice session:", err);
      setErrorMessage(
        err?.message?.includes("Permission") || err?.name === "NotAllowedError"
          ? "Microphone permission was denied. Please allow microphone access to talk with Abya."
          : err?.message || "Failed to initialize microphone or live audio stream."
      );
      setStatus("error");
    }
  }, [activeStudent, customApiKey, sessionMode, cleanupAudio, status]);

  // Start on modal open
  useEffect(() => {
    if (isOpen) {
      startVoiceSession();
    } else {
      cleanupAudio();
      setStatus("idle");
      setTranscript([]);
    }
    return () => {
      cleanupAudio();
    };
  }, [isOpen]);

  const toggleMic = () => {
    setIsMicMuted((prev) => !prev);
  };

  const toggleSpeaker = () => {
    setIsSpeakerMuted((prev) => {
      const next = !prev;
      liveAudioPlayerRef.current?.setMuted(next);
      return next;
    });
  };

  const handleInterrupt = () => {
    liveAudioPlayerRef.current?.stopAndClear();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "text", text: "Wait, hold on." }));
    }
    setStatus("listening");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg glass-card border border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 overflow-hidden">
        {/* Ambient Glow */}
        <div
          className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            status === "speaking"
              ? "bg-cyan-500/30"
              : status === "listening"
              ? "bg-emerald-500/30"
              : "bg-indigo-500/20"
          }`}
        />
        <div
          className={`absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            status === "speaking"
              ? "bg-purple-500/30"
              : status === "listening"
              ? "bg-emerald-500/20"
              : "bg-slate-500/10"
          }`}
        />

        {/* Header */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-400 via-cyan-400 to-indigo-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white font-heading">
                  Abya Live Voice
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                  gemini-3.1-flash-live
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>Speaking with:</span>
                <span className="text-emerald-300 font-medium">
                  {activeStudent.name} ({activeStudent.classLevel})
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-pill text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Practice Mode Selector */}
        <div className="grid grid-cols-3 gap-2 z-10">
          <button
            onClick={() => setSessionMode("tutor")}
            className={`p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all border ${
              sessionMode === "tutor"
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10"
                : "glass-card border-slate-700/50 text-slate-400 hover:text-slate-200"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Voice Tutor</span>
          </button>
          <button
            onClick={() => setSessionMode("viva")}
            className={`p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all border ${
              sessionMode === "viva"
                ? "bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-md shadow-purple-500/10"
                : "glass-card border-slate-700/50 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Viva Exam</span>
          </button>
          <button
            onClick={() => setSessionMode("rapid_quiz")}
            className={`p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all border ${
              sessionMode === "rapid_quiz"
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10"
                : "glass-card border-slate-700/50 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Rapid Quiz</span>
          </button>
        </div>

        {/* Main Visualizer Area */}
        <div className="relative z-10 flex flex-col items-center justify-center p-6 glass-card rounded-2xl border border-slate-800 bg-slate-950/60 min-h-[190px]">
          {/* Animated Central Wave Sphere */}
          <div className="relative flex items-center justify-center mb-4">
            <div
              className={`w-24 h-24 rounded-full transition-all duration-300 flex items-center justify-center ${
                status === "speaking"
                  ? "bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 shadow-2xl shadow-cyan-500/50 animate-pulse scale-110"
                  : status === "listening"
                  ? "bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-xl shadow-emerald-500/30 scale-100"
                  : status === "connecting"
                  ? "bg-slate-800 animate-spin border-2 border-dashed border-emerald-400"
                  : "bg-slate-800"
              }`}
            >
              {status === "speaking" ? (
                <Volume2 className="w-10 h-10 text-white animate-bounce" />
              ) : status === "listening" ? (
                <Mic className="w-10 h-10 text-slate-900 animate-pulse" />
              ) : (
                <Radio className="w-8 h-8 text-slate-400" />
              )}
            </div>

            {/* Ripple rings when active */}
            {(status === "speaking" || status === "listening") && (
              <>
                <div
                  className="absolute inset-0 -m-3 rounded-full border border-emerald-400/40 animate-ping pointer-events-none"
                  style={{ animationDuration: status === "speaking" ? "1.5s" : "2.5s" }}
                />
                <div
                  className="absolute inset-0 -m-6 rounded-full border border-cyan-400/20 animate-pulse pointer-events-none"
                  style={{ animationDuration: "2s" }}
                />
              </>
            )}
          </div>

          {/* Status Text Indicator */}
          <div className="flex items-center gap-2 text-center">
            {status === "connecting" && (
              <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                Connecting to Live API...
              </span>
            )}
            {status === "listening" && (
              <span className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                {isMicMuted ? "Mic Muted (Click un-mute to talk)" : "Listening... Speak naturally"}
              </span>
            )}
            {status === "speaking" && (
              <span className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                Abya is speaking...
              </span>
            )}
            {status === "error" && (
              <span className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errorMessage || "Connection error"}
              </span>
            )}
          </div>

          {/* Audio Wave Frequency Bars */}
          <div className="flex items-center gap-1.5 mt-4 h-6">
            {[40, 75, 100, 60, 90, 45, 80, 60, 95, 50, 85, 30].map((h, i) => {
              const active = status === "speaking" || (status === "listening" && !isMicMuted);
              const dynamicHeight = active
                ? status === "speaking"
                  ? Math.max(15, (h * (Math.sin(Date.now() / 200 + i) + 1.2)) / 2)
                  : Math.max(10, (audioLevel / 100) * h)
                : 6;
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    status === "speaking"
                      ? "bg-cyan-400"
                      : status === "listening"
                      ? "bg-emerald-400"
                      : "bg-slate-700"
                  }`}
                  style={{ height: `${dynamicHeight}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* Live Conversation Transcript Feed */}
        <div className="z-10 flex flex-col gap-2 max-h-32 overflow-y-auto p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Spoken Feed</span>
            {transcript.length > 0 && (
              <button
                onClick={() => setTranscript([])}
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </div>
          {transcript.length === 0 ? (
            <p className="text-slate-500 italic text-center py-2">
              Speak into your mic to start voice conversation...
            </p>
          ) : (
            transcript.map((t, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-xl ${
                  t.speaker === "abya"
                    ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-200"
                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 self-end"
                }`}
              >
                <div className="flex items-center justify-between gap-2 font-semibold mb-0.5 text-[10px] opacity-75">
                  <span>{t.speaker === "abya" ? "Abya AI" : activeStudent.name}</span>
                  <span>{t.time}</span>
                </div>
                <p className="text-xs leading-relaxed">{t.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Call Controls */}
        <div className="grid grid-cols-4 gap-3 z-10 pt-1">
          {/* Mute Mic */}
          <button
            onClick={toggleMic}
            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 font-semibold text-xs transition-all border ${
              isMicMuted
                ? "bg-rose-500/20 border-rose-500/50 text-rose-300"
                : "glass-card border-slate-700 text-slate-300 hover:text-white"
            }`}
          >
            {isMicMuted ? (
              <MicOff className="w-5 h-5 text-rose-400" />
            ) : (
              <Mic className="w-5 h-5 text-emerald-400" />
            )}
            <span>{isMicMuted ? "Unmute" : "Mute"}</span>
          </button>

          {/* Speaker Mute */}
          <button
            onClick={toggleSpeaker}
            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 font-semibold text-xs transition-all border ${
              isSpeakerMuted
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                : "glass-card border-slate-700 text-slate-300 hover:text-white"
            }`}
          >
            {isSpeakerMuted ? (
              <VolumeX className="w-5 h-5 text-amber-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-cyan-400" />
            )}
            <span>{isSpeakerMuted ? "Unmute" : "Sound"}</span>
          </button>

          {/* Interrupt / Hold */}
          <button
            onClick={handleInterrupt}
            className="p-3 rounded-2xl glass-card border border-slate-700 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-1 font-semibold text-xs transition-all"
          >
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span>Interrupt</span>
          </button>

          {/* End Call */}
          <button
            onClick={onClose}
            className="p-3 rounded-2xl bg-rose-600/30 border border-rose-500/60 hover:bg-rose-600/50 text-rose-200 flex flex-col items-center justify-center gap-1 font-semibold text-xs transition-all shadow-lg shadow-rose-500/20"
          >
            <PhoneOff className="w-5 h-5 text-rose-300" />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
