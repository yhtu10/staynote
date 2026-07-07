"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

const hints = [
  { label: "親子 × 台南", text: "帶小孩去台南，想要飯店有親子設施，孩子第一次出遊" },
  { label: "獨旅設計控", text: "獨旅，想住有設計感的飯店，不限城市，重視空間氛圍" },
  { label: "情侶 × 溫泉", text: "情侶出遊，想去泡溫泉，第一次去日本，希望交通方便" },
  { label: "朋友 × 京都", text: "和朋友去京都，想住有歷史感的地方，喜歡文青風格" },
  { label: "台北", text: "台北" },
  { label: "東京", text: "東京" },
  { label: "首爾", text: "首爾" },
]

export default function Home() {
  const [text, setText] = useState("")
  const [recording, setRecording] = useState(false)
  const [micSupported, setMicSupported] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

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

  function handleSearch(q?: string) {
    const trimmed = (q ?? text).trim()
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F5F5" }}>

      {/* Nav */}
      <nav style={{ background: "white", borderBottom: "1px solid #EBEBEB", padding: "0 24px", height: "52px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "17px", fontWeight: 700, color: "#111", letterSpacing: "-0.01em" }}>StayNote</span>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <Link href="/profile" style={{ fontSize: "13px", color: "#555", textDecoration: "none" }}>我的</Link>
          <Link href="/write" style={{ fontSize: "13px", color: "#111", border: "1.5px solid #111", borderRadius: "20px", padding: "5px 16px", textDecoration: "none", fontWeight: 500 }}>
            分享住宿
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: "560px", margin: "0 auto", padding: "48px 20px 60px" }}>

        {/* Hero */}
        <div style={{ marginBottom: "36px" }}>
          <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 600, color: "#4B7BF5", background: "#EEF2FF", borderRadius: "20px", padding: "3px 10px", marginBottom: "20px", letterSpacing: "0.02em" }}>
            目前公測中
          </span>
          <h1 style={{ fontSize: "clamp(28px, 6vw, 36px)", fontWeight: 800, color: "#111", lineHeight: 1.3, marginBottom: "12px", letterSpacing: "-0.02em" }}>
            這次你想要<br />來一場什麼樣的旅行？
          </h1>
          <p style={{ fontSize: "14px", color: "#888", lineHeight: 1.6 }}>
            用你自己的話描述，我們幫你找到對的旅宿。
          </p>
        </div>

        {/* Input card */}
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EBEBEB", padding: "16px 18px", marginBottom: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSearch() } }}
            placeholder="例如：我想帶爸媽去泡溫泉，第一次去九州，希望交通方便一點…"
            rows={3}
            style={{
              background: "transparent", border: "none", outline: "none",
              fontSize: "14px", color: "#111", fontFamily: "inherit",
              resize: "none", lineHeight: 1.75, width: "100%",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid #F0F0F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={toggleMic}
                disabled={!micSupported}
                aria-label={recording ? "停止語音輸入" : "開始語音輸入"}
                style={{
                  width: "36px", height: "36px", borderRadius: "50%", border: "none",
                  cursor: micSupported ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "16px", transition: "all 0.2s",
                  background: recording ? "#111" : "#F5F5F5",
                  color: recording ? "white" : "#888",
                  opacity: micSupported ? 1 : 0.35,
                  animation: recording ? "pulse-ring 1.4s ease infinite" : "none",
                }}
              >
                {recording ? "■" : "🎙"}
              </button>
              <span style={{ fontSize: "11px", color: "#BBB" }}>
                {!micSupported ? "此瀏覽器不支援語音" : recording ? "錄音中，再按一次結束" : "語音輸入"}
              </span>
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={!text.trim()}
              style={{
                background: "#111", color: "white", borderRadius: "20px",
                padding: "9px 22px", fontSize: "13px", fontWeight: 600,
                border: "none", cursor: text.trim() ? "pointer" : "default",
                opacity: text.trim() ? 1 : 0.35,
                transition: "opacity 0.2s", fontFamily: "inherit",
                letterSpacing: "0.01em",
              }}
            >
              找旅宿 →
            </button>
          </div>
        </div>

        {/* Hint pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {hints.map((h) => (
            <button
              key={h.label}
              onClick={() => handleSearch(h.text)}
              style={{
                fontSize: "12px", color: "#333",
                background: "white", border: "1.5px solid #E0E0E0",
                borderRadius: "20px", padding: "6px 14px",
                cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
              }}
            >
              {h.label}
            </button>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: "11px", color: "#CCC", marginTop: "40px" }}>
          來自 14,000+ 則旅人真實評論
        </p>

      </main>

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,0,0,0.15); }
          50% { box-shadow: 0 0 0 6px rgba(0,0,0,0); }
        }
      `}</style>

    </div>
  )
}
