import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

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
  const { review_id, story_id, vote } = await req.json()
  if ((!review_id && !story_id) || !["up", "down"].includes(vote)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 })
  }
  const col = vote === "up" ? "helpful_count" : "not_helpful_count"
  if (review_id) await updateVote("reviews", review_id, col, 1)
  else await updateVote("travel_stories", story_id, col, 1)
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
  return NextResponse.json({ ok: true })
}
