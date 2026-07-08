"use client"

import { useState } from "react"
import type { CardData } from "@/lib/card-utils"

type Reply = { author: string; content: string; date: string }

export type { CardData }

export default function HotelCardInteractive({ card, isCurated = false }: { card: CardData; isCurated?: boolean }) {
  const [helpful, setHelpful] = useState<"up" | "down" | null>(null)
  const [helpfulCount, setHelpfulCount] = useState(card.helpfulCount ?? 0)
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState<Reply[]>(card.replies ?? [])
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyShareLink() {
    const path = card.type === "review" ? `/review/${card.id}` : `/story/${card.id}`
    const url = `${window.location.origin}${path}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  const [replyText, setReplyText] = useState("")

  function handleHelpful(type: "up" | "down") {
    if (helpful === type) {
      setHelpful(null)
      if (type === "up") setHelpfulCount((c) => c - 1)
    } else {
      if (helpful === "up") setHelpfulCount((c) => c - 1)
      if (type === "up") setHelpfulCount((c) => c + 1)
      setHelpful(type)
    }
  }

  function submitReply() {
    if (!replyText.trim()) return
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    setReplies((prev) => [...prev, { author: "你", content: replyText.trim(), date }])
    setReplyText("")
    setShowReplyInput(false)
    setShowReplies(true)
  }

  const showPositiveNegative = card.positive || card.negative
  const showContent = card.content && !showPositiveNegative

  return (
    <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EBEBEB", padding: "18px 20px", position: "relative" }}>
      {isCurated && (
        <span style={{ position: "absolute", top: "16px", right: "16px", fontSize: "10px", color: "#7C3AED", background: "#F3F0FF", borderRadius: "8px", padding: "2px 8px", fontWeight: 600 }}>
          策展精選
        </span>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%", background: card.avatarBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: 700, color: "#4B7BF5", flexShrink: 0
        }}>
          {card.initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#111" }}>{card.author}</p>
          {card.stats && <p style={{ fontSize: "11px", color: "#BBB", marginTop: "1px" }}>{card.stats}</p>}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "3px" }}>
            {card.checkIn && <span style={{ fontSize: "11px", color: "#AAA" }}>{card.checkIn} 入住</span>}
            {card.bedType && <><span style={{ color: "#DDD", fontSize: "11px" }}>·</span><span style={{ fontSize: "11px", color: "#AAA" }}>{card.bedType}</span></>}
            {(card.purposes ?? []).map((p) => (
              <span key={p} style={{ fontSize: "10px", color: "#666", background: "#F5F5F5", borderRadius: "10px", padding: "2px 8px" }}>{p}</span>
            ))}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, paddingTop: isCurated ? "20px" : "0" }}>
          {card.rating != null && (
            <>
              <span style={{ color: "#F5A623", fontSize: "13px" }}>
                {"★".repeat(card.rating)}{"☆".repeat(5 - card.rating)}
              </span>
              {card.isAiRating && <p style={{ fontSize: "10px", color: "#CCC", marginTop: "2px" }}>AI 評分</p>}
            </>
          )}
        </div>
      </div>

      {/* Title */}
      {card.title && (
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#333", marginBottom: "8px" }}>{card.title}</p>
      )}

      {/* Review content (positive/negative) */}
      {card.positive && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
          <span style={{ fontSize: "11px", color: "#27AE60", marginTop: "2px", flexShrink: 0, fontWeight: 500 }}>✓ 滿意</span>
          <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.75 }}>{card.positive}</p>
        </div>
      )}
      {card.negative && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
          <span style={{ fontSize: "11px", color: "#AAA", marginTop: "2px", flexShrink: 0 }}>△ 待改善</span>
          <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.75 }}>{card.negative}</p>
        </div>
      )}

      {/* Story content */}
      {showContent && (
        <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.75, marginBottom: "6px" }}>{card.content}</p>
      )}

      {/* 推薦給 + date */}
      {(card.recommendFor?.length ?? 0) > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap",
          paddingTop: "10px", marginTop: "10px", borderTop: "1px solid #F5F5F5"
        }}>
          <span style={{ fontSize: "11px", color: "#AAA" }}>推薦給</span>
          {(card.recommendFor ?? []).map((r) => (
            <span key={r} style={{ fontSize: "11px", color: "#4B7BF5", background: "#EEF2FF", borderRadius: "10px", padding: "2px 8px" }}>{r}</span>
          ))}
          {card.date && <span style={{ fontSize: "11px", color: "#CCC", marginLeft: "auto" }}>{card.date}</span>}
        </div>
      )}

      {/* HafH link */}
      {card.hafh_url && !card.positive && (
        <div style={{ marginTop: "10px" }}>
          <a href={card.hafh_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: "11px", color: "#AAA", textDecoration: "none" }}>
            來自 HafH →
          </a>
        </div>
      )}

      {/* Reaction bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        paddingTop: "12px", marginTop: "12px", borderTop: "1px solid #F5F5F5",
        flexWrap: "wrap"
      }}>
        <span style={{ fontSize: "11px", color: "#CCC" }}>這則評論有幫助嗎？</span>
        <button
          onClick={() => handleHelpful("up")}
          style={{
            display: "flex", alignItems: "center", gap: "4px", fontSize: "11px",
            padding: "4px 10px", borderRadius: "20px", border: "1px solid",
            borderColor: helpful === "up" ? "#86EFAC" : "#E5E5E5",
            background: helpful === "up" ? "#F0FFF4" : "white",
            color: helpful === "up" ? "#16A34A" : "#666",
            cursor: "pointer", fontFamily: "inherit"
          }}
        >
          👍 有幫助{helpfulCount > 0 ? ` ${helpfulCount}` : ""}
        </button>
        <button
          onClick={() => handleHelpful("down")}
          style={{
            display: "flex", alignItems: "center", gap: "4px", fontSize: "11px",
            padding: "4px 10px", borderRadius: "20px", border: "1px solid",
            borderColor: helpful === "down" ? "#FCA5A5" : "#E5E5E5",
            background: helpful === "down" ? "#FFF5F5" : "white",
            color: helpful === "down" ? "#DC2626" : "#666",
            cursor: "pointer", fontFamily: "inherit"
          }}
        >
          👎 沒幫助
        </button>
        <button
            onClick={copyShareLink}
            style={{
              display: "flex", alignItems: "center", gap: "4px", fontSize: "11px",
              padding: "4px 10px", borderRadius: "20px", border: "1px solid #E5E5E5",
              background: copied ? "#F0FFF4" : "white",
              color: copied ? "#16A34A" : "#666",
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s"
            }}
          >
            {copied ? "✓ 已複製" : "🔗 分享"}
          </button>
        <button
          onClick={() => { setShowReplies((v) => !v); setShowReplyInput(false) }}
          style={{
            display: "flex", alignItems: "center", gap: "4px", fontSize: "11px",
            padding: "4px 10px", borderRadius: "20px", border: "1px solid #E5E5E5",
            background: "white", color: "#666", cursor: "pointer", marginLeft: "auto",
            fontFamily: "inherit"
          }}
        >
          💬 回應{replies.length > 0 ? ` ${replies.length}` : ""}
        </button>
      </div>

      {/* Replies */}
      {showReplies && (
        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {replies.map((r, i) => (
            <div key={i} style={{
              background: "#F8F8F8", borderRadius: "10px", padding: "10px 12px",
              display: "flex", gap: "8px"
            }}>
              <div style={{
                width: "24px", height: "24px", borderRadius: "50%", background: "#E5E5E5",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", color: "#888", flexShrink: 0
              }}>
                {r.author[0]}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#444" }}>{r.author}</span>
                <span style={{ fontSize: "11px", color: "#CCC", marginLeft: "8px" }}>{r.date}</span>
                <p style={{ fontSize: "12px", color: "#666", marginTop: "2px", lineHeight: 1.6 }}>{r.content}</p>
              </div>
            </div>
          ))}
          {!showReplyInput ? (
            <button
              onClick={() => setShowReplyInput(true)}
              style={{
                fontSize: "12px", color: "#4B7BF5", background: "none", border: "none",
                cursor: "pointer", textAlign: "left", padding: 0, fontFamily: "inherit"
              }}
            >
              + 留下回應
            </button>
          ) : (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitReply()}
                placeholder="輸入你的回應…"
                autoFocus
                style={{
                  flex: 1, border: "1px solid #E0E0E0", borderRadius: "8px",
                  padding: "6px 12px", fontSize: "12px", outline: "none", fontFamily: "inherit"
                }}
              />
              <button
                onClick={submitReply}
                style={{
                  background: "#111", color: "white", border: "none", borderRadius: "8px",
                  padding: "6px 12px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit"
                }}
              >
                送出
              </button>
              <button
                onClick={() => { setShowReplyInput(false); setReplyText("") }}
                style={{
                  background: "none", border: "none", fontSize: "12px", color: "#AAA",
                  cursor: "pointer", fontFamily: "inherit"
                }}
              >
                取消
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
