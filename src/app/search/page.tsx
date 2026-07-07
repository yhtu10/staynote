import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
import SearchResults from "@/components/SearchResults"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

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

async function searchHotels(query: string): Promise<{ results: SearchResult[]; isFallback: boolean }> {
  const country = extractCountry(query)
  const prefecture = extractPrefecture(query)

  // Step 1: embed the query
  let queryEmbedding: number[] | null = null
  try {
    const embRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    })
    queryEmbedding = embRes.data[0].embedding
  } catch {
    // fallback to keyword search if OpenAI fails
  }

  let storyRows: { story_id: number; property_id: number; similarity: number }[] = []

  if (queryEmbedding) {
    // Step 2a: semantic vector search
    const { data: matchData } = await supabase.rpc("match_stories", {
      query_embedding: queryEmbedding,
      match_count: 120,
    })
    storyRows = (matchData ?? []) as typeof storyRows
  }

  // Step 2b: if location specified, filter by property location
  // 使用 JOIN 而不是先 fetch propIds（避免數百個 ID 造成 URL 過長）
  if (storyRows.length > 0 && (prefecture || country)) {
    // 只保留語意結果裡符合地點的 property_id
    // 先 fetch 前 200 個地點 property IDs 來過濾語意結果
    let propQuery = supabase.from("properties").select("id").limit(200)
    if (prefecture) propQuery = propQuery.eq("prefecture", prefecture)
    else if (country) propQuery = propQuery.eq("country", country)
    const { data: locationProps } = await propQuery
    const locationPropIds = new Set((locationProps ?? []).map((p) => p.id))
    if (locationPropIds.size > 0) {
      storyRows = storyRows.filter(r => locationPropIds.has(r.property_id))
    }
  }

  // Step 3: fallback keyword search if semantic returned nothing
  if (storyRows.length === 0) {
    const tags = extractTags(query)
    const areaKeyword = AREA_KEYWORDS.find((kw) => query.includes(kw)) ?? null

    // 先嘗試加地點限制：用 JOIN（properties!inner）避免 IN 子句過長
    if (prefecture || country) {
      // 先試「地點 + tags」
      if (tags.length > 0) {
        const { data: tagData } = await supabase.from("story_tags").select("story_id").in("tag", tags).limit(500)
        const tagIds = (tagData ?? []).map(r => r.story_id)
        if (tagIds.length > 0) {
          let q = supabase
            .from("travel_stories")
            .select("id, property_id, likes_count, properties!inner(prefecture, country)")
            .in("id", tagIds)
            .order("likes_count", { ascending: false })
            .limit(120)
          if (prefecture) q = (q as any).eq("properties.prefecture", prefecture)
          else if (country) q = (q as any).eq("properties.country", country)
          const { data: taggedStories } = await q
          storyRows = (taggedStories ?? []).map((s: any) => ({ story_id: s.id, property_id: s.property_id, similarity: 0 }))
        }
      }

      // 若 tag 交集空，退而求其次：只用地點，取按讚最多的故事
      if (storyRows.length === 0) {
        let q = supabase
          .from("travel_stories")
          .select("id, property_id, likes_count, properties!inner(prefecture, country)")
          .order("likes_count", { ascending: false })
          .limit(120)
        if (prefecture) q = (q as any).eq("properties.prefecture", prefecture)
        else if (country) q = (q as any).eq("properties.country", country)
        if (areaKeyword) q = q.or(`zh_tw_description.ilike.%${areaKeyword}%,description.ilike.%${areaKeyword}%`)
        const { data: locationStories } = await q
        storyRows = (locationStories ?? []).map((s: any) => ({ story_id: s.id, property_id: s.property_id, similarity: 0 }))
      }
    }

    // 仍然空：不限地點，只用 tags 搜
    if (storyRows.length === 0 && tags.length > 0) {
      const { data: tagData } = await supabase.from("story_tags").select("story_id").in("tag", tags).limit(300)
      const tagIds = (tagData ?? []).map(r => r.story_id)
      if (tagIds.length > 0) {
        const { data: tagStories } = await supabase
          .from("travel_stories").select("id, property_id, likes_count")
          .in("id", tagIds).order("likes_count", { ascending: false }).limit(120)
        storyRows = (tagStories ?? []).map((s: any) => ({ story_id: s.id, property_id: s.property_id, similarity: 0 }))
      }
    }
  }

  // 語意搜尋有結果 = 精準；純關鍵字/地點 fallback = isFallback
  const isFallback = storyRows.every(r => r.similarity === 0)
  if (storyRows.length === 0) return { results: [], isFallback: true }

  // Step 4: group by property, keep best similarity score per property
  const propScores = new Map<number, { topStoryId: number; similarity: number }>()
  for (const row of storyRows) {
    const existing = propScores.get(row.property_id)
    if (!existing || row.similarity > existing.similarity) {
      propScores.set(row.property_id, { topStoryId: row.story_id, similarity: row.similarity })
    }
  }

  // Sort properties by best similarity score
  const sortedPropIds = [...propScores.entries()]
    .sort((a, b) => b[1].similarity - a[1].similarity)
    .slice(0, 60)
    .map(([propId]) => propId)

  // Step 5: fetch property info
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name_en, country, prefecture, cover_image_url")
    .in("id", sortedPropIds)

  const propMap = new Map((properties ?? []).map(p => [p.id, p]))

  // Step 6: fetch story details for top story per property
  const topStoryIds = sortedPropIds.map(id => propScores.get(id)!.topStoryId)
  const { data: stories } = await supabase
    .from("travel_stories")
    .select("id, title, zh_tw_title, zh_tw_description, description, property_id, likes_count, hafh_url, cover_image_url, author_email")
    .in("id", topStoryIds)

  const storyMap = new Map((stories ?? []).map(s => [s.id, s]))

  // Step 7: fetch tags for top stories
  const { data: tagRows } = await supabase
    .from("story_tags")
    .select("story_id, tag")
    .in("story_id", topStoryIds)
    .limit(200)

  const tagsByStory = new Map<number, string[]>()
  for (const row of tagRows ?? []) {
    if (!tagsByStory.has(row.story_id)) tagsByStory.set(row.story_id, [])
    tagsByStory.get(row.story_id)!.push(row.tag)
  }

  // Step 8: assemble final results in similarity order
  const finalResults: SearchResult[] = []
  for (const propId of sortedPropIds) {
    const property = propMap.get(propId)
    if (!property) continue
    const topStoryId = propScores.get(propId)!.topStoryId
    const topStory = storyMap.get(topStoryId)
    if (!topStory) continue
    finalResults.push({ property, stories: [topStory], tags: tagsByStory.get(topStoryId)?.slice(0, 3) ?? [] })
  }
  return { results: finalResults, isFallback }
}

