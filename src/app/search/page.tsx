import Link from "next/link"
import Image from "next/image"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

async function fetchHafHImageUrl(storyId: number, hafhUrl: string): Promise<string | null> {
  try {
    const res = await fetch(hafhUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 86400 }, // cache for 24h at Next.js level
    })
    const html = await res.text()
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!match) return null
    const data = JSON.parse(match[1])

    // walk the props tree to find stay image or story image
    const str = JSON.stringify(data)
    const stayMatch = str.match(/hafh-prod-travel_story_stay_image\/([a-z0-9]+)/)
    const storyMatch = str.match(/hafh-prod-travel_story_image\/([a-z0-9]+)/)
    const token = stayMatch?.[1] ?? storyMatch?.[1] ?? null
    if (!token) return null

    const url = stayMatch
      ? `https://storage.googleapis.com/hafh-prod-travel_story_stay_image/${token}`
      : `https://storage.googleapis.com/hafh-prod-travel_story_image/${token}`

    // cache back to Supabase (fire and forget)
    supabase.from("travel_stories").update({ cover_image_url: url }).eq("id", storyId).then(() => {})

    return url
  } catch {
    return null
  }
}

const TAG_MAP: Record<string, string[]> = {
  "親子": ["Family Travel", "Zoos & Aquariums"],
  "家族": ["Family Travel"],
  "小孩": ["Family Travel", "Zoos & Aquariums"],
  "情侶": ["Couples"],
  "夫妻": ["Couples"],
  "夫婦": ["Couples"],
  "獨旅": ["Solo Travel"],
  "一個人": ["Solo Travel"],
  "朋友": ["Friends"],
  "閨蜜": ["Friends"],
  "商務": ["Business Travel"],
  "出差": ["Business Travel"],
  "溫泉": ["Hot Springs"],
  "泡湯": ["Hot Springs"],
  "泳池": ["Pool"],
  "游泳": ["Pool"],
  "早餐": ["Breakfast"],
  "設計": ["Arts & Museums"],
  "藝術": ["Arts & Museums"],
  "美食": ["Food & Dining"],
  "購物": ["Shopping"],
  "海景": ["Ocean View"],
  "山": ["Nature & Outdoors"],
  "自然": ["Nature & Outdoors"],
  "近車站": ["Near Station"],
  "交通": ["Near Station"],
  "機場": ["Near Airport"],
  "台南": ["台南"],
  "台北": ["台北"],
  "京都": ["京都"],
  "東京": ["東京"],
  "大阪": ["大阪"],
  "沖繩": ["沖繩"],
  "九州": ["九州"],
  "北海道": ["北海道"],
  "首爾": ["首爾"],
}

const COUNTRY_MAP: Record<string, string> = {
  "日本": "Japan", "東京": "Japan", "京都": "Japan", "大阪": "Japan",
  "北海道": "Japan", "沖繩": "Japan", "九州": "Japan", "澀谷": "Japan",
  "新宿": "Japan", "淺草": "Japan", "箱根": "Japan", "鐮倉": "Japan",
  "台灣": "Taiwan", "台北": "Taiwan", "台南": "Taiwan", "高雄": "Taiwan",
  "韓國": "Korea", "首爾": "Korea",
}

// sub-city area keywords — trigger text search inside story descriptions
const AREA_KEYWORDS = ["澀谷", "新宿", "淺草", "銀座", "秋葉原", "池袋", "六本木", "品川", "上野", "代官山", "中目黑", "吉祥寺", "梅田", "難波", "心齋橋", "祇園", "嵐山", "那霸", "恩納", "大阪城", "道頓堀"]

const PREFECTURE_MAP: Record<string, string> = {
  "東京": "Tokyo", "澀谷": "Tokyo", "新宿": "Tokyo", "淺草": "Tokyo", "銀座": "Tokyo",
  "京都": "Kyoto",
  "大阪": "Osaka",
  "沖繩": "Okinawa",
  "北海道": "Hokkaido",
  "箱根": "Kanagawa", "鐮倉": "Kanagawa", "橫濱": "Kanagawa",
  "福岡": "Fukuoka",
  "廣島": "Hiroshima",
  "奈良": "Nara",
  "神戶": "Hyogo",
  "台北": "Taipei", "台南": "Tainan", "高雄": "Kaohsiung",
  "首爾": "Seoul",
}

