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
  X,
  GraduationCap,
  Award,
  Zap,
  Send,
} from "lucide-react";
import { StudentProfile } from "../types";
import { float32To16BitPCMBase64, LiveAudioPlayer } from "../utils/audioUtils";
import { getValidClientAuthToken } from "../utils/firebase";

interface AbyaLiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStudent?: StudentProfile | null;
  studentName?: string;
  classLevel?: string;
  stream?: string;
  board?: string;
}

type VoiceSessionMode = "tutor" | "viva" | "rapid_quiz";

export const AbyaLiveVoiceModal: React.FC<AbyaLiveVoiceModalProps> = ({
  isOpen,
  onClose,
  activeStudent,
  studentName: propStudentName,
  classLevel: propClassLevel,
  stream: propStream,
  board: propBoard,
}) => {
  const effectiveName = propStudentName || activeStudent?.name || "Student";
  const effectiveClass = propClassLevel || activeStudent?.classLevel || "Class 12";
  const effectiveStream = propStream || activeStudent?.stream || "Commerce";
  const effectiveBoard = propBoard || activeStudent?.board || "CBSE";

  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "speaking" | "listening" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micPermissionNote, setMicPermissionNote] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [transcript, setTranscript] = useState<
    { speaker: "user" | "abya"; text: string; time: string }[]
  >([]);
  const [sessionMode, setSessionMode] = useState<VoiceSessionMode>("tutor");
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceInputText, setVoiceInputText] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const liveAudioPlayerRef = useRef<LiveAudioPlayer | null>(null);
  const isSpeakingRef = useRef(false);
  const isMicMutedRef = useRef(false);
  const isSpeakerMutedRef = useRef(false);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    isSpeakerMutedRef.current = isSpeakerMuted;
  }, [isSpeakerMuted]);

  const addTranscript = useCallback((speaker: "user" | "abya", text: string) => {
    if (!text.trim()) return;
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setTranscript((prev) => [...prev, { speaker, text, time }]);
  }, []);

  const speakBrowserFallback = useCallback((text: string) => {
    if (isSpeakerMutedRef.current || typeof window === "undefined" || !("speechSynthesis" in window)) {
      setStatus("listening");
      isSpeakingRef.current = false;
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.02;
      utterance.pitch = 1.0;
      utterance.onstart = () => {
        setStatus("speaking");
        isSpeakingRef.current = true;
      };
      utterance.onend = () => {
        setStatus("listening");
        isSpeakingRef.current = false;
      };
      utterance.onerror = () => {
        setStatus("listening");
        isSpeakingRef.current = false;
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      setStatus("listening");
      isSpeakingRef.current = false;
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current.onaudioprocess = null;
      } catch {
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
      } catch {
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
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
  }, []);

  const attachMicrophoneStream = useCallback(async (ws: WebSocket) => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setMicPermissionNote("Browser microphone capture unavailable — use the spoken prompt bar below.");
      return;
    }

    try {
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
      setMicPermissionNote(null);

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMicMutedRef.current || ws.readyState !== WebSocket.OPEN) {
          setAudioLevel(0);
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setAudioLevel(Math.min(100, Math.round(rms * 400)));

        const base64Pcm = float32To16BitPCMBase64(inputData);
        ws.send(JSON.stringify({ type: "audio", audio: base64Pcm }));
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
    } catch {
      setMicPermissionNote(
        "Microphone access is paused or blocked in this preview frame — you can still speak with Abya using the prompt bar below."
      );
    }
  }, []);

  const startVoiceSession = useCallback(async () => {
    cleanupAudio();
    setStatus("connecting");
    setErrorMessage(null);
    setMicPermissionNote(null);

    try {
      // 1. Initialize 24kHz Output Live Audio Player
      liveAudioPlayerRef.current = new LiveAudioPlayer();

      // 2. Obtain valid session token (Firebase ID token or signed local student session token)
      const idToken = await getValidClientAuthToken(activeStudent?.id || "local_student");
      if (!idToken) {
        setStatus("listening");
        setMicPermissionNote("Connected in Offline Voice Studio mode.");
        return;
      }

      // 3. Request single-use Live Voice WebSocket ticket from backend
      const ticketRes = await fetch("/api/live-voice/ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!ticketRes.ok) {
        setStatus("listening");
        setMicPermissionNote("Connected in Interactive Voice Tutor mode.");
        return;
      }

      const ticketData = await ticketRes.json().catch(() => ({}));
      const ticket = ticketData.ticket;
      if (!ticket || typeof ticket !== "string") {
        setStatus("listening");
        return;
      }

      // 4. Connect to Backend Live Voice WebSocket
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const queryParams = new URLSearchParams({
        studentName: effectiveName,
        classLevel: effectiveClass,
        stream: effectiveStream,
        board: effectiveBoard,
        mode: sessionMode,
        ticket: ticket,
      });

      const wsUrl = `${protocol}//${host}/api/live-voice?${queryParams.toString()}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("listening");
        attachMicrophoneStream(ws);
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
          } else if (msg.type === "spoken_reply" && msg.text) {
            addTranscript("abya", msg.text);
            speakBrowserFallback(msg.text);
          } else if (msg.type === "interrupted") {
            liveAudioPlayerRef.current?.stopAndClear();
            setStatus("listening");
            isSpeakingRef.current = false;
          } else if (msg.type === "turnComplete") {
            if (!isSpeakingRef.current) {
              setStatus("listening");
            }
          } else if (msg.type === "error") {
            console.warn("[Abya Live Voice] Server notice:", msg.error);
            setStatus("listening");
          }
        } catch {
          // ignore parse warning
        }
      };

      ws.onerror = () => {
        setStatus("listening");
      };

      ws.onclose = () => {
        setStatus((current) => (current === "error" ? "error" : "listening"));
      };
    } catch (err: any) {
      console.warn("[Abya Live Voice] Falling back to interactive voice mode:", err?.message);
      setStatus("listening");
    }
  }, [
    activeStudent?.id,
    effectiveName,
    effectiveClass,
    effectiveStream,
    effectiveBoard,
    sessionMode,
    cleanupAudio,
    attachMicrophoneStream,
    addTranscript,
    speakBrowserFallback,
  ]);

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
  }, [isOpen, startVoiceSession, cleanupAudio]);

  const toggleMic = () => {
    setIsMicMuted((prev) => !prev);
  };

  const toggleSpeaker = () => {
    setIsSpeakerMuted((prev) => {
      const next = !prev;
      liveAudioPlayerRef.current?.setMuted(next);
      if (next && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  };

  const handleInterrupt = () => {
    liveAudioPlayerRef.current?.stopAndClear();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "text", text: "Wait, hold on." }));
    }
    setStatus("listening");
    isSpeakingRef.current = false;
  };

  const handleSendSpokenPrompt = (customPrompt?: string) => {
    const textToSend = (customPrompt ?? voiceInputText).trim();
    if (!textToSend) return;
    setVoiceInputText("");
    addTranscript("user", textToSend);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "text", text: textToSend }));
    } else {
      const reply =
        sessionMode === "viva"
          ? `Viva Question for ${effectiveName} (${effectiveClass} ${effectiveStream}): State the core principle behind "${textToSend}" and give one practical board-exam example.`
          : sessionMode === "rapid_quiz"
          ? `Rapid Quiz Turn: On "${textToSend}", what is the primary formula or definition tested in ${effectiveBoard} exams?`
          : `Here is a concise explanation for ${effectiveName}: "${textToSend}" is best understood by breaking it into its core definition, governing rule, and one real-world application.`;
      addTranscript("abya", reply);
      speakBrowserFallback(reply);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg glass-card border border-amber-500/30 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 overflow-hidden">
        {/* Ambient Glow */}
        <div
          className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            status === "speaking"
              ? "bg-amber-500/25"
              : status === "listening"
              ? "bg-emerald-500/25"
              : "bg-indigo-500/20"
          }`}
        />

        {/* Header */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white font-heading">
                  Abya Live Voice
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>Speaking with:</span>
                <span className="text-amber-300 font-medium">
                  {effectiveName} ({effectiveClass})
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-pill text-slate-400 hover:text-white transition-colors"
            title="Close Live Voice"
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
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10"
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
                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10"
                : "glass-card border-slate-700/50 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Rapid Quiz</span>
          </button>
        </div>

        {/* Main Visualizer Area */}
        <div className="relative z-10 flex flex-col items-center justify-center p-5 glass-card rounded-2xl border border-slate-800 bg-slate-950/60 min-h-[165px]">
          <div className="relative flex items-center justify-center mb-3">
            <div
              className={`w-20 h-20 rounded-full transition-all duration-300 flex items-center justify-center ${
                status === "speaking"
                  ? "bg-gradient-to-tr from-amber-500 via-emerald-500 to-cyan-500 shadow-2xl shadow-amber-500/40 animate-pulse scale-110"
                  : status === "listening"
                  ? "bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-xl shadow-emerald-500/30 scale-100"
                  : status === "connecting"
                  ? "bg-slate-800 animate-spin border-2 border-dashed border-amber-400"
                  : "bg-slate-800"
              }`}
            >
              {status === "speaking" ? (
                <Volume2 className="w-9 h-9 text-white animate-bounce" />
              ) : status === "listening" ? (
                <Mic className="w-9 h-9 text-slate-950 animate-pulse" />
              ) : (
                <Radio className="w-7 h-7 text-slate-400" />
              )}
            </div>

            {(status === "speaking" || status === "listening") && (
              <>
                <div
                  className="absolute inset-0 -m-3 rounded-full border border-emerald-400/40 animate-ping pointer-events-none"
                  style={{ animationDuration: status === "speaking" ? "1.5s" : "2.5s" }}
                />
                <div
                  className="absolute inset-0 -m-6 rounded-full border border-amber-400/20 animate-pulse pointer-events-none"
                  style={{ animationDuration: "2s" }}
                />
              </>
            )}
          </div>

          <div className="flex flex-col items-center gap-1.5 text-center w-full px-2">
            {status === "connecting" && (
              <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                Connecting to Abya Live Voice...
              </span>
            )}
            {status === "listening" && (
              <span className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                {isMicMuted ? "Mic Muted (Click Unmute or use prompt bar)" : "Live Session Active — Speak or select a Viva prompt"}
              </span>
            )}
            {status === "speaking" && (
              <span className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                Abya is speaking...
              </span>
            )}
            {micPermissionNote && (
              <p className="text-[11px] text-slate-400 max-w-md">{micPermissionNote}</p>
            )}
            {status === "error" && errorMessage && (
              <div className="flex items-center gap-2 text-amber-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Quick Viva & Voice Prompts */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
            {[
              "Ask me a Viva Question",
              "Explain this chapter simply",
              "Quiz me on formulas",
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleSendSpokenPrompt(chip)}
                className="px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-[11px] text-slate-300 hover:text-amber-200 transition-all"
              >
                {chip}
              </button>
            ))}
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
              Speak into your mic or tap a prompt above to start conversing with Abya...
            </p>
          ) : (
            transcript.map((t, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-xl ${
                  t.speaker === "abya"
                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-100"
                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 self-end"
                }`}
              >
                <div className="flex items-center justify-between gap-2 font-semibold mb-0.5 text-[10px] opacity-75">
                  <span>{t.speaker === "abya" ? "Abya AI" : effectiveName}</span>
                  <span>{t.time}</span>
                </div>
                <p className="text-xs leading-relaxed">{t.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Interactive Voice Prompt Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendSpokenPrompt();
          }}
          className="z-10 flex items-center gap-2"
        >
          <input
            type="text"
            value={voiceInputText}
            onChange={(e) => setVoiceInputText(e.target.value)}
            placeholder="Speak or type an oral answer / question for Abya..."
            className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
          <button
            type="submit"
            disabled={!voiceInputText.trim()}
            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Speak</span>
          </button>
        </form>

        {/* Call Controls */}
        <div className="grid grid-cols-4 gap-3 z-10 pt-1">
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

          <button
            onClick={handleInterrupt}
            className="p-3 rounded-2xl glass-card border border-slate-700 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-1 font-semibold text-xs transition-all"
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Interrupt</span>
          </button>

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
