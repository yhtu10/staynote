import Link from "next/link"

// --- Mock data ---
const hotel = {
  name: "The Lalu 涵碧樓",
  city: "南投・日月潭",
  address: "南投縣魚池鄉中山路142號",
  mapQuery: "The+Lalu+涵碧樓+日月潭",
  priceRange: "NT$ 12,000 – 28,000 / 晚",
  get bookingUrl() { return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(this.name)}` },
  get agodaUrl() { return `https://www.agoda.com/search?textToSearch=${encodeURIComponent(this.name)}&site=zh-tw` },
  ratingDist: [
    { stars: 5, count: 32, pct: 37 },
    { stars: 4, count: 35, pct: 40 },
    { stars: 3, count: 13, pct: 15 },
    { stars: 2, count: 5, pct: 6 },
    { stars: 1, count: 2, pct: 2 },
  ],
  totalReviews: 87,
}

// 加權平均，排除最高與最低各 5% 的極端值後四捨五入到 0.1
function calcRating(dist: typeof hotel.ratingDist, total: number) {
  const raw = dist.reduce((sum, r) => sum + r.stars * r.count, 0) / total
  // trimmed: 排除 1★ 和 5★ 各自只保留 80%
  const trimCount = dist.reduce((sum, r) => {
    if (r.stars === 1 || r.stars === 5) return sum + r.count * 0.8
    return sum + r.count
  }, 0)
  const trimSum = dist.reduce((sum, r) => {
    if (r.stars === 1 || r.stars === 5) return sum + r.stars * r.count * 0.8
    return sum + r.stars * r.count
  }, 0)
  const trimmed = trimSum / trimCount
  return { raw: Math.round(raw * 10) / 10, trimmed: Math.round(trimmed * 10) / 10 }
}

const rating = calcRating(hotel.ratingDist, hotel.totalReviews)

const curatedReviews = [
  {
    id: 1,
    author: "Wei Travels",
    handle: "@wei_travels",
    avatar: "W",
    avatarColor: "bg-blue-100 text-blue-700",
    date: "2025-06",
    content: "清晨五點的湖面安靜得像一面鏡，早餐的蛋根本不需要配料。這裡有種讓你說不出話的美，只能發呆。服務態度是我住過最自然的，不卑不亢，恰到好處。\n\n唯一的建議是 spa 的預約系統不太直觀，建議 check-in 當天就先確認。",
    rating: 5,
    tags: ["情侶", "奢華享受"],
    curated: true,
    photos: ["🏔️", "🛏️", "🍳"],
  },
]

type AgeTag = "older" | "oldest" | "recent"

const communityReviews: {
  id: number
  author: string
  initial: string
  avatarColor: string
  date: string
  checkInDate: string
  ageTag: AgeTag
  rating: number
  positive: string
  negative: string
  bedType: string
  purpose: string[]
  recommendFor: string[]
  photos: string[]
}[] = [
  {
    id: 1,
    author: "陳小明",
    initial: "陳",
    avatarColor: "bg-violet-100 text-violet-700",
    date: "2025-11",
    checkInDate: "2025-11",
    ageTag: "recent",
    rating: 5,
    positive: "只能搭船進去就已經值回票價。服務員記得你的名字和每次對話的細節，完全不像制式服務。",
    negative: "無明顯缺點",
    bedType: "一大床",
    purpose: ["情侶"],
    recommendFor: ["情侶", "奢華享受"],
    photos: ["🌅", "🏊"],
  },
  {
    id: 2,
    author: "Lin Mei",
    initial: "林",
    avatarColor: "bg-emerald-100 text-emerald-700",
    date: "2025-08",
    checkInDate: "2025-08",
    ageTag: "recent",
    rating: 4,
    positive: "房間視野絕佳，湖景無遮擋。早餐種類豐富，現做蛋品很新鮮。",
    negative: "週末人較多，spa 需要提前預約否則很難排到。",
    bedType: "一大床",
    purpose: ["家庭"],
    recommendFor: ["家庭（含幼兒）", "奢華享受"],
    photos: [],
  },
  {
    id: 3,
    author: "旅人 Kevin",
    initial: "K",
    avatarColor: "bg-amber-100 text-amber-700",
    date: "2024-03",
    checkInDate: "2024-03",
    ageTag: "older",
    rating: 4,
    positive: "湖景房真的很值，傍晚時分湖面顏色會一直變化，坐在陽台可以待好幾個小時。",
    negative: "部分設施稍顯老舊，但整體維護得不錯。",
    bedType: "兩小床",
    purpose: ["家庭"],
    recommendFor: ["家庭（含幼兒）"],
    photos: ["🌄"],
  },
  {
    id: 4,
    author: "Sophia W.",
    initial: "S",
    avatarColor: "bg-pink-100 text-pink-700",
    date: "2023-05",
    checkInDate: "2023-05",
    ageTag: "oldest",
    rating: 3,
    positive: "地點和景色是無可挑剔的，日月潭本身就值得來。",
    negative: "當時房間有輕微霉味，已向櫃台反映但未完全解決。",
    bedType: "一大床",
    purpose: ["情侶"],
    recommendFor: ["情侶"],
    photos: [],
  },
]