function extractTags(query: string): string[] {
  const tags = new Set<string>()
  for (const [keyword, mappedTags] of Object.entries(TAG_MAP)) {
    if (query.includes(keyword)) {
      mappedTags.forEach(t => tags.add(t))
    }
  }
  return Array.from(tags)
}

function extractCountry(query: string): string | null {
  for (const [keyword, country] of Object.entries(COUNTRY_MAP)) {
    if (query.includes(keyword)) return country
  }
  return null
}

function extractPrefecture(query: string): string | null {
  for (const [keyword, prefecture] of Object.entries(PREFECTURE_MAP)) {
    if (query.includes(keyword)) return prefecture
  }
  return null
}

async function searchHotels(query: string) {
  const tags = extractTags(query)
  const country = extractCountry(query)
  const prefecture = extractPrefecture(query)
  const areaKeyword = AREA_KEYWORDS.find((kw) => query.includes(kw)) ?? null

  // Step 1: get matching property IDs (filter by location)
  let propQuery = supabase
    .from("properties")
    .select("id, name_en, country, prefecture")
    .limit(500)

  if (prefecture) {
    propQuery = propQuery.eq("prefecture", prefecture)
  } else if (country) {
    propQuery = propQuery.eq("country", country)
  }

  const { data: properties } = await propQuery
  if (!properties || properties.length === 0) return []

  const propIds = properties.map((p) => p.id)

  // Step 2: collect story IDs — from tags and/or area text search
  const storyIdSets: Set<number>[] = []

  if (tags.length > 0) {
    const { data: tagData } = await supabase
      .from("story_tags")
      .select("story_id")
      .in("tag", tags)
      .limit(500)
    if (tagData) storyIdSets.push(new Set(tagData.map((r) => r.story_id)))
  }

  if (areaKeyword) {
    // text search in story descriptions for the area name
    const { data: textData } = await supabase
      .from("travel_stories")
      .select("id")
      .in("property_id", propIds)
      .or(`zh_tw_description.ilike.%${areaKeyword}%,description.ilike.%${areaKeyword}%,zh_tw_title.ilike.%${areaKeyword}%,title.ilike.%${areaKeyword}%`)
      .limit(300)
    if (textData) storyIdSets.push(new Set(textData.map((r) => r.id)))
  }

  // Step 3: get stories — intersect sets if both exist, else use whichever we have
  let storiesQuery = supabase
    .from("travel_stories")
    .select("id, title, zh_tw_title, zh_tw_description, description, property_id, likes_count, hafh_url, cover_image_url")
    .in("property_id", propIds)
    .not("property_id", "is", null)
    .order("likes_count", { ascending: false })
    .limit(100)

  if (storyIdSets.length === 2) {
    // intersect: stories matching BOTH tags and area
    const intersection = [...storyIdSets[0]].filter((id) => storyIdSets[1].has(id))
    const finalIds = intersection.length > 0 ? intersection : [...storyIdSets[1]]
    storiesQuery = storiesQuery.in("id", finalIds)
  } else if (storyIdSets.length === 1) {
    storiesQuery = storiesQuery.in("id", [...storyIdSets[0]])
  }

  const { data: stories } = await storiesQuery
  if (!stories || stories.length === 0) return []

  const propMap = new Map(properties.map((p) => [p.id, p]))

  const grouped = new Map<number, { property: { id: number; name_en: string; country: string; prefecture: string }; stories: typeof stories }>()
  for (const story of stories) {
    const prop = propMap.get(story.property_id)
    if (!prop) continue
    if (!grouped.has(story.property_id)) {
      grouped.set(story.property_id, { property: prop, stories: [] })
    }
    grouped.get(story.property_id)!.stories.push(story)
  }

  return Array.from(grouped.values()).slice(0, 8)
}

