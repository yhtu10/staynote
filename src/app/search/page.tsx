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

async function fetchAvgRatings(propIds: number[]): Promise<Map<number, number>> {
  if (propIds.length === 0) return new Map()

  // 用戶評論平均（approved reviews）
  const { data: reviewData } = await supabase
    .from("reviews")
    .select("property_id, rating")
    .in("property_id", propIds)
    .neq("status", "pending")
  const userTotals = new Map<number, { sum: number; count: number }>()
  for (const r of reviewData ?? []) {
    if (!r.rating) continue
    const cur = userTotals.get(r.property_id) ?? { sum: 0, count: 0 }
    userTotals.set(r.property_id, { sum: cur.sum + r.rating, count: cur.count + 1 })
  }

  // HafH travel story ai_rating 平均
  const { data: storyData } = await supabase
    .from("travel_stories")
    .select("property_id, ai_rating")
    .in("property_id", propIds)
    .not("ai_rating", "is", null)
  const aiTotals = new Map<number, { sum: number; count: number }>()
  for (const s of storyData ?? []) {
    if (s.ai_rating == null) continue
    const cur = aiTotals.get(s.property_id) ?? { sum: 0, count: 0 }
    aiTotals.set(s.property_id, { sum: cur.sum + s.ai_rating, count: cur.count + 1 })
  }

  // 合併：優先用戶評論，沒有則用 AI 評分
  const result = new Map<number, number>()
  for (const id of propIds) {
    const u = userTotals.get(id)
    if (u) { result.set(id, Math.round((u.sum / u.count) * 10) / 10); continue }
    const a = aiTotals.get(id)
    if (a) result.set(id, Math.round((a.sum / a.count) * 10) / 10)
  }
  return result
}

