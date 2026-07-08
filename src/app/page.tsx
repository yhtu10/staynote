"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

const hints = [
  { label: "東京 × 設計旅店", text: "想在東京住一間有設計感的飯店，空間氛圍好，適合獨旅或情侶入住" },
  { label: "北海道 × 溫泉", text: "想去北海道泡溫泉，享受大浴場和露天風呂，最好附近有美食" },
  { label: "京都 × 傳統旅館", text: "想在京都住有歷史感的傳統旅館或町家，感受古都氛圍" },
  { label: "沖繩 × 海灘度假", text: "想在沖繩住海邊的度假飯店，有泳池，適合家庭或情侶放鬆" },
  { label: "大阪 × 美食早餐", text: "去大阪吃美食，想住在交通方便、附近多餐廳的飯店，早餐要好吃" },
  { label: "峇里島 × 泳池別墅", text: "想去峇里島住有私人泳池的度假村，享受奢華熱帶假期" },
  { label: "福岡 × 獨旅", text: "一個人去福岡，想住輕鬆方便的飯店，探索城市、吃拉麵" },
  { label: "台北 × 設計旅宿", text: "台北週末小旅行，想住有設計感的精品旅店，不用出國也有質感" },
  { label: "曼谷 × 屋頂泳池", text: "想在曼谷住有屋頂泳池的時髦飯店，享受熱帶都市假期" },
  { label: "北陸 × 山景溫泉", text: "想去石川或富山泡溫泉，欣賞山景，感受日本傳統旅館文化" },
]

export default function Home() {
  const [text, setText] = useState("")
  const [recording, setRecording] = useState(false)
  const [micSupported, setMicSupported] = useState(false)
  const [micError, setMicError] = useState("")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SRClassRef = useRef<any>(null)   // 存 class
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null) // 存當次 instance
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (SR) {
      setMicSupported(true)
      SRClassRef.current = SR  // 只存 class
    }
  }, [])

  function toggleMic() {
    setMicError("")
    if (recording) {
      // 停止：呼叫當前 instance 的 stop()
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
      setRecording(false)
      return
    }
    if (!SRClassRef.current) return
    // 每次都建立全新 instance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new (SRClassRef.current as any)()
    recognitionRef.current = rec
    rec.lang = "zh-TW"
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e: { results: { length: number; [i: number]: { [j: number]: { transcript: string } } } }) => {
      let t = ""
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript
      setText(t)
      setMicError("")
    }
    rec.onend = () => {
      recognitionRef.current = null
      setRecording(false)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      recognitionRef.current = null
      setRecording(false)
      if (e.error === "not-allowed") {
        setMicError("請在 Chrome 設定中允許此網站使用麥克風")
      } else if (e.error === "no-speech") {
        setMicError("沒有偵測到聲音，請再試一次")
      } else {
        setMicError("語音輸入失敗：" + e.error)
      }
    }
    try {
      rec.start()
      setRecording(true)
    } catch {
      setMicError("語音輸入失敗，請重試")
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
            placeholder="例如：我預計和伴侶去京都，期待一趟回憶滿滿的旅行"
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
              <span style={{ fontSize: "11px", color: micError ? "#E55" : "#BBB" }}>
                {micError || (!micSupported ? "此瀏覽器不支援語音" : recording ? "錄音中，再按一次結束" : "語音輸入")}
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

        <p style={{ textAlign: "center", fontSize: "11px", color: "#CCC", marginTop: "40px", marginBottom: "32px" }}>
          來自 14,000+ 則旅人真實評論
        </p>

        {/* Write review CTA */}
        <div style={{ background: "white", border: "1px solid #EBEBEB", borderRadius: "16px", padding: "22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#111", marginBottom: "4px" }}>住過哪裡？說說你的真實感受</p>
            <p style={{ fontSize: "12px", color: "#AAA" }}>分享評論，幫助其他旅人做更好的選擇</p>
          </div>
          <Link
            href="/write"
            style={{ background: "#111", color: "white", fontSize: "13px", fontWeight: 600, padding: "10px 20px", borderRadius: "20px", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            寫評論 →
          </Link>
        </div>

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
