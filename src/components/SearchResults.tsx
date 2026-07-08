"use client"

import Link from "next/link"
import { useState } from "react"

const GENERIC_OGP = "https://www.hafh.com/images/ogp/ogp-en.png"

type Result = {
  property: { id: number; name_en: string; country: string; prefecture: string; cover_image_url?: string | null }
  stories: {
    id: number
    zh_tw_description: string | null
    description: string | null
    zh_tw_title: string | null
    title: string | null
    author_email: string | null
    likes_count: number | null
    cover_image_url?: string | null
    ai_rating?: number | null
  }[]
  tags: string[]
  matchReason?: string | null
}

const CARD_COLORS = ["#EEF0FF", "#FFF8EE", "#F0FFF4", "#FFF0F5", "#F0F8FF", "#FFFBEE"]
const PAGE_SIZE = 20

function extractReason(story: Result["stories"][0] | null, matchReason?: string | null): string {
  if (matchReason) return matchReason
  if (!story) return ""
  const text = story.zh_tw_description || story.description || ""
  if (!text) return ""
  // Find the most "interesting" sentence (longer than 20 chars)
  const sentences = text.split(/[。！？\n]/).map(s => s.trim()).filter(s => s.length > 20)
  const best = sentences[0] ?? text
  return best.length > 75 ? best.slice(0, 75) + "…" : best
}

export default function SearchResults({ results }: { results: Result[] }) {
  const [shown, setShown] = useState(PAGE_SIZE)
  const visible = results.slice(0, shown)
  const hasMore = shown < results.length

  return (
    <>
      <p style={{ fontSize: "11px", color: "#AAA", marginBottom: "16px", letterSpacing: "0.06em" }}>
        找到 {results.length} 間旅宿 · 依 AI 相關度排序
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {visible.map(({ property, stories, tags, matchReason }, i) => {
          const bg = CARD_COLORS[i % CARD_COLORS.length]
          const topStory = stories[0] ?? null
          const reason = extractReason(topStory, matchReason)
          const authorRaw = topStory?.author_email?.split("@")[0] ?? "旅人"

          // 優先用非通用 OGP 的 property 圖，否則暫用 story 圖（皆為 HafH 上的照片）
          const propImg = property.cover_image_url && property.cover_image_url !== GENERIC_OGP
            ? property.cover_image_url : null
          const displayImg = propImg ?? topStory?.cover_image_url ?? null

          return (
            <Link
              key={property.id}
              href={`/hotel/${property.id}`}
              style={{ background: "white", border: "1px solid #EBEBEB", borderRadius: "16px", overflow: "hidden", textDecoration: "none", display: "flex" }}
            >
              {/* 左側照片或色塊 */}
              <div style={{ width: "110px", minWidth: "110px", flexShrink: 0, overflow: "hidden" }}>
                {displayImg ? (
                  <img
                    src={displayImg}
                    alt={property.name_en}
                    style={{ width: "110px", height: "100%", minHeight: "130px", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div style={{ background: bg, width: "110px", height: "100%", minHeight: "130px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>
                    🏨
                  </div>
                )}
              </div>
              {/* 右側內容 */}
              <div style={{ padding: "14px 16px", flex: 1, minWidth: 0 }}>
                  {tags.length > 0 && (
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "6px" }}>
                      {tags.slice(0, 3).map((tag) => (
                        <span key={tag} style={{ fontSize: "10px", color: "#888", background: "#F5F5F5", borderRadius: "10px", padding: "2px 8px" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "#111", marginBottom: "2px", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {property.name_en}
                  </p>
                  <p style={{ fontSize: "11px", color: "#AAA", marginBottom: "8px" }}>
                    {property.prefecture} · {property.country}
                  </p>

                  {/* 推薦原因 */}
                  {reason && (
                    <div style={{ background: "#F8F9FF", borderLeft: "2px solid #4B7BF5", borderRadius: "0 8px 8px 0", padding: "6px 10px", marginBottom: "8px" }}>
                      <p style={{ fontSize: "11px", color: "#4B7BF5", fontWeight: 600, marginBottom: "2px" }}>推薦原因</p>
                      <p style={{ fontSize: "11px", color: "#555", lineHeight: 1.6 }}>「{reason}」</p>
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {topStory?.ai_rating ? (
                      <span style={{ color: "#F5A623", fontSize: "12px" }}>
                        {"★".repeat(topStory.ai_rating)}{"☆".repeat(5 - topStory.ai_rating)}
                      </span>
                    ) : (
                      <span style={{ color: "#DDD", fontSize: "12px" }}>☆☆☆☆☆</span>
                    )}
                    {topStory && <span style={{ fontSize: "10px", color: "#CCC" }}>@{authorRaw}</span>}
                  </div>
              </div>
            </Link>
          )
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setShown((s) => s + PAGE_SIZE)}
          style={{
            display: "block", width: "100%", marginTop: "24px",
            background: "white", border: "1.5px solid #E0E0E0", borderRadius: "12px",
            padding: "14px", fontSize: "13px", fontWeight: 600, color: "#333",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          載入更多（還有 {results.length - shown} 間）
        </button>
      )}
    </>
  )
}
