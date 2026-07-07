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

  // Step 2b: 依地點過濾語意結果（限制 200 個 ID，避免 URL 過長）
  if (storyRows.length > 0 && (prefecture || country)) {
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

    // 先嘗試加地點限制（取 200 個 property ID，不會造成 URL 過長）
    if (prefecture || country) {
      let propQuery = supabase.from("properties").select("id").limit(200)
      if (prefecture) propQuery = propQuery.eq("prefecture", prefecture)
      else if (country) propQuery = propQuery.eq("country", country)
      const { data: props } = await propQuery
      const propIds = (props ?? []).map(p => p.id)

      if (propIds.length > 0) {
        // 先試「地點 + tags」
        if (tags.length > 0) {
          const { data: tagData } = await supabase.from("story_tags").select("story_id").in("tag", tags).limit(500)
          const tagIds = new Set((tagData ?? []).map(r => r.story_id))
          const { data: taggedStories } = await supabase
            .from("travel_stories").select("id, property_id, likes_count")
            .in("property_id", propIds).in("id", [...tagIds])
            .order("likes_count", { ascending: false }).limit(120)
          storyRows = (taggedStories ?? []).map(s => ({ story_id: s.id, property_id: s.property_id, similarity: 0 }))
        }

        // 若 tag 交集空，只用地點
        if (storyRows.length === 0) {
          let q = supabase.from("travel_stories").select("id, property_id, likes_count")
            .in("property_id", propIds).order("likes_count", { ascending: false }).limit(120)
          if (areaKeyword) q = q.or(`zh_tw_description.ilike.%${areaKeyword}%,description.ilike.%${areaKeyword}%`)
          const { data: locationStories } = await q
          storyRows = (locationStories ?? []).map(s => ({ story_id: s.id, property_id: s.property_id, similarity: 0 }))
        }
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
        storyRows = (tagStories ?? []).map(s => ({ story_id: s.id, property_id: s.property_id, similarity: 0 }))
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

// 旅遊描述常見詞（不在 TAG_MAP 裡但值得顯示給用戶）
const STYLE_KEYWORDS = [
  "傳統旅館", "傳統", "町家", "歷史感", "歷史", "古都", "設計感", "文青", "奢華", "精品",
  "度假村", "渡假村", "民宿", "旅館", "別墅", "溫泉旅館", "大浴場", "露天風呂",
  "海景", "山景", "夜景", "泳池", "景觀", "私人", "寧靜", "放空", "蜜月",
  "美食", "早餐", "交通方便", "近車站", "市中心",
]

// 從查詢中擷取有意義的關鍵字供顯示給用戶
function extractKeywords(query: string): string[] {
  const found = new Set<string>()

  // 1. 地點（最重要，優先放前面）
  for (const keyword of Object.keys(PREFECTURE_MAP)) {
    if (query.includes(keyword)) found.add(keyword)
  }
  for (const keyword of Object.keys(COUNTRY_MAP)) {
    if (query.includes(keyword)) found.add(keyword)
  }
  for (const keyword of AREA_KEYWORDS) {
    if (query.includes(keyword)) found.add(keyword)
  }

  // 2. 旅遊風格描述詞（比 TAG_MAP 更貼近用戶語言）
  for (const keyword of STYLE_KEYWORDS) {
    if (query.includes(keyword)) found.add(keyword)
  }

  // 3. TAG_MAP 旅伴 / 設施
  for (const keyword of Object.keys(TAG_MAP)) {
    if (query.includes(keyword)) found.add(keyword)
  }

  // 4. 若什麼都沒找到，從句子中切出有意義的片段（2-4 字）
  if (found.size === 0) {
    const skipChars = /^[想去在住有的或我也很都但以可能這那種些其不限交通方便一次出遊旅行]+$/
    const segments = query.split(/[\s，、,。！？\n～…]+/)
      .filter(s => s.length >= 2 && s.length <= 6 && !skipChars.test(s))
      .slice(0, 3)
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
  if (prefecture || country) {
    let propQuery = supabase.from("properties").select("id").limit(200)
    if (prefecture) propQuery = propQuery.eq("prefecture", prefecture)
    else if (country) propQuery = propQuery.eq("country", country)
    const { data: locProps } = await propQuery
    const locIds = (locProps ?? []).map(p => p.id)
    if (locIds.length > 0) {
      const { data: locStories } = await supabase
        .from("travel_stories").select("id, property_id, likes_count")
        .in("property_id", locIds).order("likes_count", { ascending: false }).limit(80)
      if (locStories && locStories.length > 0) {
        return assembleResults(locStories.map(s => ({ story_id: s.id, property_id: s.property_id, similarity: 0 })), 20)
      }
    }
  }
  // 全域保底
  const { data: globalStories } = await supabase
    .from("travel_stories").select("id, property_id, likes_count")
    .order("likes_count", { ascending: false }).limit(80)
  if (globalStories && globalStories.length > 0) {
    return assembleResults(globalStories.map(s => ({ story_id: s.id, property_id: s.property_id, similarity: 0 })), 20)
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
            {showFallbackMsg && (
              <div style={{ background: "#FFFBF0", border: "1px solid #FFE8A0", borderRadius: "16px", padding: "16px 20px", marginBottom: "20px" }}>
                <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.8 }}>
                  沒有找到完全符合的旅宿，但根據你提到的
                  {(keywords.length > 0 ? keywords : [query.slice(0, 10) + "…"]).map((kw, i) => (
                    <span key={kw}>
                      {i > 0 && "、"}
                      <span style={{ fontWeight: 700, color: "#111" }}>「{kw}」</span>
                    </span>
                  ))}
                  ，以下是我們覺得最接近的推薦：
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