// 聚合所有評論的 recommendFor，回傳由多到少排序
function calcTopRecommend(reviews: typeof communityReviews) {
  const tally: Record<string, number> = {}
  reviews.forEach((r) => r.recommendFor.forEach((g) => { tally[g] = (tally[g] ?? 0) + 1 }))
  return Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
}

function Stars({ count, size = "sm" }: { count: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "text-xl" : "text-sm"
  return (
    <span className={`${cls} text-amber-400 tracking-tight`}>
      {"★".repeat(count)}{"☆".repeat(5 - count)}
    </span>
  )
}

function RatingBar({ stars, pct, count }: { stars: number; pct: number; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-neutral-500 w-6 text-right">{stars}★</span>
      <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm text-neutral-400 w-8">{count}</span>
    </div>
  )
}

// 照片縮圖（MVP 用 emoji 佔位，之後換真實圖片）
function PhotoThumbs({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null
  return (
    <div className="flex gap-2 mt-3">
      {photos.slice(0, 4).map((p, i) => (
        <div
          key={i}
          className="w-16 h-16 rounded-lg bg-neutral-100 flex items-center justify-center text-2xl flex-shrink-0 border border-neutral-200"
        >
          {p}
        </div>
      ))}
      {photos.length > 4 && (
        <div className="w-16 h-16 rounded-lg bg-neutral-100 flex items-center justify-center text-sm text-neutral-400 border border-neutral-200">
          +{photos.length - 4}
        </div>
      )}
    </div>
  )
}

export default function HotelPage() {
  const topRecommend = calcTopRecommend(communityReviews)
  const recentReviews = communityReviews.filter((r) => r.ageTag === "recent")
  const olderReviews = communityReviews.filter((r) => r.ageTag === "older")
  const oldestReviews = communityReviews.filter((r) => r.ageTag === "oldest")

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center gap-3">
          <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600">← 首頁</Link>
          <span className="text-neutral-200">/</span>
          <span className="text-sm text-neutral-700 font-medium truncate">{hotel.name}</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-5 py-8 flex flex-col gap-8">

        {/* Hotel header */}
        <section>
          <div className="bg-emerald-50 rounded-2xl h-48 flex items-center justify-center mb-5">
            <span className="text-6xl">🏨</span>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">{hotel.name}</h1>
              <p className="text-neutral-500 mt-1">{hotel.city}</p>
              <p className="text-sm text-neutral-400 mt-0.5">{hotel.address}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-400 mb-1">參考價格</p>
              <p className="text-sm font-medium text-neutral-700">{hotel.priceRange}</p>
            </div>
          </div>
        </section>

        {/* Google Maps */}
        <section className="rounded-2xl overflow-hidden border border-neutral-200 h-52">
          <iframe
            title={`${hotel.name} 地圖`}
            src={`https://maps.google.com/maps?q=${hotel.mapQuery}&output=embed&hl=zh-TW`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
          />
        </section>

        {/* Booking CTA */}
        <section className="bg-white border border-neutral-200 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
            <div>
              <p className="font-medium text-neutral-900 text-sm mb-1">查看即時房價 &amp; 訂房</p>
              <p className="text-xs text-neutral-400">比較多個平台，找到最優惠價格</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <a
                href={hotel.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
              >
                Booking.com
              </a>
              <a
                href={hotel.agodaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-red-600 transition-colors"
              >
                Agoda
              </a>
            </div>
          </div>
          <div className="bg-amber-50 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-center gap-2">
            <span>🎁</span>
            <span>分享其他住宿心得，可賺取 <strong>KBK exchange</strong> 訂房折抵點數，下次訂房直接扣抵。</span>
            <Link href="/write" className="ml-auto whitespace-nowrap text-amber-700 underline underline-offset-2 hover:text-amber-900">
              去寫評論
            </Link>
          </div>
        </section>

        {/* Rating distribution */}
        <section className="bg-white border border-neutral-200 rounded-2xl p-6">
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-5">評分分佈</p>
          <div className="flex gap-8 items-start flex-wrap">
            <div className="flex flex-col gap-2.5 flex-1 min-w-48">
              {hotel.ratingDist.map((r) => (
                <RatingBar key={r.stars} stars={r.stars} pct={r.pct} count={r.count} />
              ))}
            </div>
            <div className="text-center min-w-24">
              <p className="text-3xl font-semibold text-neutral-900">{rating.raw}</p>
              <Stars count={Math.round(rating.raw)} size="sm" />
              <p className="text-xs text-neutral-400 mt-1">共 {hotel.totalReviews} 則</p>
              <div className="mt-3 pt-3 border-t border-neutral-100">
                <p className="text-xs text-neutral-400">排除極端值</p>
                <p className="text-lg font-medium text-neutral-700 mt-0.5">{rating.trimmed}</p>
                <p className="text-xs text-neutral-400">參考均分</p>
              </div>
            </div>
          </div>
        </section>

        {/* Traveler profile summary */}
        <section className="bg-white border border-neutral-200 rounded-2xl p-5">
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-4">旅人綜合推薦</p>
          <p className="text-sm text-neutral-500 mb-3">
            根據 {communityReviews.length} 則評論，這間旅宿最多旅人推薦給：
          </p>
          <div className="flex flex-wrap gap-3">
            {topRecommend.map(([type, count], i) => (
              <div key={type} className="flex items-center gap-2">
                <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                  i === 0
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600"
                }`}>
                  {i === 0 && <span className="mr-1.5">🏅</span>}{type}
                </span>
                <span className="text-xs text-neutral-400">{count} 人推薦</span>
                {i < topRecommend.length - 1 && (
                  <span className="text-neutral-200 ml-1">·</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Curated reviews */}
        <section>
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-4">策展精選評論</p>
          {curatedReviews.map((r) => (
            <div key={r.id} className="bg-white border border-neutral-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full ${r.avatarColor} flex items-center justify-center font-medium text-sm flex-shrink-0`}>
                  {r.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-neutral-900">{r.author}</p>
                  <p className="text-xs text-neutral-400">{r.handle}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Stars count={r.rating} size="md" />
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">策展精選</span>
                </div>
              </div>
              <div className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line border-l-2 border-neutral-100 pl-4">
                {r.content}
              </div>
              <PhotoThumbs photos={r.photos} />
              <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-neutral-100">
                {r.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-neutral-100 text-neutral-500 px-2.5 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
                <span className="text-xs text-neutral-300 ml-auto self-center">{r.date}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Community reviews */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-neutral-400 uppercase tracking-widest">旅人怎麼說</p>
            <Link href="/write" className="text-sm text-blue-600 hover:text-blue-800">
              分享你的住宿 →
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {recentReviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}

            {olderReviews.length > 0 && (
              <>
                <div className="flex items-center gap-3 py-1">
                  <hr className="flex-1 border-neutral-200" />
                  <span className="text-xs text-neutral-400 whitespace-nowrap">較舊評論，僅供參考</span>
                  <hr className="flex-1 border-neutral-200" />
                </div>
                {olderReviews.map((r) => (
                  <ReviewCard key={r.id} review={r} older />
                ))}
              </>
            )}

            {oldestReviews.length > 0 && (
              <details className="group">
                <summary className="flex items-center gap-3 py-2 cursor-pointer list-none">
                  <hr className="flex-1 border-neutral-200" />
                  <span className="text-xs text-neutral-400 whitespace-nowrap group-open:hidden">
                    顯示 {oldestReviews.length} 則兩年以上的舊評論
                  </span>
                  <span className="text-xs text-neutral-400 whitespace-nowrap hidden group-open:block">
                    收起舊評論
                  </span>
                  <hr className="flex-1 border-neutral-200" />
                </summary>
                <div className="flex flex-col gap-4 mt-4">
                  {oldestReviews.map((r) => (
                    <ReviewCard key={r.id} review={r} older />
                  ))}
                </div>
              </details>
            )}
          </div>
        </section>

        {/* 社群連結 */}
        <section className="bg-white border border-neutral-200 rounded-2xl p-5">
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-3">這間飯店在社群上怎麼說？</p>
          <p className="text-sm text-neutral-500 mb-4">StayNote 提供結構化評論，社群上還有更多即時分享。</p>
          <div className="flex gap-3 flex-wrap">
            <a
              href={`https://www.threads.net/search?q=${encodeURIComponent(hotel.name)}&serp_type=default`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-neutral-200 rounded-full px-4 py-2 text-sm text-neutral-600 hover:border-neutral-400 transition-colors"
            >
              <span>𝕋</span> 搜尋 Threads →
            </a>
            <a
              href={`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(hotel.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-neutral-200 rounded-full px-4 py-2 text-sm text-neutral-600 hover:border-neutral-400 transition-colors"
            >
              <span>📷</span> 搜尋 IG →
            </a>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-neutral-100 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-medium text-neutral-900 mb-1">住過這裡？</p>
            <p className="text-sm text-neutral-500">分享你的評論，幫助其他旅人做決定</p>
          </div>
          <Link
            href="/write"
            className="bg-neutral-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-neutral-700 transition-colors whitespace-nowrap"
          >
            寫評論
          </Link>
        </section>

      </main>
    </div>
  )
}

type ReviewCardProps = {
  review: typeof communityReviews[0]
  older?: boolean
}

// mock 評論者履歷（之後從 Supabase 計算）
const reviewerStats: Record<string, { countries: number; stays: number }> = {
  "陳小明": { countries: 15, stays: 42 },
  "Lin Mei": { countries: 8, stays: 19 },
  "旅人 Kevin": { countries: 11, stays: 31 },
  "Sophia W.": { countries: 6, stays: 14 },
}

function ReviewCard({ review, older = false }: ReviewCardProps) {
  const stats = reviewerStats[review.author]
  return (
    <div className={`bg-white border border-neutral-200 rounded-xl p-5 ${older ? "opacity-80" : ""}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-full ${review.avatarColor} flex items-center justify-center text-sm font-medium flex-shrink-0`}>
          {review.initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900">{review.author}</p>
          {stats && (
            <p className="text-xs text-neutral-400">
              去過 {stats.countries} 個國家 · 住過 {stats.stays} 間飯店
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className="text-xs text-neutral-400">{review.checkInDate} 入住</span>
            <span className="text-xs text-neutral-300">·</span>
            <span className="text-xs text-neutral-400">{review.bedType}</span>
            {review.purpose.map((p) => (
              <span key={p} className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">{p}</span>
            ))}
          </div>
        </div>
        <Stars count={review.rating} />
      </div>

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

      {review.recommendFor.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-3 mt-3 border-t border-neutral-100">
          <span className="text-xs text-neutral-400">推薦給</span>
          {review.recommendFor.map((g) => (
            <span key={g} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{g}</span>
          ))}
          <span className="text-xs text-neutral-300 ml-auto">{review.date}</span>
        </div>
      )}
    </div>
  )
}
