"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"

const hints = [
  { label: "親子 × 台南", text: "帶小孩去台南，想要飯店有親子設施，孩子第一次出遊" },
  { label: "獨旅設計控", text: "獨旅，想住有設計感的飯店，不限城市，重視空間氛圍" },
  { label: "情侶 × 溫泉", text: "情侶出遊，想去泡溫泉，第一次去日本，希望交通方便" },
  { label: "朋友 × 京都", text: "和朋友去京都，想住有歷史感的地方，喜歡文青風格" },
]

export default function Home() {
  const [text, setText] = useState("")
  const [recording, setRecording] = useState(false)
  const [micSupported, setMicSupported] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (SR) {
      setMicSupported(true)
      const rec = new SR()
      rec.lang = "zh-TW"
      rec.continuous = true
      rec.interimResults = true
      rec.onresult = (e: { results: { length: number; [i: number]: { [j: number]: { transcript: string } } } }) => {
        let t = ""
        for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript
        setText(t)
      }
      rec.onend = () => setRecording(false)
      recognitionRef.current = rec
    }
  }, [])

  function toggleMic() {
    if (!recognitionRef.current) return
    if (recording) {
      recognitionRef.current.stop()
      setRecording(false)
    } else {
      recognitionRef.current.start()
      setRecording(true)
    }
  }

  function fillHint(t: string) {
    setText(t)
    textareaRef.current?.focus()
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F7F4EF" }}>

      <nav className="px-6 pt-5 flex items-center justify-between">
        <span style={{ fontFamily: "var(--font-noto-serif-tc), serif", fontSize: "17px", fontWeight: 400, color: "#2C2A24", letterSpacing: "0.04em" }}>
          StayNote
        </span>
        <div className="flex items-center gap-4">
          <Link href="/profile" style={{ fontSize: "12px", color: "#9B9689" }}>我的</Link>
          <Link href="/write" style={{ fontSize: "12px", color: "#9B9689", border: "0.5px solid #D6D0C8", borderRadius: "20px", padding: "5px 14px" }}>
            分享住宿
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col justify-center px-6 pb-16 max-w-lg mx-auto w-full">

        <p style={{ fontSize: "11px", color: "#B0A898", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "20px" }}>
          探索旅宿
        </p>

        <h1 style={{ fontFamily: "var(--font-noto-serif-tc), serif", fontSize: "clamp(22px, 5vw, 26px)", fontWeight: 300, color: "#2C2A24", lineHeight: 1.7, letterSpacing: "0.02em", marginBottom: "36px" }}>
          這次你想要<br />來一場什麼樣的旅行？
        </h1>

        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #E5E0D8", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="例如：我想帶爸媽去泡溫泉，第一次去九州，希望交通方便一點…"
            rows={3}
            style={{
              background: "transparent", border: "none", outline: "none",
              fontSize: "14px", color: "#2C2A24", fontFamily: "inherit",
              resize: "none", lineHeight: 1.75, width: "100%",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "10px", borderTop: "0.5px solid #EDE8DF" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={toggleMic}
                disabled={!micSupported}
                aria-label={recording ? "停止語音輸入" : "開始語音輸入"}
                style={{
                  width: "40px", height: "40px", borderRadius: "50%", border: "none",
                  cursor: micSupported ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "18px", transition: "all 0.2s",
                  background: recording ? "#2C2A24" : "#F0EBE3",
                  color: recording ? "#F7F4EF" : "#8C8378",
                  opacity: micSupported ? 1 : 0.4,
                  animation: recording ? "pulse-ring 1.4s ease infinite" : "none",
                }}
              >
                {recording ? "■" : "🎙"}
              </button>
              <span style={{ fontSize: "11px", color: "#B0A898" }}>
                {!micSupported ? "此瀏覽器不支援語音" : recording ? "錄音中，再次點按結束" : "點擊開始語音輸入"}
              </span>
            </div>
            <Link
              href={text.trim() ? `/search?q=${encodeURIComponent(text.trim())}` : "#"}
              style={{
                background: "#2C2A24", color: "#F7F4EF", borderRadius: "20px",
                padding: "9px 20px", fontSize: "13px", letterSpacing: "0.02em",
                textDecoration: "none",
                opacity: text.trim() ? 1 : 0.4,
                pointerEvents: text.trim() ? "auto" : "none",
                transition: "opacity 0.2s",
              }}
            >
              找旅宿 →
            </Link>
          </div>
        </div>

        <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginTop: "20px" }}>
          {hints.map((h) => (
            <button
              key={h.label}
              onClick={() => fillHint(h.text)}
              style={{
                fontSize: "11px", color: "#8C8378",
                border: "0.5px solid #D6D0C8", borderRadius: "20px",
                padding: "5px 12px", cursor: "pointer",
                background: "transparent", fontFamily: "inherit",
              }}
            >
              {h.label}
            </button>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: "11px", color: "#C4BDB4", marginTop: "32px" }}>
          來自 14,000+ 則旅人真實評論
        </p>

      </main>

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(44,42,36,0.25); }
          50% { box-shadow: 0 0 0 6px rgba(44,42,36,0); }
        }
      `}</style>

    </div>
  )
}
