const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

async function searchZhName(nameEn) {
  try {
    const q = `${nameEn} agoda zh-tw`
    const r1 = await fetch("https://duckduckgo.com/?q=" + encodeURIComponent(q), {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(10000),
    })
    const html = await r1.text()
    const vqd = html.match(/vqd=['"](\d[\d-]+)['"]/)
    if (!vqd) return null

    const r2 = await fetch(
      `https://duckduckgo.com/d.js?q=${encodeURIComponent(q)}&vqd=${vqd[1]}&o=json&p=1`,
      { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://duckduckgo.com/" }, signal: AbortSignal.timeout(8000) }
    )
    const text = await r2.text()
    // parse JSON embedded in JS
    const match = text.match(/DDG\.pageLayout\.load\('d',(\[.*?\])\)/)
    if (!match) return null
    const results = JSON.parse(match[1])

    for (const r of results.slice(0, 5)) {
      const title = r.t ?? ""
      // 找有中文的 title
      if (/[一-鿿]/.test(title)) {
        // 常見格式：「中文名 - Agoda」或「中文名｜Booking.com」
        const zhPart = title.replace(/[-|｜–—]\s*(Agoda|Booking\.com|Hotels\.com|Expedia|Trip\.com)[^$]*/i, "").trim()
        if (/[一-鿿]/.test(zhPart)) return zhPart
      }
    }
    return null
  } catch { return null }
}

async function run() {
  const tests = [
    "Zentis Osaka",
    "nol kyoto sanjo",
    "Travelodge Kyoto Shijo Karasuma",
    "Agora Kyoto Karasuma",
    "slash kawasaki",
    "Pullman Tokyo Tamachi",
    "Oakwood Suites Yokohama",
    "Hostel Furoya",
    "Via Inn Higashiginza",
    "Park Hyatt Tokyo",
  ]
  for (const name of tests) {
    const zh = await searchZhName(name)
    console.log(name, "->", zh ?? "(找不到)")
    await new Promise(r => setTimeout(r, 600))
  }
}
run()
