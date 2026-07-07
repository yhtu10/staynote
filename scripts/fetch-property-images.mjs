/**
 * 從 HafH 旅宿頁面抓取封面照片，存回 properties.cover_image_url
 * 執行：node scripts/fetch-property-images.mjs
 */
import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, "../.env.local") })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

const GENERIC_OGP = "https://www.hafh.com/images/ogp/ogp-en.png"

async function fetchPropertyImage(propertyId) {
  const url = `https://www.hafh.com/en/properties/${propertyId}`
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const html = await res.text()

    // 從 __NEXT_DATA__ 取 property_images[0].image_url（官方飯店照片）
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (nextDataMatch) {
      try {
        const data = JSON.parse(nextDataMatch[1])
        const queries = data?.props?.pageProps?.dehydratedState?.queries ?? []
        for (const q of queries) {
          const images = q?.state?.data?.property_images
          if (Array.isArray(images) && images.length > 0 && images[0]?.image_url) {
            return images[0].image_url
          }
        }
      } catch { /* 繼續嘗試其他方式 */ }
    }

    // 備用：GCS bucket property_image 路徑
    const propImgMatch = html.match(/https:\/\/storage\.googleapis\.com\/hafh-prod-property_image\/[a-z0-9]+/)
    if (propImgMatch?.[0]) return propImgMatch[0]

    return null
  } catch {
    return null
  }
}

async function main() {
  let offset = 0
  const batchSize = 20
  let totalDone = 0
  let totalFailed = 0

  console.log("開始抓取旅宿照片…\n")

  while (true) {
    // 抓 cover_image_url 是 null 或是通用 OGP（需要重新抓）的旅宿
    const { data: properties } = await supabase
      .from("properties")
      .select("id, name_en")
      .or(`cover_image_url.is.null,cover_image_url.eq.${GENERIC_OGP}`)
      .range(offset, offset + batchSize - 1)

    if (!properties || properties.length === 0) break

    for (const prop of properties) {
      const imgUrl = await fetchPropertyImage(prop.id)
      if (imgUrl) {
        await supabase.from("properties").update({ cover_image_url: imgUrl }).eq("id", prop.id)
        totalDone++
        console.log(`✓ #${prop.id} ${prop.name_en.slice(0, 30)}`)
      } else {
        totalFailed++
      }
      // 避免 rate limit
      await new Promise(r => setTimeout(r, 800))
    }

    offset += batchSize
    console.log(`--- 已抓 ${totalDone} 張，失敗 ${totalFailed} 間 ---\n`)
  }

  console.log(`\n完成！成功 ${totalDone} 張，失敗 ${totalFailed} 間。`)
}

main()
