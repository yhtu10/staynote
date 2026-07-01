import Link from "next/link"
import { notFound } from "next/navigation"
import { getHotelBySlug, HotelReview } from "@/data/hotelDetails"
import ReviewCardInteractive from "@/components/ReviewCardInteractive"

function calcRating(dist: { stars: number; count: number }[], total: number) {
  const raw = dist.reduce((sum, r) => sum + r.stars * r.count, 0) / total
  const trimCount = dist.reduce((sum, r) => (r.stars === 1 || r.stars === 5) ? sum + r.count * 0.8 : sum + r.count, 0)
  const trimSum = dist.reduce((sum, r) => (r.stars === 1 || r.stars === 5) ? sum + r.stars * r.count * 0.8 : sum + r.stars * r.count, 0)
  return { raw: Math.round(raw * 10) / 10, trimmed: Math.round(trimSum / trimCount * 10) / 10 }
}

function calcTopRecommend(reviews: HotelReview[]) {
  const tally: Record<string, number> = {}
  reviews.forEach((r) => r.recommendFor.forEach((g) => { tally[g] = (tally[g] ?? 0) + 1 }))
  return Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 3)
}

function Stars({ count, size = "sm" }: { count: number; size?: "sm" | "md" }) {
  return (
    <span className={`${size === "md" ? "text-xl" : "text-sm"} text-amber-400 tracking-tight`}>
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


export default async function HotelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const hotel = getHotelBySlug(slug)
  if (!hotel) notFound()

  const rating = calcRating(hotel.ratingDist, hotel.totalReviews)
  const topRecommend = calcTopRecommend(hotel.reviews)
  const recentReviews = hotel.reviews.filter((r) => r.ageTag === "recent")
  const olderReviews = hotel.reviews.filter((r) => r.ageTag === "older")
  const oldestReviews = hotel.reviews.filter((r) => r.ageTag === "oldest")

  const googleHotelsUrl = `https://www.google.com/travel/hotels/search?q=${encodeURIComponent(hotel.nameEn || hotel.name)}`

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
              <div className="flex flex-wrap gap-2 mb-2">
                {hotel.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-neutral-100 text-neutral-500 px-2.5 py-1 rounded-full">{tag}</span>
                ))}
              </div>
              <h1 className="text-2xl font-semibold text-neutral-900">{hotel.name}</h1>
              {hotel.nameEn !== hotel.name && (
                <p className="text-sm text-neutral-400 mt-0.5">{hotel.nameEn}</p>
              )}
              <p className="text-neutral-500 mt-1">{hotel.city} · {hotel.country}</p>
              <p className="text-sm text-neutral-400 mt-0.5">{hotel.address}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-neutral-400 mb-1">參考價格</p>
              <p className="text-sm font-medium text-neutral-700">{hotel.priceRange}</p>
            </div>
          </div>
          <p className="text-sm text-neutral-600 leading-relaxed mt-4 border-l-2 border-neutral-200 pl-4">{hotel.description}</p>
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
        <section className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col gap-3">
          <div>
            <p className="font-medium text-neutral-900 text-sm mb-1">查看即時房價 &amp; 訂房</p>
            <p className="text-xs text-neutral-400">比較 Booking、Agoda、Hotels.com 等多平台最低價</p>
          </div>
          <a
            href={googleHotelsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-neutral-900 text-white rounded-xl px-5 py-3.5 hover:bg-neutral-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🔍</span>
              <span className="text-sm font-medium">Google Hotels 比價</span>
            </div>
            <span className="text-xs text-neutral-400">→</span>
          </a>
          <div className="flex items-center justify-between border border-amber-200 bg-amber-50 rounded-xl px-4 py-3 gap-3">
            <div>
              <p className="text-sm font-medium text-amber-800">KBK exchange</p>
              <p className="text-xs text-amber-600 mt-0.5">使用 StayNote 點數可直接折抵訂房金額</p>
            </div>
            <a
              href="https://kbk.exchange"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-xs font-medium text-amber-700 border border-amber-300 rounded-full px-3 py-1.5 hover:bg-amber-100 transition-colors"
            >
              前往訂房 →
            </a>
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
              <Stars count={Math.round(rating.raw)} />
              <p className="text-xs text-neutral-400 mt-1">共 {hotel.totalReviews} 則</p>
              <div className="mt-3 pt-3 border-t border-neutral-100">
                <p className="text-xs text-neutral-400">排除極端值</p>
                <p className="text-lg font-medium text-neutral-700 mt-0.5">{rating.trimmed}</p>
                <p className="text-xs text-neutral-400">參考均分</p>
              </div>
            </div>
          </div>
        </section>

        {/* Traveler summary */}
        <section className="bg-white border border-neutral-200 rounded-2xl p-5">
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-4">旅人綜合推薦</p>
          <p className="text-sm text-neutral-500 mb-3">
            根據 {hotel.reviews.length} 則評論，這間旅宿最多旅人推薦給：
          </p>
          <div className="flex flex-wrap gap-3">
            {topRecommend.map(([type, count], i) => (
              <div key={type} className="flex items-center gap-2">
                <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${i === 0 ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}>
                  {i === 0 && <span className="mr-1.5">🏅</span>}{type}
                </span>
                <span className="text-xs text-neutral-400">{count} 人推薦</span>
                {i < topRecommend.length - 1 && <span className="text-neutral-200 ml-1">·</span>}
              </div>
            ))}
          </div>
        </section>

        {/* Curated review */}
        <section>
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-4">策展精選評論</p>
          <div className="bg-white border border-neutral-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-sm flex-shrink-0">
                {hotel.curatedAuthor[0]}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-neutral-900">{hotel.curatedAuthor}</p>
                <p className="text-xs text-neutral-400">{hotel.curatedHandle}</p>
              </div>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">策展精選</span>
            </div>
            <div className="text-sm text-neutral-700 leading-relaxed border-l-2 border-neutral-100 pl-4">
              {hotel.curatedExcerpt}
            </div>
          </div>
        </section>

        {/* Community reviews */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-neutral-400 uppercase tracking-widest">旅人怎麼說</p>
            <Link href="/write" className="text-sm text-blue-600 hover:text-blue-800">分享你的住宿 →</Link>
          </div>
          <div className="flex flex-col gap-4">
            {recentReviews.map((r) => <ReviewCardInteractive key={r.id} review={r} />)}
            {olderReviews.length > 0 && (
              <>
                <div className="flex items-center gap-3 py-1">
                  <hr className="flex-1 border-neutral-200" />
                  <span className="text-xs text-neutral-400 whitespace-nowrap">較舊評論，僅供參考</span>
                  <hr className="flex-1 border-neutral-200" />
                </div>
                {olderReviews.map((r) => <ReviewCardInteractive key={r.id} review={r} older />)}
              </>
            )}
            {oldestReviews.length > 0 && (
              <details className="group">
                <summary className="flex items-center gap-3 py-2 cursor-pointer list-none">
                  <hr className="flex-1 border-neutral-200" />
                  <span className="text-xs text-neutral-400 whitespace-nowrap group-open:hidden">
                    顯示 {oldestReviews.length} 則兩年以上的舊評論
                  </span>
                  <span className="text-xs text-neutral-400 whitespace-nowrap hidden group-open:block">收起舊評論</span>
                  <hr className="flex-1 border-neutral-200" />
                </summary>
                <div className="flex flex-col gap-4 mt-4">
                  {oldestReviews.map((r) => <ReviewCardInteractive key={r.id} review={r} older />)}
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
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 border border-neutral-200 rounded-full px-4 py-2 text-sm text-neutral-600 hover:border-neutral-400 transition-colors"
            >
              <span>𝕋</span> 搜尋 Threads →
            </a>
            <a
              href={`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(hotel.name)}`}
              target="_blank" rel="noopener noreferrer"
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
          <Link href="/write" className="bg-neutral-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-neutral-700 transition-colors whitespace-nowrap">
            寫評論
          </Link>
        </section>

      </main>
    </div>
  )
}
