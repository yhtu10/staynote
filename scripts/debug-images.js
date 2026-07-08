const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)
const GOOGLE_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
const GOOGLE_CX = process.env.GOOGLE_CUSTOM_SEARCH_CX
const GENERIC_OGP = "https://www.hafh.com/images/ogp/ogp-en.png"

async function run() {
  // 1. 查第一筆缺圖旅宿
  const { data: allProps } = await supabase.from("properties").select("id, name_en, prefecture, cover_image_url").limit(20000)
  const missing = (allProps ?? []).filter(p => !p.cover_image_url || p.cover_image_url === "" || p.cover_image_url === GENERIC_OGP)
  const { data: stories } = await supabase.from("travel_stories").select("property_id")
  const withStory = new Set((stories ?? []).map(s => s.property_id))
  const toFetch = missing.filter(p => withStory.has(p.id))

  console.log("缺圖且有 story：", toFetch.length, "筆")
  console.log("前 5 筆:", toFetch.slice(0, 5).map(p => `${p.id} ${p.name_en}`).join(", "))
  // 強制測試 Zentis Osaka（ID 926）
  const sample = toFetch.find(p => p.id === 926) ?? toFetch.find(p => p.name_en && p.name_en.length > 5) ?? toFetch[0]
  if (!sample) { console.log("沒有缺圖旅宿"); return }
  console.log("\n測試旅宿:", sample.id, sample.name_en, "| 現有圖:", sample.cover_image_url)

  // 2. 測試 HafH
  console.log("\n--- HafH 測試 ---")
  try {
    const res = await fetch(`https://www.hafh.com/zh-tw/properties/${sample.id}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" },
    })
    console.log("HTTP 狀態:", res.status)
    if (res.ok) {
      const html = await res.text()
      const hasNextData = html.includes("__NEXT_DATA__")
      console.log("有 __NEXT_DATA__:", hasNextData)
      if (hasNextData) {
        const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
        if (match) {
          const str = JSON.stringify(JSON.parse(match[1]))
          const queries = data?.props?.pageProps?.dehydratedState?.queries ?? []
          console.log("queries 數量:", queries.length)
          let found = false
          for (const q of queries) {
            const images = q?.state?.data?.property_images
            if (Array.isArray(images) && images.length > 0) {
              console.log("✓ 找到 property_images:", images[0]?.image_url)
              found = true; break
            }
          }
          if (!found) {
            const propImgMatch = html.match(/https:\/\/storage\.googleapis\.com\/hafh-prod-property_image\/[a-z0-9]+/)
            console.log("GCS 直接比對:", propImgMatch?.[0] ?? "無")
          }
        }
      }
    }
  } catch (e) { console.log("HafH 錯誤:", e.message) }

  // 3. 測試 Google
  console.log("\n--- Google 測試 ---")
  console.log("API Key 存在:", !!GOOGLE_KEY)
  console.log("CX 存在:", !!GOOGLE_CX)
  try {
    const q = encodeURIComponent(`${sample.name_en} ${sample.prefecture ?? ""} hotel`)
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&cx=${GOOGLE_CX}&searchType=image&q=${q}&num=1`
    const res = await fetch(url)
    console.log("Google HTTP 狀態:", res.status)
    const json = await res.json()
    if (json.error) console.log("Google 錯誤:", JSON.stringify(json.error))
    else console.log("Google 結果:", json?.items?.[0]?.link ?? "無結果")
  } catch (e) { console.log("Google 錯誤:", e.message) }
}

run()
