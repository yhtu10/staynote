const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)

async function getHafHNameZh(id) {
  try {
    const res = await fetch("https://www.hafh.com/zh-tw/properties/" + id, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const nameMatch = html.match(/"name":"([^"]+)"/)
    const fullName = nameMatch?.[1]
    if (!fullName) return null
    const zhInParens = fullName.match(/[（(]([^）)]+)[）)]/)
    if (zhInParens && /[一-鿿]/.test(zhInParens[1])) return zhInParens[1]
    if (/[一-鿿]/.test(fullName)) return fullName
    return null
  } catch { return null }
}

async function run() {
  const { data } = await supabase.from("properties").select("id, name_en").is("name_zh", null).limit(30)
  let found = 0
  for (const p of data) {
    const zh = await getHafHNameZh(p.id)
    console.log(p.id, p.name_en, "->", zh ?? "(無)")
    if (zh) found++
    await new Promise(r => setTimeout(r, 300))
  }
  console.log("成功率:", found + "/" + data.length)
}
run()
