import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabase
    .from("properties")
    .select("id, name_en, name_zh, prefecture, country, cover_image_url")
    .eq("id", parseInt(id))
    .single()

  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 })
  return NextResponse.json(data)
}
