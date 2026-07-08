/**
 * 用 GPT-4o-mini 批次填入旅宿中文名稱 (name_zh)
 * 執行：node scripts/fill-hotel-names-zh.js
 *
 * 策略：每批 30 筆送給 GPT，JSON 格式回傳，存入 properties.name_zh
 * 費用估計：14,000 筆 × ~50 tokens ≈ $0.5 USD
 */

const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)
const OPENAI_KEY = process.env.OPENAI_API_KEY
const BATCH = 30
const SLEEP_MS = 500

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function translateBatch(items) {
  const list = items.map(p => `${p.id}: ${p.name_en}${p.prefecture ? ` (${p.prefecture}, ${p.country})` : ''}`).join('\n')
  const prompt = `以下是飯店英文名稱，請給出正體中文的常用譯名或慣用名稱（OTA 網站上旅客熟悉的名稱）。
若是知名連鎖品牌（如 Hyatt、Marriott、Hilton 旗下），優先使用台灣旅遊業通行的中文名稱。
若無固定譯名，可音譯或意譯，但盡量簡短自然。

輸出格式：JSON 物件，key 為 id（數字），value 為中文名稱（純文字）。

${list}`

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  })
  if (!res.ok) { console.error("OpenAI error:", res.status, await res.text()); return {} }
  const json = await res.json()
  try { return JSON.parse(json.choices[0].message.content) }
  catch { return {} }
}

async function run() {
  // 只抓還沒有 name_zh 的
  const { data: rows } = await supabase
    .from("properties")
    .select("id, name_en, prefecture, country")
    .is("name_zh", null)
    .limit(20000)

  if (!rows || rows.length === 0) { console.log("全部都有 name_zh 了！"); return }
  console.log(`待翻譯：${rows.length} 筆`)

  let done = 0, failed = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const result = await translateBatch(batch)

    const updates = Object.entries(result)
      .filter(([, v]) => typeof v === "string" && v.trim())
      .map(([id, name_zh]) => supabase.from("properties").update({ name_zh: String(name_zh).trim() }).eq("id", parseInt(id)))

    await Promise.all(updates)
    done += batch.length
    if (done % 300 === 0 || done >= rows.length) {
      console.log(`進度 ${done}/${rows.length}`)
    }
    await sleep(SLEEP_MS)
  }
  console.log(`完成！成功 ${done - failed} 筆`)
}

run()
