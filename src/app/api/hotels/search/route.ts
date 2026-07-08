import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? ""
  if (q.length < 2) return NextResponse.json([])

  // 同時比對 name_zh（中文）和 name_en（英文），合併去重
  const [zhRes, enRes] = await Promise.all([
    supabase
      .from("properties")
      .select("id, name_en, name_zh, prefecture, country, cover_image_url")
      .ilike("name_zh", `%${q}%`)
      .limit(8),
    supabase
      .from("properties")
      .select("id, name_en, name_zh, prefecture, country, cover_image_url")
      .ilike("name_en", `%${q}%`)
      .limit(8),
  ])

  const seen = new Set<number>()
  const merged = []
  for (const row of [...(zhRes.data ?? []), ...(enRes.data ?? [])]) {
    if (!seen.has(row.id)) { seen.add(row.id); merged.push(row) }
  }

  return NextResponse.json(merged.slice(0, 8))
}