async function searchHotels(query: string): Promise<{ results: SearchResult[]; isFallback: boolean; nameMatch?: { hotels: SearchResult[]; prefecture: string | null; country: string | null } }> {
  const country = extractCountry(query)
  const prefecture = extractPrefecture(query)

  // Step 0: 旅宿名稱直接比對（最高優先）
  // 條件：沒有偵測到地名（country/prefecture），且 query 是英數字旅宿名稱格式
  // 避免「東京」「大阪」等地名把名稱含地名的旅宿錯誤置頂
  const looksLikeName = !country && !prefecture && query.length >= 2
  let nameMatchPropIds: number[] = []
  if (looksLikeName) {
    const isChinese = /[一-鿿]/.test(query)

    if (isChinese) {
      // 中文名稱：直接模糊比對 name_zh
      const { data: zhMatches } = await supabase
        .from("properties")
        .select("id")
        .ilike("name_zh", `%${query}%`)
        .neq("status", "pending")
        .limit(20)
      nameMatchPropIds = (zhMatches ?? []).map(p => p.id)
    } else if (/^[\w\s\-\.\/]+$/.test(query)) {
      const words = query.trim().toLowerCase().split(/\s+/).filter(w => w.length >= 2)

      // 優先：字首邊界比對（名稱以第一個字開頭，或某個單字以它開頭）
      // 適用 "omo" → OMO3/OMO5/OMO7，避免比到 Tomonoura/Kamomosi
      if (words.length > 0) {
        const first = words[0]
        let boundaryQ = supabase
          .from("properties")
          .select("id")
          .or(`name_en.ilike.${first}%,name_en.ilike.% ${first}%`)
          .neq("status", "pending")
          .limit(20)
        for (const w of words.slice(1)) {
          boundaryQ = boundaryQ.ilike("name_en", `%${w}%`)
        }
        const { data: boundaryMatches } = await boundaryQ
        nameMatchPropIds = (boundaryMatches ?? []).map(p => p.id)
      }

      // 退而求其次：多字 AND 模糊比對
      if (nameMatchPropIds.length === 0 && words.length > 0) {
        let fuzzyQ = supabase.from("properties").select("id").neq("status", "pending").limit(20)
        for (const w of words) {
          fuzzyQ = fuzzyQ.ilike("name_en", `%${w}%`)
        }
        const { data: fuzzyMatches } = await fuzzyQ
        nameMatchPropIds = (fuzzyMatches ?? []).map(p => p.id)
      }
    }
  }

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

  // 若名稱比對有找到旅宿 → 不管語意結果，直接走 nameMatch 專屬流程
  if (nameMatchPropIds.length > 0) {
    const { data: nameProps } = await supabase
      .from("properties")
      .select("id, name_en, name_zh, country, prefecture, cover_image_url")
      .in("id", nameMatchPropIds)
      .neq("status", "pending")
    const avgRatings = await fetchAvgRatings(nameMatchPropIds)

    // fetchAvgRatings 已整合用戶評論 + HafH ai_rating 平均
    // 另外撈 top story 供推薦原因文字顯示
    const { data: nameStories } = await supabase
      .from("travel_stories")
      .select("id, title, zh_tw_title, zh_tw_description, description, property_id, likes_count, hafh_url, cover_image_url, author_email, ai_rating")
      .in("property_id", nameMatchPropIds)
      .order("likes_count", { ascending: false })

    const topStoryByProp = new Map<number, NonNullable<typeof nameStories>[0]>()
    for (const s of nameStories ?? []) {
      if (!topStoryByProp.has(s.property_id)) topStoryByProp.set(s.property_id, s)
    }

    const hotels = (nameProps ?? []).map(p => {
      const topStory = topStoryByProp.get(p.id) ?? null
      return {
        property: { ...p, avg_rating: avgRatings.get(p.id) ?? null },
        stories: topStory ? [{ ...topStory, ai_rating: topStory.ai_rating ?? null }] : [],
        tags: [],
      }
    })
    const firstProp = nameProps?.[0]
    return {
      results: [],
      isFallback: false,
      nameMatch: {
        hotels,
        prefecture: firstProp?.prefecture ?? null,
        country: firstProp?.country ?? null,
      },
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

  // Sort properties: 名稱比對到的置頂，其餘依語意相似度排序
  const nameMatchSet = new Set(nameMatchPropIds)
  const sortedPropIds = [...propScores.entries()]
    .sort((a, b) => {
      const aName = nameMatchSet.has(a[0]) ? 1 : 0
      const bName = nameMatchSet.has(b[0]) ? 1 : 0
      if (bName !== aName) return bName - aName
      return b[1].similarity - a[1].similarity
    })
    .slice(0, 60)
    .map(([propId]) => propId)

  // 若名稱比對到的旅宿不在 storyRows 裡（該旅宿沒有 story），也補進來
  for (const propId of nameMatchPropIds) {
    if (!propScores.has(propId)) {
      propScores.set(propId, { topStoryId: -1, similarity: 0 })
      sortedPropIds.unshift(propId)
    }
  }

  // Step 5: fetch property info
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name_en, name_zh, country, prefecture, cover_image_url")
    .in("id", sortedPropIds)
    .neq("status", "pending")

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

  // Step 8: fetch avg ratings for all properties
  const avgRatings = await fetchAvgRatings(sortedPropIds)

  // Step 9: assemble final results in similarity order
  const finalResults: SearchResult[] = []
  for (const propId of sortedPropIds) {
    const property = propMap.get(propId)
    if (!property) continue
    const topStoryId = propScores.get(propId)!.topStoryId
    const propertyWithRating = { ...property, avg_rating: avgRatings.get(propId) ?? null }
    if (topStoryId === -1) {
      finalResults.push({ property: propertyWithRating, stories: [], tags: [] })
      continue
    }
    const topStory = storyMap.get(topStoryId)
    if (!topStory) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    finalResults.push({ property: propertyWithRating, stories: [{ ...topStory, ai_rating: (topStory as any).ai_rating ?? null }], tags: tagsByStory.get(topStoryId)?.slice(0, 3) ?? [] })
  }
  return { results: finalResults, isFallback, nameMatch: undefined }
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
type SearchResult = { property: { id: number; name_en: string; country: string; prefecture: string; cover_image_url?: string | null; avg_rating?: number | null }; stories: { id: number; title: string | null; zh_tw_title: string | null; zh_tw_description: string | null; description: string | null; property_id: number; likes_count: number | null; hafh_url: string | null; cover_image_url: string | null; author_email: string | null; ai_rating: number | null }[]; tags: string[] }

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
    supabase.from("properties").select("id, name_en, name_zh, country, prefecture, cover_image_url").in("id", sortedPropIds).neq("status", "pending"),
    supabase.from("travel_stories").select("id, title, zh_tw_title, zh_tw_description, description, property_id, likes_count, hafh_url, cover_image_url, author_email, ai_rating").in("id", topStoryIds),
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
  const { results, isFallback, nameMatch } = query ? await searchHotels(query) : { results: [], isFallback: false, nameMatch: undefined }
  const keywords = query ? extractKeywords(query) : []
  const prefecture = query ? extractPrefecture(query) : null
  const country = query ? extractCountry(query) : null

  // 若完全空結果，跑不限地點的 fallback
  const extraFallback = results.length === 0 && !nameMatch && query ? await searchFallback(query, prefecture, country) : []
  const showFallbackMsg = (isFallback && results.length > 0) || (results.length === 0 && extraFallback.length > 0)
  const displayResults = results.length > 0 ? results : extraFallback

  // nameMatch 時，抓同地點其他旅宿（直接查 travel_stories，不走語意）
  let locationResults: SearchResult[] = []
  const locationLabel = nameMatch?.prefecture ?? nameMatch?.country ?? null
  if (nameMatch && locationLabel) {
    try {
      let propQuery = supabase.from("properties").select("id").limit(200)
      if (nameMatch.prefecture) propQuery = propQuery.eq("prefecture", nameMatch.prefecture)
      else if (nameMatch.country) propQuery = propQuery.eq("country", nameMatch.country)
      const { data: locProps } = await propQuery
      const locIds = (locProps ?? []).map(p => p.id)
      const matchedIds = new Set(nameMatch.hotels.map(h => h.property.id))
      const filteredIds = locIds.filter(id => !matchedIds.has(id))
      if (filteredIds.length > 0) {
        const { data: locStories } = await supabase
          .from("travel_stories").select("id, property_id, likes_count")
          .in("property_id", filteredIds).order("likes_count", { ascending: false }).limit(40)
        if (locStories && locStories.length > 0) {
          locationResults = await assembleResults(
            locStories.map(s => ({ story_id: s.id, property_id: s.property_id, similarity: 0 })), 6
          )
        }
      }
    } catch { /* 地點推薦失敗不影響主結果 */ }
  }

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

        {/* nameMatch 專屬流程 */}
        {nameMatch ? (
          <>
            <div style={{ background: "#F0F4FF", border: "1px solid #C7D7FF", borderRadius: "16px", padding: "16px 20px", marginBottom: "20px" }}>
              <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.8 }}>
                很抱歉，我們不確定您具體希望規劃什麼樣的旅行，但猜想您可能是在搜尋以下這間旅宿：
              </p>
            </div>
            <SearchResults results={nameMatch.hotels} />

            {locationResults.length > 0 && locationLabel && (
              <>
                <div style={{ margin: "32px 0 16px", borderTop: "1px solid #EBEBEB", paddingTop: "28px" }}>
                  <p style={{ fontSize: "13px", color: "#888", marginBottom: "4px" }}>您可能還想查找</p>
                  <p style={{ fontSize: "17px", fontWeight: 700, color: "#111" }}>「{locationLabel}」相關的旅宿資訊</p>
                </div>
                <SearchResults results={locationResults} />
              </>
            )}
          </>
        ) : displayResults.length > 0 ? (
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
