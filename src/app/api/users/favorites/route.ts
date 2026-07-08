import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id ?? ""
  if (!userId) return NextResponse.json({ error: "未登入" }, { status: 401 })

  const { data: favs, error } = await supabase
    .from("user_favorites")
    .select("id, story_id, property_id, prefecture, country, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!favs || favs.length === 0) return NextResponse.json([])

  const storyIds = favs.map((f) => f.story_id).filter(Boolean)
  const { data: stories } = storyIds.length > 0
    ? await supabase
        .from("travel_stories")
        .select("id, zh_tw_title, title, zh_tw_description, description, stay_description, cover_image_url, properties(name_en, name_zh, prefecture, country)")
        .in("id", storyIds)
    : { data: [] }

  const storyMap = new Map((stories ?? []).map((s) => [s.id, s]))

  const result = favs.map((fav) => ({
    fav_id: fav.id,
    story_id: fav.story_id,
    property_id: fav.property_id,
    prefecture: fav.prefecture,
    country: fav.country,
    created_at: fav.created_at,
    story: fav.story_id ? storyMap.get(fav.story_id) ?? null : null,
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id ?? ""
  if (!userId) return NextResponse.json({ error: "未登入" }, { status: 401 })

  const { story_id, property_id, prefecture, country } = await req.json()
  if (!story_id) return NextResponse.json({ error: "missing story_id" }, { status: 400 })

  const { error } = await supabase.from("user_favorites").upsert(
    { user_id: userId, story_id, property_id: property_id ?? null, prefecture: prefecture ?? null, country: country ?? null },
    { onConflict: "user_id,story_id" }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id ?? ""
  if (!userId) return NextResponse.json({ error: "未登入" }, { status: 401 })

  const { story_id } = await req.json()
  if (!story_id) return NextResponse.json({ error: "missing story_id" }, { status: 400 })

  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("story_id", story_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
