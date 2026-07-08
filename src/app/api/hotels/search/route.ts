import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? ""
  if (q.length < 2) return NextResponse.json([])

  const { data } = await supabase
    .from("properties")
    .select("id, name_en, prefecture, country, cover_image_url")
    .ilike("name_en", `%${q}%`)
    .limit(8)

  return NextResponse.json(data ?? [])
}
