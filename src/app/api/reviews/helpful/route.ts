import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  const { review_id, vote } = await req.json()
  if (!review_id || !["up", "down"].includes(vote)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 })
  }

  const col = vote === "up" ? "helpful_count" : "not_helpful_count"

  // Use rpc increment to avoid race conditions
  const { error } = await supabase.rpc("increment_review_vote", {
    p_review_id: review_id,
    p_column: col,
  })

  if (error) {
    // Fallback: direct update if rpc not set up yet
    const { data: current } = await supabase
      .from("reviews")
      .select("helpful_count, not_helpful_count")
      .eq("id", review_id)
      .single()
    if (current) {
      await supabase
        .from("reviews")
        .update({ [col]: ((current as Record<string, number>)[col] ?? 0) + 1 })
        .eq("id", review_id)
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { review_id, vote } = await req.json()
  if (!review_id || !["up", "down"].includes(vote)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 })
  }

  const col = vote === "up" ? "helpful_count" : "not_helpful_count"
  const { data: current } = await supabase
    .from("reviews")
    .select("helpful_count, not_helpful_count")
    .eq("id", review_id)
    .single()

  if (current) {
    const newVal = Math.max(0, ((current as Record<string, number>)[col] ?? 0) - 1)
    await supabase.from("reviews").update({ [col]: newVal }).eq("id", review_id)
  }

  return NextResponse.json({ ok: true })
}
