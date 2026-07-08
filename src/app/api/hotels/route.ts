import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const name_zh: string = (body.name_zh ?? "").trim()
  const name_en: string = (body.name_en ?? "").trim()
  const prefecture: string = (body.prefecture ?? "").trim()
  const country: string = (body.country ?? "").trim()

  if (!name_zh && !name_en) {
    return NextResponse.json({ error: "請輸入旅宿名稱" }, { status: 400 })
  }

  // 防止重複：先查同名
  const displayName = name_zh || name_en
  const { data: existing } = await supabase
    .from("properties")
    .select("id, name_en, name_zh, prefecture, country, cover_image_url")
    .or(`name_zh.ilike.${displayName},name_en.ilike.${name_en || displayName}`)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ ...existing[0], existed: true })
  }

  const { data, error } = await supabase
    .from("properties")
    .insert({ name_en: name_en || name_zh, name_zh: name_zh || null, prefecture: prefecture || null, country: country || null, status: "pending" })
    .select("id, name_en, name_zh, prefecture, country, cover_image_url, status")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
