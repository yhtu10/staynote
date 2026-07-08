import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

function ratingStars(r: number) {
  const full = Math.round(r)
  return "★".repeat(full) + "☆".repeat(5 - full)
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { data: story } = await supabase
    .from("travel_stories")
    .select("id, zh_tw_title, title, zh_tw_description, description, properties(name_en, cover_image_url)")
    .eq("id", parseInt(id))
    .single()

  if (!story) return { title: "旅行故事 | StayNote" }

  const property = (story.properties as unknown) as { name_en: string; cover_image_url?: string | null } | null
  const storyTitle = story.zh_tw_title || story.title || property?.name_en || "旅行故事"
  const description = (story.zh_tw_description || story.description || "").slice(0, 120)

  return {
    title: `${storyTitle} | StayNote`,
    description,
    openGraph: {
      title: `${storyTitle} | StayNote`,
      description,
      images: property?.cover_image_url ? [property.cover_image_url] : [],
    },
  }
}

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const storyId = parseInt(id)
  if (isNaN(storyId)) notFound()

  const { data: story } = await supabase
    .from("travel_stories")
    .select("id, title, zh_tw_title, description, zh_tw_description, stay_description, stay_image_url, author_email, likes_count, published_at, ai_rating, hafh_url, cover_image_url, property_id, properties(id, name_en, country, prefecture, cover_image_url)")
    .eq("id", storyId)
    .single()

  if (!story) notFound()

  const property = (story.properties as unknown) as { id: number; name_en: string; country: string; prefecture: string; cover_image_url?: string | null } | null
  const coverImg = story.cover_image_url || story.stay_image_url || property?.cover_image_url
  const authorName = story.author_email ? story.author_email.split("@")[0] : "旅人"
  const storyTitle = story.zh_tw_title || story.title || ""
  const stayContent = story.stay_description || ""
  const travelContent = story.zh_tw_description || story.description || ""

  return (
    <main style={{ minHeight: "100vh", background: "#F7F8FA", paddingBottom: 48 }}>
      {/* 封面 */}
      {coverImg && (
        <div style={{ width: "100%", height: 220, overflow: "hidden" }}>
          <img src={coverImg} alt={storyTitle} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      )}

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px" }}>
        {/* 旅宿連結 */}
        {property && (
          <div style={{ marginTop: 20, marginBottom: 4 }}>
            <Link href={`/hotel/${property.id}`} style={{ textDecoration: "none" }}>
              <p style={{ fontSize: 12, color: "#AAA", marginBottom: 4 }}>{property.prefecture} · {property.country}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#111", lineHeight: 1.3 }}>{property.name_en}</p>
            </Link>
          </div>
        )}

        {/* 故事內容卡片 */}
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #EBEBEB", padding: "24px 20px", marginTop: 16 }}>
          {/* AI 評分 */}
          {story.ai_rating != null && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ color: "#F5A623", fontSize: 20, letterSpacing: 2 }}>{ratingStars(story.ai_rating)}</span>
              <span style={{ fontSize: 11, color: "#CCC" }}>AI 評分</span>
            </div>
          )}

          {/* 標題 */}
          {storyTitle && (
            <p style={{ fontSize: 16, fontWeight: 700, color: "#111", lineHeight: 1.5, marginBottom: 12 }}>{storyTitle}</p>
          )}

          {/* 住宿體驗 */}
          {stayContent && (
            <div style={{ marginBottom: travelContent ? 16 : 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 6, letterSpacing: "0.05em" }}>住宿體驗</p>
              <p style={{ fontSize: 14, color: "#333", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{stayContent}</p>
            </div>
          )}

          {/* 旅行體驗 */}
          {travelContent && (
            <div style={stayContent ? { paddingTop: 16, borderTop: "1px solid #F0F0F0" } : {}}>
              {stayContent && <p style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 6, letterSpacing: "0.05em" }}>旅行中的體驗</p>}
              <p style={{ fontSize: 14, color: "#333", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{travelContent}</p>
            </div>
          )}

          {/* 作者 + 日期 + 原文連結 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, paddingTop: 16, borderTop: "1px solid #F0F0F0", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>@{authorName}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {story.published_at && (
                <span style={{ fontSize: 11, color: "#CCC" }}>
                  {new Date(story.published_at).toLocaleDateString("zh-TW")}
                </span>
              )}
              {story.hafh_url && (
                <a href={story.hafh_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: "#AAA", textDecoration: "none" }}>
                  原文 →
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 回到旅宿頁 */}
        {property && (
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <Link href={`/hotel/${property.id}`} style={{ fontSize: 13, color: "#4B7BF5", textDecoration: "none" }}>
              查看 {property.name_en} 的所有評論 →
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