// 從查詢中擷取有意義的關鍵字供顯示
function extractKeywords(query: string): string[] {
  const found = new Set<string>()
  // 旅伴 / 設施 tags
  for (const keyword of Object.keys(TAG_MAP)) {
    if (query.includes(keyword)) found.add(keyword)
  }
  // 地點
  for (const keyword of Object.keys(PREFECTURE_MAP)) {
    if (query.includes(keyword)) found.add(keyword)
  }
  for (const keyword of Object.keys(COUNTRY_MAP)) {
    if (query.includes(keyword)) found.add(keyword)
  }
  // area keywords
  for (const keyword of AREA_KEYWORDS) {
    if (query.includes(keyword)) found.add(keyword)
  }
  // 若什麼都沒找到，取前兩個 2 字以上的詞段（以中文標點或空白切分）
  if (found.size === 0) {
    const segments = query.split(/[\s，、,。！？\n]+/).filter(s => s.length >= 2).slice(0, 2)
    segments.forEach(s => found.add(s))
  }
  return Array.from(found).slice(0, 4)
}

type StoryRowSimple = { story_id: number; property_id: number; similarity: number }
type SearchResult = { property: { id: number; name_en: string; country: string; prefecture: string; cover_image_url?: string | null }; stories: { id: number; title: string | null; zh_tw_title: string | null; zh_tw_description: string | null; description: string | null; property_id: number; likes_count: number | null; hafh_url: string | null; cover_image_url: string | null; author_email: string | null }[]; tags: string[] }

async function assembleResults(storyRows: StoryRowSimple[], limit = 20): Promise<SearchResult[]> {
  const propScores = new Map<number, { topStoryId: number; similarity: number }>()
  for (const row of storyRows) {
    const ex = propScores.get(row.property_id)
    if (!ex || row.similarity > ex.similarity) propScores.set(row.property_id, { topStoryId: row.story_id, similarity: row.similarity })
  }
  const sortedPropIds = [...propScores.entries()]
    .sort((a, b) => b[1].similarity - a[1].similarity)
    .slice(0, limit).map(([id]) => id)
  if (sortedPropIds.length === 0) return []

  const topStoryIds = sortedPropIds.map(id => propScores.get(id)!.topStoryId)
  const [{ data: properties }, { data: stories }, { data: tagRows }] = await Promise.all([
    supabase.from("properties").select("id, name_en, country, prefecture, cover_image_url").in("id", sortedPropIds),
    supabase.from("travel_stories").select("id, title, zh_tw_title, zh_tw_description, description, property_id, likes_count, hafh_url, cover_image_url, author_email").in("id", topStoryIds),
    supabase.from("story_tags").select("story_id, tag").in("story_id", topStoryIds).limit(100),
  ])

  const propMap = new Map((properties ?? []).map(p => [p.id, p]))
  const storyMap = new Map((stories ?? []).map(s => [s.id, s]))
  const tagsByStory = new Map<number, string[]>()
  for (const row of tagRows ?? []) {
    if (!tagsByStory.has(row.story_id)) tagsByStory.set(row.story_id, [])
    tagsByStory.get(row.story_id)!.push(row.tag)
  }

  const out: SearchResult[] = []
  for (const propId of sortedPropIds) {
    const property = propMap.get(propId)
    const topStory = storyMap.get(propScores.get(propId)!.topStoryId)
    if (!property || !topStory) continue
    out.push({ property, stories: [topStory], tags: tagsByStory.get(topStory.id)?.slice(0, 3) ?? [] })
  }
  return out
}

