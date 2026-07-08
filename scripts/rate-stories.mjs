/**
 * 用 AI 對 HafH 旅行故事評分（1-5 星）
 * 執行：node scripts/rate-stories.mjs
 */
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
import { config } from "dotenv"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, "../.env.local") })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function rateStory(text) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `你是一個旅宿評分助手。根據旅行故事的內容，判斷作者對這間飯店的整體滿意度，給出 1-5 的整數評分。
只回覆一個數字（1、2、3、4 或 5），不要說任何其他內容。
評分標準：
5 = 非常滿意，推薦，充滿正面描述
4 = 滿意，整體正面，有小缺點
3 = 普通，優缺點各半
2 = 不太滿意，有明顯缺點
1 = 非常不滿意，強烈負面`
      },
      {
        role: "user",
        content: text.slice(0, 800)
      }
    ],
    max_tokens: 2,
    temperature: 0,
  })
  const num = parseInt(res.choices[0].message.content.trim())
  return isNaN(num) || num < 1 || num > 5 ? null : num
}

async function main() {
  let offset = 0
  const batchSize = 20
  let totalDone = 0

  console.log("開始 AI 星等評分…\n")

  while (true) {
    const { data: stories } = await supabase
      .from("travel_stories")
      .select("id, zh_tw_description, description")
      .is("ai_rating", null)
      .not("embedding", "is", null)  // 只處理有 embedding 的故事
      .range(offset, offset + batchSize - 1)

    if (!stories || stories.length === 0) break

    for (const story of stories) {
      const text = story.zh_tw_description || story.description || ""
      if (text.trim().length < 30) {
        await supabase.from("travel_stories").update({ ai_rating: 3 }).eq("id", story.id)
        continue
      }

      try {
        const rating = await rateStory(text)
        if (rating) {
          await supabase.from("travel_stories").update({ ai_rating: rating }).eq("id", story.id)
        }
      } catch (err) {
        console.error(`故事 #${story.id} 評分失敗:`, err.message)
      }
    }

    totalDone += stories.length
    console.log(`已評分 ${totalDone} 則…`)
    await new Promise(r => setTimeout(r, 300))
    offset += batchSize
  }

  console.log(`\n完成！共評分 ${totalDone} 則。`)
}

main()
