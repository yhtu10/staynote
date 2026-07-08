require("dotenv").config({ path: ".env.local" })
const OPENAI_KEY = process.env.OPENAI_API_KEY

async function testBatch(items) {
  const list = items.map(p => `${p.id}: ${p.name_en}${p.prefecture ? ` (${p.prefecture}, ${p.country})` : ""}`).join("\n")
  const prompt = `以下是飯店英文名稱。請只回傳你在 Agoda、Booking.com、Hotels.com、Expedia 等 OTA 網站上確認見過的繁體中文官方名稱。

規則：
- 只回傳有把握是 OTA 實際使用的繁體中文名稱
- 不確定、沒見過、或該飯店沒有通行繁中名稱 → 回傳 null
- 不要自己翻譯、音譯或猜測
- 知名連鎖品牌（如萬豪、凱悅、希爾頓、洲際、雅高旗下）通常有固定中文名

輸出格式：JSON 物件，key 為 id（數字），value 為中文名稱或 null。

${list}`

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" }, temperature: 0.1 })
  })
  const json = await res.json()
  return JSON.parse(json.choices[0].message.content)
}

async function run() {
  const tests = [
    { id: 926, name_en: "Zentis Osaka", prefecture: "Osaka", country: "Japan" },
    { id: 1542, name_en: "nol kyoto sanjo", prefecture: "Kyoto", country: "Japan" },
    { id: 9668, name_en: "Travelodge Kyoto Shijo Karasuma", prefecture: "Kyoto", country: "Japan" },
    { id: 1935, name_en: "Agora Kyoto Karasuma", prefecture: "Kyoto", country: "Japan" },
    { id: 1137, name_en: "PULLMAN TOKYO TAMACHI", prefecture: "Tokyo", country: "Japan" },
    { id: 1149, name_en: "Courtyard by Marriott Ginza Tobu Hotel", prefecture: "Tokyo", country: "Japan" },
    { id: 364, name_en: "slash kawasaki", prefecture: "Kanagawa", country: "Japan" },
    { id: 797, name_en: "Hostel Furoya", prefecture: "Osaka", country: "Japan" },
    { id: 100, name_en: "Park Hyatt Tokyo", prefecture: "Tokyo", country: "Japan" },
    { id: 101, name_en: "The Ritz-Carlton Kyoto", prefecture: "Kyoto", country: "Japan" },
  ]
  const result = await testBatch(tests)
  for (const [id, zh] of Object.entries(result)) {
    const hotel = tests.find(t => String(t.id) === id)
    console.log(id, hotel?.name_en, "->", zh ?? "(null，保留英文)")
  }
}
run()
