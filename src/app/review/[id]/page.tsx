import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

function formatCheckIn(month: string | null | undefined): string {
  if (!month) return ""
  const parts = String(month).split("/")
  if (parts.length === 2) return `${parts[0]} 年 ${parts[1].padStart(2, "0")} 月`
  return String(month)
}

function ratingStars(r: number) {
  const full = Math.round(r)
  return "★".repeat(full) + "☆".repeat(5 - full)
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { data: review } = await supabase
    .from("reviews")
    .select("id, positive, rating, property_id, properties(name_en, name_zh, cover_image_url)")
    .eq("id", parseInt(id))
    .eq("status", "approved")
    .single()

  if (!review) return { title: "評論 | StayNote" }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property = (review.properties as unknown) as { name_en: string; name_zh?: string | null; cover_image_url?: string | null } | null
  const title = `${(property?.name_zh || property?.name_en) ?? "旅宿"} 的住宿評論 | StayNote`
  const description = review.positive?.slice(0, 120) ?? ""

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: property?.cover_image_url ? [property.cover_image_url] : [],
    },
  }
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const reviewId = parseInt(id)
  if (isNaN(reviewId)) notFound()

  const { data: review } = await supabase
    .from("reviews")
    .select("id, user_id, author_name, rating, positive, negative, check_in_month, bed_type, recommend_for, photos, created_at, property_id, properties(id, name_en, name_zh, country, prefecture, cover_image_url)")
    .eq("id", reviewId)
    .eq("status", "approved")
    .single()

  if (!review) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property = (review.properties as unknown) as { id: number; name_en: string; name_zh?: string | null; country: string; prefecture: string; cover_image_url?: string | null } | null

  // 同旅宿其他評論
  const { data: otherReviews } = await supabase
    .from("reviews")
    .select("id, author_name, user_id, rating, positive, created_at")
    .eq("property_id", review.property_id)
    .eq("status", "approved")
    .neq("id", reviewId)
    .order("created_at", { ascending: false })
    .limit(3)

  // 取顯示名稱
  let displayName = review.author_name || "匿名旅人"
  if (review.user_id) {
    const { data: user } = await supabase.from("users").select("display_name, name").eq("id", review.user_id).single()
    if (user) displayName = user.display_name || user.name || displayName
  }

  const photos: string[] = Array.isArray(review.photos) ? review.photos : []
  const recommendFor: string[] = Array.isArray(review.recommend_for) ? review.recommend_for : []

  return (
    <main style={{ minHeight: "100vh", background: "#F7F8FA", paddingBottom: 48 }}>
      {/* 旅宿封面 */}
      {property?.cover_image_url && (
        <div style={{ width: "100%", height: 220, overflow: "hidden" }}>
          <img src={property.cover_image_url} alt={property.name_en} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      )}

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px" }}>
        {/* 旅宿名稱連結 */}
        {property && (
          <div style={{ marginTop: 20, marginBottom: 4 }}>
            <Link href={`/hotel/${property.id}`} style={{ textDecoration: "none" }}>
              <p style={{ fontSize: 12, color: "#AAA", marginBottom: 4 }}>{property.prefecture} · {property.country}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#111", lineHeight: 1.3 }}>{property.name_zh || property.name_en}</p>
              {property.name_zh && <p style={{ fontSize: 11, color: "#CCC", marginTop: 2 }}>{property.name_en}</p>}
            </Link>
          </div>
        )}

        {/* 評論主體卡片 */}
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #EBEBEB", padding: "24px 20px", marginTop: 16 }}>
          {/* 評分 + 入住時間 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ color: "#F5A623", fontSize: 20, letterSpacing: 2 }}>
              {review.rating ? ratingStars(review.rating) : "☆☆☆☆☆"}
            </span>
            {review.check_in_month && (
              <span style={{ fontSize: 12, color: "#AAA" }}>{formatCheckIn(review.check_in_month)} 入住</span>
            )}
          </div>

          {/* 推薦對象 */}
          {recommendFor.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {recommendFor.map(r => (
                <span key={r} style={{ fontSize: 11, background: "#F0F4FF", color: "#4B7BF5", borderRadius: 10, padding: "3px 10px" }}>{r}</span>
              ))}
            </div>
          )}

          {/* 正評 */}
          {review.positive && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#4CAF50", marginBottom: 6 }}>喜歡的地方</p>
              <p style={{ fontSize: 14, color: "#333", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{review.positive}</p>
            </div>
          )}

          {/* 負評 */}
          {review.negative && (
            <div style={{ marginBottom: 16, paddingTop: 16, borderTop: "1px solid #F0F0F0" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#E57373", marginBottom: 6 }}>可以改進的地方</p>
              <p style={{ fontSize: 14, color: "#333", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{review.negative}</p>
            </div>
          )}

          {/* 照片 */}
          {photos.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8, marginTop: 16, paddingTop: 16, borderTop: "1px solid #F0F0F0" }}>
              {photos.map((url, i) => (
                <img key={i} src={url} alt={`照片 ${i + 1}`} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10 }} />
              ))}
            </div>
          )}

          {/* 撰寫者 + 日期 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, paddingTop: 16, borderTop: "1px solid #F0F0F0" }}>
            <span style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>{displayName}</span>
            <span style={{ fontSize: 11, color: "#CCC" }}>
              {new Date(review.created_at).toLocaleDateString("zh-TW")}
            </span>
          </div>
        </div>

        {/* 同旅宿其他評論 */}
        {(otherReviews ?? []).length > 0 && (
          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 11, color: "#AAA", letterSpacing: "0.08em", marginBottom: 12 }}>同一旅宿的其他評論</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(otherReviews ?? []).map((r) => {
                const name = r.author_name || "匿名旅人"
                const preview = (r.positive || "").slice(0, 80)
                const full = Math.round(r.rating ?? 0)
                return (
                  <Link key={r.id} href={`/review/${r.id}`} style={{ background: "white", border: "1px solid #EBEBEB", borderRadius: 16, padding: "14px 16px", textDecoration: "none", display: "block" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{name}</span>
                      {r.rating && <span style={{ color: "#F5A623", fontSize: 12 }}>{"★".repeat(full)}{"☆".repeat(5 - full)}</span>}
                    </div>
                    {preview && <p style={{ fontSize: 12, color: "#666", lineHeight: 1.6 }}>{preview}{(r.positive || "").length > 80 ? "…" : ""}</p>}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* 回到旅宿頁 */}
        {property && (
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <Link href={`/hotel/${property.id}`} style={{ fontSize: 13, color: "#4B7BF5", textDecoration: "none" }}>
              查看 {property.name_zh || property.name_en} 的所有評論 →
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
