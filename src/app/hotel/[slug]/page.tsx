import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export default async function HotelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const propertyId = parseInt(slug)
  if (isNaN(propertyId)) notFound()

  // Fetch property
  const { data: property } = await supabase
    .from("properties")
    .select("id, name_en, country, prefecture, cover_image_url")
    .eq("id", propertyId)
    .single()

  if (!property) notFound()

  // Fetch travel stories for this property
  const { data: stories } = await supabase
    .from("travel_stories")
    .select("id, title, zh_tw_title, description, zh_tw_description, hafh_url, likes_count, published_at, author_email, ai_rating")
    .eq("property_id", propertyId)
    .order("likes_count", { ascending: false })
    .limit(30)

  // Fetch user reviews for this property
  const { data: userReviews } = await supabase
    .from("reviews")
    .select("id, user_id, author_name, author_email, rating, positive, negative, check_in_month, purposes, created_at")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(20)

  // Fetch display names for user reviews
  const userIds = [...new Set((userReviews ?? []).map(r => r.user_id).filter(Boolean))]
  const { data: usersData } = userIds.length > 0
    ? await supabase.from("users").select("id, display_name, name").in("id", userIds)
    : { data: [] }
  const usersMap = new Map((usersData ?? []).map(u => [u.id, u.display_name || u.name]))

  const reviewList = stories ?? []

  // 查詢該飯店所有故事的 ai_rating（不受 limit 30 限制）
  const { data: allAiRatings } = await supabase
    .from("travel_stories")
    .select("ai_rating")
    .eq("property_id", propertyId)
    .not("ai_rating", "is", null)

  // 計算綜合星等（用戶評論 + HafH AI 評分）
  const userRatings = (userReviews ?? []).map(r => r.rating as number)
  const hafhAiRatingValues = (allAiRatings ?? []).map(s => s.ai_rating as number)
  const allRatingValues = [...userRatings, ...hafhAiRatingValues]
  const avgRating = allRatingValues.length > 0
    ? allRatingValues.reduce((sum, r) => sum + r, 0) / allRatingValues.length
    : null
  const humanCount = userRatings.length
  const aiCount = hafhAiRatingValues.length

  const googleHotelsUrl = `https://www.google.com/travel/hotels/search?q=${encodeURIComponent(property.name_en)}`
  const mapQuery = encodeURIComponent(`${property.name_en} ${property.prefecture} ${property.country}`)

  return (
    <div className="min-h-screen" style={{ background: "#F5F5F5" }}>

      {/* Nav */}
      <nav style={{ background: "white", borderBottom: "1px solid #EBEBEB", padding: "0 24px", height: "52px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <Link href="/" style={{ fontSize: "17px", fontWeight: 700, color: "#111", textDecoration: "none", letterSpacing: "-0.01em" }}>StayNote</Link>
        <Link href="javascript:history.back()" style={{ fontSize: "13px", color: "#888", textDecoration: "none" }}>← 回搜尋結果</Link>
      </nav>

      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 20px 60px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Header */}
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EBEBEB", overflow: "hidden" }}>
          {property.cover_image_url ? (
            <img
              src={property.cover_image_url}
              alt={property.name_en}
              style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{ background: "#EEF0FF", height: "160px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px" }}>
              🏨
            </div>
          )}
          <div style={{ padding: "20px 20px 24px" }}>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#111", marginBottom: "4px", lineHeight: 1.3 }}>
              {property.name_en}
            </h1>
            <p style={{ fontSize: "13px", color: "#AAA", marginBottom: "14px" }}>
              {property.prefecture} · {property.country}
            </p>
            {/* 星等統計 */}
            {avgRating !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", padding: "12px 14px", background: "#FFFBF0", borderRadius: "12px" }}>
                <span style={{ fontSize: "24px", fontWeight: 800, color: "#111" }}>{avgRating.toFixed(1)}</span>
                <div>
                  <div style={{ color: "#F5A623", fontSize: "14px", letterSpacing: "1px" }}>
                    {"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}
                  </div>
                  <p style={{ fontSize: "11px", color: "#AAA", marginTop: "2px" }}>
                    {humanCount > 0 && `${humanCount} 則用戶評論`}
                    {humanCount > 0 && aiCount > 0 && " · "}
                    {aiCount > 0 && `${aiCount} 則 AI 評分`}
                  </p>
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: "#555", background: "#F5F5F5", borderRadius: "20px", padding: "4px 12px" }}>
                {reviewList.length} 則旅人故事
              </span>
              {aiCount > 0 && (
                <span style={{ fontSize: "11px", color: "#AAA", background: "#F5F5F5", borderRadius: "20px", padding: "4px 12px" }}>
                  AI 星等僅供參考
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid #EBEBEB", height: "200px" }}>
          <iframe
            title={`${property.name_en} 地圖`}
            src={`https://maps.google.com/maps?q=${mapQuery}&output=embed&hl=zh-TW`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
          />
        </div>

        {/* Booking */}
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EBEBEB", padding: "18px 20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#111", marginBottom: "4px" }}>查看即時房價 & 訂房</p>
          <p style={{ fontSize: "11px", color: "#AAA", marginBottom: "14px" }}>比較 Booking、Agoda、Hotels.com 等多平台最低價</p>
          <a
            href={googleHotelsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111", color: "white", borderRadius: "12px", padding: "12px 16px", textDecoration: "none" }}
          >
            <span style={{ fontSize: "13px", fontWeight: 500 }}>🔍 Google Hotels 比價</span>
            <span style={{ fontSize: "12px", color: "#AAA" }}>→</span>
          </a>
        </div>

        {/* User Reviews */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <p style={{ fontSize: "11px", color: "#AAA", letterSpacing: "0.08em" }}>StayNote 用戶評論</p>
            <Link href="/write" style={{ fontSize: "13px", color: "#4B7BF5", textDecoration: "none", fontWeight: 500 }}>
              + 分享我的住宿
            </Link>
          </div>

          {(userReviews ?? []).length === 0 ? (
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EBEBEB", padding: "40px 20px", textAlign: "center" }}>
              <p style={{ fontSize: "14px", color: "#AAA" }}>還沒有評論，成為第一個分享的旅人</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(userReviews ?? []).map((review) => {
                const displayName = (review.user_id && usersMap.get(review.user_id)) || review.author_name || "匿名旅人"
                const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating)
                const excerpt = review.positive?.length > 180 ? review.positive.slice(0, 180) + "…" : review.positive

                return (
                  <div key={review.id} style={{ background: "white", borderRadius: "16px", border: "1px solid #EBEBEB", padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 600, color: "#4B7BF5", flexShrink: 0 }}>
                          {displayName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#111" }}>{displayName}</p>
                          {review.created_at && (
                            <p style={{ fontSize: "11px", color: "#CCC" }}>
                              {new Date(review.created_at).getFullYear()} 年
                              {review.check_in_month ? ` ${review.check_in_month} 月入住` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                      <span style={{ color: "#F5A623", fontSize: "13px" }}>{stars}</span>
                    </div>
                    {excerpt && (
                      <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.75 }}>{excerpt}</p>
                    )}
                    {review.negative && (
                      <p style={{ fontSize: "12px", color: "#AAA", marginTop: "6px", lineHeight: 1.6 }}>
                        可改善：{review.negative.length > 80 ? review.negative.slice(0, 80) + "…" : review.negative}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* HafH Stories */}
        {reviewList.length > 0 && (
        <div>
          <p style={{ fontSize: "11px", color: "#AAA", letterSpacing: "0.08em", marginBottom: "12px" }}>來自 HafH 的旅人故事</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {reviewList.map((story) => {
              const title = story.zh_tw_title || story.title || ""
              const desc = story.zh_tw_description || story.description || ""
              const excerpt = desc.length > 180 ? desc.slice(0, 180) + "…" : desc
              const authorName = story.author_email ? story.author_email.split("@")[0] : "匿名旅人"

              return (
                <div key={story.id} style={{ background: "white", borderRadius: "16px", border: "1px solid #EBEBEB", padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 600, color: "#4B7BF5", flexShrink: 0 }}>
                        {authorName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#111" }}>@{authorName}</p>
                        {story.published_at && (
                          <p style={{ fontSize: "11px", color: "#CCC" }}>
                            {new Date(story.published_at).getFullYear()} 年
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {story.ai_rating ? (
                        <>
                          <span style={{ color: "#F5A623", fontSize: "13px" }}>
                            {"★".repeat(story.ai_rating)}{"☆".repeat(5 - story.ai_rating)}
                          </span>
                          <p style={{ fontSize: "10px", color: "#CCC", marginTop: "2px" }}>AI 評分</p>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {title && (
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#333", marginBottom: "6px" }}>{title}</p>
                  )}
                  {excerpt && (
                    <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.75 }}>{excerpt}</p>
                  )}
                  {story.hafh_url && (
                    <a href={story.hafh_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: "inline-block", marginTop: "10px", fontSize: "11px", color: "#AAA", textDecoration: "none" }}>
                      來自 HafH →
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        )}

        {/* Social search */}
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EBEBEB", padding: "18px 20px" }}>
          <p style={{ fontSize: "11px", color: "#AAA", letterSpacing: "0.08em", marginBottom: "6px" }}>這間飯店在社群上怎麼說？</p>
          <p style={{ fontSize: "12px", color: "#888", marginBottom: "14px" }}>StayNote 提供結構化評論，社群上還有更多即時分享。</p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>

            {/* Threads */}
            <a href={`https://www.threads.net/search?q=${encodeURIComponent(property.name_en)}&serp_type=default`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", color: "#111", border: "1px solid #E0E0E0", borderRadius: "20px", padding: "7px 16px", textDecoration: "none" }}>
              <svg width="16" height="16" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.035l13.78 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.232c8.246.052 14.47 2.453 18.502 7.138 2.932 3.405 4.893 8.11 5.864 14.05-7.314-1.244-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.35-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.206 17.11 97.015 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 10.015 15.86 12.853 26.162l16.147-4.308c-3.44-12.68-8.853-23.606-16.219-32.668C147.036 9.607 125.202.195 97.144 0h-.29C68.882.194 47.292 9.642 32.788 28.08 19.882 44.485 13.224 67.315 13.001 95.932L13 96v.068c.224 28.617 6.882 51.447 19.787 67.854C47.292 182.358 68.882 191.806 96.854 192h.29c24.957-.173 42.566-6.713 57.04-21.166 18.936-18.921 18.274-42.567 12.061-57.115-4.25-9.908-12.379-17.96-24.708-23.731zm-45.74 39.293c-10.432.572-21.297-4.1-21.82-14.146-.397-7.44 5.3-15.725 22.463-16.718a115.1 115.1 0 0 1 6.702-.199c5.924 0 11.471.574 16.536 1.686-1.88 23.477-13.64 28.75-23.88 29.377z" fill="#000"/>
              </svg>
              搜尋 Threads
            </a>

            {/* Instagram */}
            <a href={`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(property.name_en)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", color: "#111", border: "1px solid #E0E0E0", borderRadius: "20px", padding: "7px 16px", textDecoration: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="ig1" cx="30%" cy="107%" r="150%">
                    <stop offset="0%" stopColor="#fdf497"/>
                    <stop offset="5%" stopColor="#fdf497"/>
                    <stop offset="45%" stopColor="#fd5949"/>
                    <stop offset="60%" stopColor="#d6249f"/>
                    <stop offset="90%" stopColor="#285AEB"/>
                  </radialGradient>
                </defs>
                <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig1)"/>
                <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none"/>
                <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
              </svg>
              搜尋 Instagram
            </a>

            {/* Google */}
            <a href={`https://www.google.com/search?q=${encodeURIComponent(property.name_en + " 評價 住宿")}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", color: "#111", border: "1px solid #E0E0E0", borderRadius: "20px", padding: "7px 16px", textDecoration: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              搜尋 Google
            </a>

          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EBEBEB", padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#111", marginBottom: "4px" }}>住過這裡？</p>
            <p style={{ fontSize: "12px", color: "#AAA" }}>分享你的評論，幫助其他旅人做決定</p>
          </div>
          <Link
            href="/write"
            style={{ background: "#111", color: "white", fontSize: "13px", fontWeight: 600, padding: "10px 20px", borderRadius: "20px", textDecoration: "none", whiteSpace: "nowrap" }}
          >
            寫評論
          </Link>
        </div>

      </main>
    </div>
  )
}
