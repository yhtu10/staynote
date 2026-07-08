/**
 * 批次將旅行故事轉換成向量 embedding，存回 Supabase。
 * 執行：node scripts/embed-stories.mjs
 */
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
import { config } from "dotenv"
import { resolve } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, "../.env.local") })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// 把故事內容組成一段有意義的文字供嵌入
function buildText(story) {
  const parts = []
  if (story.zh_tw_title || story.title) parts.push(story.zh_tw_title || story.title)
  if (story.stay_description) parts.push(story.stay_description.slice(0, 500))
  if (story.zh_tw_description || story.description) {
    const desc = story.zh_tw_description || story.description
    parts.push(desc.slice(0, 800))
  }
  return parts.join("\n")
}

async function embedBatch(texts) {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  })
  return res.data.map(d => d.embedding)
}

async function main() {
  // 只抓還沒有 embedding 的故事
  let offset = 0
  const batchSize = 50
  let totalDone = 0
  let totalSkipped = 0

  console.log("開始批次嵌入旅行故事…\n")

  while (true) {
    const { data: stories, error } = await supabase
      .from("travel_stories")
      .select("id, title, zh_tw_title, description, zh_tw_description, stay_description")
      .not("id", "is", null) // 重跑全部，包含已有 embedding 的
      .range(offset, offset + batchSize - 1)

    if (error) { console.error("Supabase 讀取失敗:", error); break }
    if (!stories || stories.length === 0) break

    // 過濾掉沒有任何文字的故事
    const valid = stories.filter(s => buildText(s).trim().length > 20)
    totalSkipped += stories.length - valid.length

    if (valid.length === 0) { offset += batchSize; continue }

    const texts = valid.map(buildText)

    try {
      const embeddings = await embedBatch(texts)

      for (let i = 0; i < valid.length; i++) {
        const { error: updateErr } = await supabase
          .from("travel_stories")
          .update({ embedding: embeddings[i] })
          .eq("id", valid[i].id)

        if (updateErr) {
          console.error(`故事 #${valid[i].id} 更新失敗:`, updateErr.message)
        }
      }

      totalDone += valid.length
      console.log(`已完成 ${totalDone} 則（本批 ${valid.length} 則）…`)

      // 避免 API rate limit
      await new Promise(r => setTimeout(r, 500))
    } catch (err) {
      console.error("OpenAI API 錯誤:", err.message)
      break
    }

    offset += batchSize
  }

  console.log(`\n完成！共嵌入 ${totalDone} 則，略過 ${totalSkipped} 則（無文字）。`)
}

main()
