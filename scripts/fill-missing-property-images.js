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
    const res = await fetch(`https://www.hafh.com/zh-tw/properties/${id}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" },
      signal: AbortSignal.timeout(10000),
    })
    if (res.status === 404) return { url: null, notFound: true }
    if (!res.ok) return { url: null, notFound: false }
    const html = await res.text()
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
    if (!match) return { url: null, notFound: false }
    const str = JSON.stringify(JSON.parse(match[1]))
    const imgs = [...str.matchAll(/hafh-prod-property_image[^"\\]*/g)].map(m => "https://storage.googleapis.com/" + m[0])
    return { url: imgs[0] ?? null, notFound: false }
  } catch { return { url: null, notFound: false } }
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
  const { data: missing } = await supabase
    .from("properties")
    .select("id, name_en, prefecture")
    .or("cover_image_url.is.null,cover_image_url.eq.")
    .limit(5000)

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
      } else if ((notFound || !hafhUrl) && !googleQuotaExceeded) {
        // Step 2: Google 備援
        await new Promise(r => setTimeout(r, 300)) // 避免打太快
        const googleUrl = await fetchFromGoogle(name_en, prefecture)
        if (googleUrl === "QUOTA_EXCEEDED") {
          googleQuotaExceeded = true
        } else if (googleUrl) {
          await supabase.from("properties").update({ cover_image_url: googleUrl }).eq("id", id)
          fromGoogle++
        } else {
          failed++
        }
      } else if (googleQuotaExceeded) {
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
