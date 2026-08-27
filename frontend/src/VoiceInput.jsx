import React, { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

// Maps the app's short language codes to BCP-47 tags the Web Speech API expects.
const LANG_MAP = { en: "en-IN", hi: "hi-IN", kn: "kn-IN", mr: "mr-IN", te: "te-IN" };

const SpeechRecognitionAPI = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

// A small mic button that uses the browser's own speech recognition —
// no server round-trip, no API keys required. Supported in Chrome and
// Edge; other browsers show a short explanatory message instead of a
// broken button.
export default function VoiceInput({ langCode = "en", onResult, className = "" }) {
  const [status, setStatus] = useState("idle"); // idle | listening | error
  const [errorMsg, setErrorMsg] = useState("");
  const recognitionRef = useRef(null);

  if (!SpeechRecognitionAPI) {
    return (
      <div className={`voice-input ${className}`}>
        <span className="voice-status voice-error">Voice input needs Chrome or Edge.</span>
      </div>
    );
  }

  const start = () => {
    setErrorMsg("");
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = LANG_MAP[langCode] || "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript || "";
      onResult?.(transcript);
    };
    recognition.onerror = (e) => {
      setStatus("error");
      setErrorMsg(e.error === "not-allowed" ? "Microphone access denied." : "Couldn't hear that, try again.");
    };
    recognition.onend = () => {
      setStatus((s) => (s === "listening" ? "idle" : s));
    };

    recognitionRef.current = recognition;
    recognition.start();
    setStatus("listening");
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setStatus("idle");
  };

  const toggle = () => {
    if (status === "listening") stop();
    else start();
  };

  return (
    <div className={`voice-input ${className}`}>
      <button
        type="button"
        className={`voice-mic-btn ${status === "listening" ? "recording" : ""}`}
        onClick={toggle}
        title={status === "listening" ? "Stop" : "Speak"}
      >
        {status === "listening" ? <Square size={14} /> : <Mic size={16} />}
      </button>
      {status === "listening" && <span className="voice-status">Listening…</span>}
      {status === "error" && <span className="voice-status voice-error">{errorMsg}</span>}
    </div>
  );
}
