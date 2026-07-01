"use client"

import { useState } from "react"
import type { HotelReview } from "@/data/hotelDetails"

function PhotoThumbs({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null
  return (
    <div className="flex gap-2 mt-3">
      {photos.slice(0, 4).map((p, i) => (
        <div key={i} className="w-16 h-16 rounded-lg bg-neutral-100 flex items-center justify-center text-2xl flex-shrink-0 border border-neutral-200">
          {p}
        </div>
      ))}
    </div>
  )
}

// mock 既有回應（之後從 Supabase 讀取）
const mockReplies: Record<number, { author: string; text: string; date: string }[]> = {
  1: [{ author: "旅人小蘇", text: "完全同意！我也在那裡跟陌生人聊了好久，氣氛真的特別。", date: "2026-04" }],
}

export default function ReviewCardInteractive({
  review,
  older = false,
}: {
  review: HotelReview
  older?: boolean
}) {
  const [helpful, setHelpful] = useState<"up" | "down" | null>(null)
  const [helpfulCount, setHelpfulCount] = useState(Math.floor(Math.random() * 8) + 1)
  const [showReplies, setShowReplies] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [replies, setReplies] = useState(mockReplies[review.id] ?? [])
  const [showReplyInput, setShowReplyInput] = useState(false)

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
    setReplies((prev) => [...prev, { author: "你", text: replyText.trim(), date: "2026-07" }])
    setReplyText("")
    setShowReplyInput(false)
    setShowReplies(true)
  }

  return (
    <div className={`bg-white border border-neutral-200 rounded-xl p-5 ${older ? "opacity-75" : ""}`}>
      {/* 評論者資訊 */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-full ${review.avatarColor} flex items-center justify-center text-sm font-medium flex-shrink-0`}>
          {review.initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900">{review.author}</p>
          <p className="text-xs text-neutral-400">去過 {review.countries} 個國家 · 住過 {review.stays} 間飯店</p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className="text-xs text-neutral-400">{review.checkInDate} 入住</span>
            <span className="text-xs text-neutral-300">·</span>
            <span className="text-xs text-neutral-400">{review.bedType}</span>
            {review.purpose.map((p) => (
              <span key={p} className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">{p}</span>
            ))}
          </div>
        </div>
        <span className="text-amber-400 text-sm tracking-tight flex-shrink-0">
          {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
        </span>
      </div>

      {/* 評論內容 */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-start gap-2">
          <span className="text-emerald-500 text-xs mt-0.5 flex-shrink-0">✓ 滿意</span>
          <p className="text-sm text-neutral-700 leading-relaxed">{review.positive}</p>
        </div>
        {review.negative !== "無明顯缺點" && (
          <div className="flex items-start gap-2">
            <span className="text-neutral-400 text-xs mt-0.5 flex-shrink-0">△ 待改善</span>
            <p className="text-sm text-neutral-500 leading-relaxed">{review.negative}</p>
          </div>
        )}
      </div>

      <PhotoThumbs photos={review.photos} />

      {/* 推薦給 */}
      {review.recommendFor.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-3 mt-3 border-t border-neutral-100">
          <span className="text-xs text-neutral-400">推薦給</span>
          {review.recommendFor.map((g) => (
            <span key={g} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{g}</span>
          ))}
          <span className="text-xs text-neutral-300 ml-auto">{review.date}</span>
        </div>
      )}

      {/* 互動列 */}
      <div className="flex items-center gap-3 pt-3 mt-3 border-t border-neutral-100">
        <span className="text-xs text-neutral-400">這則評論有幫助嗎？</span>
        <button
          onClick={() => handleHelpful("up")}
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
            helpful === "up"
              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
              : "border-neutral-200 text-neutral-500 hover:border-neutral-400"
          }`}
        >
          👍 有幫助 {helpfulCount > 0 && <span className="text-neutral-400 ml-0.5">{helpfulCount}</span>}
        </button>
        <button
          onClick={() => handleHelpful("down")}
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
            helpful === "down"
              ? "bg-red-50 border-red-300 text-red-600"
              : "border-neutral-200 text-neutral-500 hover:border-neutral-400"
          }`}
        >
          👎 沒幫助
        </button>
        <button
          onClick={() => { setShowReplies((v) => !v); setShowReplyInput(false) }}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-neutral-200 text-neutral-500 hover:border-neutral-400 transition-colors ml-auto"
        >
          💬 回應 {replies.length > 0 && <span className="text-neutral-400">{replies.length}</span>}
        </button>
      </div>

      {/* 回應區 */}
      {showReplies && (
        <div className="mt-3 flex flex-col gap-2">
          {replies.map((r, i) => (
            <div key={i} className="bg-neutral-50 rounded-lg px-3 py-2 flex gap-2">
              <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-xs text-neutral-500 flex-shrink-0">
                {r.author[0]}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-neutral-700">{r.author}</span>
                <span className="text-xs text-neutral-300 ml-2">{r.date}</span>
                <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">{r.text}</p>
              </div>
            </div>
          ))}
          {!showReplyInput ? (
            <button
              onClick={() => setShowReplyInput(true)}
              className="text-xs text-blue-600 hover:text-blue-800 text-left mt-1"
            >
              + 留下回應
            </button>
          ) : (
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitReply()}
                placeholder="輸入你的回應…"
                autoFocus
                className="flex-1 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
              />
              <button
                onClick={submitReply}
                className="text-xs bg-neutral-900 text-white px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors"
              >
                送出
              </button>
              <button
                onClick={() => { setShowReplyInput(false); setReplyText("") }}
                className="text-xs text-neutral-400 hover:text-neutral-600"
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
