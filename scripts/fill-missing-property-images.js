/**
 * 補旅宿封面圖：
 * 1. 先從 HafH 旅宿頁抓圖
 * 2. HafH 回傳 404 或抓不到圖 → Google Custom Search 備援
 * 3. 結果存進 properties.cover_image_url（快取，避免重複查詢）
 *
 * 執行：node scripts/fill-missing-property-images.js
 */

const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

const GOOGLE_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
const GOOGLE_CX = process.env.GOOGLE_CUSTOM_SEARCH_CX
const CONCURRENCY = 4

async function fetchFromHafH(id) {
  try {
    const res = await fetch(`https://www.hafh.com/en/properties/${id}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    })
    if (res.status === 404) return { url: null, notFound: true }
    if (!res.ok) return { url: null, notFound: false }
    const html = await res.text()

    // og:image（屬性順序不固定，用寬鬆 regex）
    const ogMatch = html.match(/<meta[^>]+property="og:image"[^>]*content="([^"]+)"|<meta[^>]+content="([^"]+)"[^>]*property="og:image"/)
    const ogUrl = ogMatch?.[1] ?? ogMatch?.[2] ?? null
    const GENERIC = "hafh.com/images/ogp"
    if (ogUrl && !ogUrl.includes(GENERIC)) return { url: ogUrl, notFound: false }

    // 備用：直接從 HTML 找 GCS URL
    const directMatch = html.match(/https:\/\/storage\.googleapis\.com\/hafh-prod-property_image\/[a-z0-9]+/)
    if (directMatch) return { url: directMatch[0], notFound: false }

    return { url: null, notFound: false }
  } catch { return { url: null, notFound: false } }
}

async function fetchFromDDG(name, prefecture) {
  try {
    const q = `${name} ${prefecture ?? ""} hotel`
    const r1 = await fetch("https://duckduckgo.com/?q=" + encodeURIComponent(q) + "&iax=images&ia=images", {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(10000),
    })
    const html = await r1.text()
    const vqd = html.match(/vqd=['"](\d[\d-]+)['"]/)
    if (!vqd) return null
    const r2 = await fetch(`https://duckduckgo.com/i.js?q=${encodeURIComponent(q)}&vqd=${vqd[1]}&o=json&p=1`, {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://duckduckgo.com/" },
      signal: AbortSignal.timeout(8000),
    })
    const json = await r2.json()
    return json?.results?.[0]?.image ?? null
  } catch { return null }
}

async function fetchFromBooking(name, prefecture) {
  try {
    const q = encodeURIComponent(`${name} ${prefecture ?? ""}`)
    const url = `https://www.booking.com/searchresults.html?ss=${q}&lang=en-us`
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return null
    const html = await res.text()
    // 找 hotel 圖片（bstatic.com 是 Booking.com 的圖片 CDN）
    const imgMatch = html.match(/https:\/\/cf\.bstatic\.com\/xdata\/images\/hotel\/[^"'\s]+\.jpg/)
    return imgMatch?.[0] ?? null
  } catch { return null }
}

async function fetchFromGoogle(name, prefecture) {
  if (!GOOGLE_KEY || !GOOGLE_CX) return null
  try {
    const q = encodeURIComponent(`${name} ${prefecture ?? ""} hotel`)
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&cx=${GOOGLE_CX}&searchType=image&q=${q}&num=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (res.status === 429) { console.log("  ⚠️  Google 配額已滿，今日停止 Google 查詢"); return "QUOTA_EXCEEDED" }
    if (!res.ok) return null
    const json = await res.json()
    return json?.items?.[0]?.link ?? null
  } catch { return null }
}

async function run() {
  // 取缺圖且有 travel story 的旅宿（有出現在搜尋的才有意義）
  const GENERIC_OGP = "https://www.hafh.com/images/ogp/ogp-en.png"

  // 抓：沒圖、空字串、或是通用 OGP（前端不顯示的）
  const { data: allProps } = await supabase
    .from("properties")
    .select("id, name_en, prefecture, cover_image_url")
    .limit(20000)

  const missing = (allProps ?? []).filter(p =>
    !p.cover_image_url || p.cover_image_url === "" || p.cover_image_url === GENERIC_OGP
  )

  const { data: stories } = await supabase.from("travel_stories").select("property_id")
  const withStory = new Set((stories ?? []).map(s => s.property_id))
  const toFetch = (missing ?? []).filter(p => withStory.has(p.id))

  console.log(`待補圖旅宿：${toFetch.length} 筆`)

  let done = 0, fromHafH = 0, fromGoogle = 0, failed = 0
  let googleQuotaExceeded = false

  for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
    const batch = toFetch.slice(i, i + CONCURRENCY)

    await Promise.all(batch.map(async ({ id, name_en, prefecture }) => {
      // Step 1: HafH
      const { url: hafhUrl, notFound } = await fetchFromHafH(id)

      if (hafhUrl) {
        await supabase.from("properties").update({ cover_image_url: hafhUrl }).eq("id", id)
        fromHafH++
      } else {
        // Step 2: DuckDuckGo 圖片搜尋
        await new Promise(r => setTimeout(r, 300))
        const ddgUrl = await fetchFromDDG(name_en, prefecture)
        if (ddgUrl) {
          await supabase.from("properties").update({ cover_image_url: ddgUrl }).eq("id", id)
          fromGoogle++
          return
        }
        // Step 3: Google Custom Search 備援
        if (!googleQuotaExceeded) {
          const googleUrl = await fetchFromGoogle(name_en, prefecture)
          if (googleUrl === "QUOTA_EXCEEDED") {
            googleQuotaExceeded = true
          } else if (googleUrl) {
            await supabase.from("properties").update({ cover_image_url: googleUrl }).eq("id", id)
            fromGoogle++
            return
          }
        }
        failed++
      }

      done++
      if (done % 20 === 0) {
        console.log(`進度 ${done}/${toFetch.length} | HafH: ${fromHafH} | Google: ${fromGoogle} | 失敗: ${failed}`)
      }
    }))

    await new Promise(r => setTimeout(r, 150))
  }

  console.log(`\n完成！HafH: ${fromHafH} 筆 | Google: ${fromGoogle} 筆 | 仍缺圖: ${failed} 筆`)
}

run()
