import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

async function updateVote(table: "reviews" | "travel_stories", id: number, col: string, delta: 1 | -1) {
  const { data: current } = await supabase
    .from(table)
    .select("helpful_count, not_helpful_count")
    .eq("id", id)
    .single()
  if (current) {
    const newVal = Math.max(0, ((current as Record<string, number>)[col] ?? 0) + delta)
    await supabase.from(table).update({ [col]: newVal }).eq("id", id)
  }
}

export async function POST(req: NextRequest) {
  const { review_id, story_id, vote, property_id, prefecture, country } = await req.json()
  if ((!review_id && !story_id) || !["up", "down"].includes(vote)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 })
  }
  const col = vote === "up" ? "helpful_count" : "not_helpful_count"
  if (review_id) await updateVote("reviews", review_id, col, 1)
  else await updateVote("travel_stories", story_id, col, 1)

  // 「有幫助」= 收藏，同步寫入 user_favorites（僅限 story 且 vote=up）
  if (story_id && vote === "up") {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string })?.id ?? ""
    if (userId) {
      await supabase.from("user_favorites").upsert(
        { user_id: userId, story_id, property_id: property_id ?? null, prefecture: prefecture ?? null, country: country ?? null },
        { onConflict: "user_id,story_id" }
      )
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { review_id, story_id, vote } = await req.json()
  if ((!review_id && !story_id) || !["up", "down"].includes(vote)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 })
  }
  const col = vote === "up" ? "helpful_count" : "not_helpful_count"
  if (review_id) await updateVote("reviews", review_id, col, -1)
  else await updateVote("travel_stories", story_id, col, -1)

  // 取消有幫助 = 移除收藏
  if (story_id && vote === "up") {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string })?.id ?? ""
    if (userId) {
      await supabase.from("user_favorites").delete()
        .eq("user_id", userId)
        .eq("story_id", story_id)
    }
  }

  return NextResponse.json({ ok: true })
}