const CARD_COLORS = ["#EEF0FF", "#FFF8EE", "#F0FFF4", "#FFF0F5", "#F0F8FF", "#FFFBEE"]

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q ?? ""
  const results = query ? await searchHotels(query) : []

  // for each result, resolve image URL (use cached or fetch from HafH)
  const imageUrls = await Promise.all(
    results.map(async ({ stories }) => {
      const top = stories[0]
      if (top.cover_image_url) return top.cover_image_url
      if (!top.hafh_url) return null
      return await fetchHafHImageUrl(top.id, top.hafh_url)
    })
  )

  return (
    <div className="min-h-screen" style={{ background: "#F5F5F5" }}>

      {/* Nav */}
      <nav style={{ background: "white", borderBottom: "1px solid #EBEBEB", padding: "0 24px", height: "52px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontSize: "17px", fontWeight: 700, color: "#111", textDecoration: "none", letterSpacing: "-0.01em" }}>StayNote</Link>
        <Link href="/" style={{ fontSize: "13px", color: "#888", textDecoration: "none" }}>← 重新搜尋</Link>
      </nav>

      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* Query recap */}
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EBEBEB", padding: "16px 20px", marginBottom: "24px" }}>
          <p style={{ fontSize: "11px", color: "#AAA", marginBottom: "6px", letterSpacing: "0.06em" }}>根據你的描述</p>
          <p style={{ fontSize: "14px", color: "#111", lineHeight: 1.7 }}>{query}</p>
        </div>

        {results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: "15px", color: "#888", marginBottom: "8px" }}>找不到符合的旅宿</p>
            <p style={{ fontSize: "13px", color: "#BBB" }}>試試換個關鍵字，例如加上城市或旅伴描述</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: "11px", color: "#AAA", marginBottom: "16px", letterSpacing: "0.06em" }}>
              找到 {results.length} 間旅宿
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
              {results.map(({ property, stories }, i) => {
                const topStory = stories[0]
                const displayDesc = topStory.zh_tw_description || topStory.description || ""
                const excerpt = displayDesc.length > 100 ? displayDesc.slice(0, 100) + "…" : displayDesc
                const bg = CARD_COLORS[i % CARD_COLORS.length]
                const imgUrl = imageUrls[i]

                return (
                  <Link
                    key={property.id}
                    href={`/hotel/${property.id}`}
                    style={{ background: "white", border: "1px solid #EBEBEB", borderRadius: "16px", overflow: "hidden", textDecoration: "none", display: "block" }}
                  >
                    {/* Image */}
                    <div style={{ height: "130px", overflow: "hidden", position: "relative", background: bg }}>
                      {imgUrl ? (
                        <Image
                          src={imgUrl}
                          alt={property.name_en}
                          fill
                          style={{ objectFit: "cover" }}
                          unoptimized
                        />
                      ) : (
                        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>🏨</div>
                      )}
                    </div>

                    <div style={{ padding: "14px 14px 16px" }}>
                      <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 600, color: "#4B7BF5", background: "#EEF2FF", borderRadius: "10px", padding: "2px 8px", marginBottom: "8px" }}>
                        來自 HafH
                      </span>
                      <p style={{ fontSize: "15px", fontWeight: 700, color: "#111", marginBottom: "3px", lineHeight: 1.4 }}>
                        {property.name_en}
                      </p>
                      <p style={{ fontSize: "11px", color: "#AAA", marginBottom: "10px" }}>
                        {property.prefecture} · {property.country}
                      </p>
                      {excerpt && (
                        <p style={{ fontSize: "12px", color: "#555", lineHeight: 1.7, marginBottom: "12px" }}>
                          「{excerpt}」
                        </p>
                      )}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ color: "#F5A623", fontSize: "13px" }}>★★★★★</span>
                        <span style={{ fontSize: "11px", color: "#AAA" }}>{stories.length} 則評論</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </main>

    </div>
  )
}