// 不限地點的語意 fallback，保證一定有結果
async function searchFallback(query: string, prefecture?: string | null, country?: string | null): Promise<SearchResult[]> {
  // 先試不限地點的語意搜尋
  try {
    const embRes = await openai.embeddings.create({ model: "text-embedding-3-small", input: query })
    const { data: matchData } = await supabase.rpc("match_stories", {
      query_embedding: embRes.data[0].embedding,
      match_count: 40,
    })
    if (matchData && matchData.length > 0) {
      const results = await assembleResults(matchData as StoryRowSimple[], 20)
      if (results.length > 0) return results
    }
  } catch { /* 繼續到關鍵字保底 */ }

  // 純關鍵字保底：tags 全域搜
  const tags = extractTags(query)
  if (tags.length > 0) {
    const { data: tagData } = await supabase.from("story_tags").select("story_id").in("tag", tags).limit(300)
    const tagIds = (tagData ?? []).map(r => r.story_id)
    if (tagIds.length > 0) {
      const { data: tagStories } = await supabase
        .from("travel_stories").select("id, property_id, likes_count")
        .in("id", tagIds).order("likes_count", { ascending: false }).limit(60)
      if (tagStories && tagStories.length > 0) {
        const results = await assembleResults(tagStories.map(s => ({ story_id: s.id, property_id: s.property_id, similarity: 0 })), 20)
        if (results.length > 0) return results
      }
    }
  }

  // 終極保底：回傳指定地點（或全域）按讚最多的熱門旅宿
  let q = supabase.from("travel_stories")
    .select("id, property_id, likes_count" + (prefecture || country ? ", properties!inner(prefecture, country)" : ""))
    .order("likes_count", { ascending: false })
    .limit(80)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (prefecture) q = (q as any).eq("properties.prefecture", prefecture)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  else if (country) q = (q as any).eq("properties.country", country)
  const { data: popularStories } = await q
  if (popularStories && popularStories.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return assembleResults((popularStories as any[]).map(s => ({ story_id: s.id, property_id: s.property_id, similarity: 0 })), 20)
  }
  return []
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q ?? ""
  const { results, isFallback } = query ? await searchHotels(query) : { results: [], isFallback: false }
  const keywords = query ? extractKeywords(query) : []
  const prefecture = query ? extractPrefecture(query) : null
  const country = query ? extractCountry(query) : null

  // 若完全空結果，跑不限地點的 fallback（傳地點讓 fallback 優先找該地點熱門旅宿）
  const extraFallback = results.length === 0 && query ? await searchFallback(query, prefecture, country) : []
  const showFallbackMsg = (isFallback && results.length > 0) || (results.length === 0 && extraFallback.length > 0)
  const displayResults = results.length > 0 ? results : extraFallback

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

        {displayResults.length > 0 ? (
          <>
            {showFallbackMsg && keywords.length > 0 && (
              <div style={{ background: "#FFFBF0", border: "1px solid #FFE8A0", borderRadius: "16px", padding: "16px 20px", marginBottom: "20px" }}>
                <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.8 }}>
                  根據你的輸入我們暫時無法找到最符合的內容，但依照
                  {keywords.map((kw, i) => (
                    <span key={kw}>
                      {i > 0 && "、"}
                      <span style={{ fontWeight: 600, color: "#111" }}>「{kw}」</span>
                    </span>
                  ))}
                  ，我們有以下的推薦：
                </p>
              </div>
            )}
            <SearchResults results={displayResults} />
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: "15px", color: "#888", marginBottom: "8px" }}>找不到符合的旅宿</p>
            <p style={{ fontSize: "13px", color: "#BBB" }}>試試換個關鍵字，例如加上城市或旅伴描述</p>
          </div>
        )}
      </main>

    </div>
  )
}
