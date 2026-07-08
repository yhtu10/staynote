import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// GET /api/comments?story_id=X  or  ?review_id=X
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const story_id = searchParams.get("story_id")
  const review_id = searchParams.get("review_id")

  if (!story_id && !review_id) {
    return NextResponse.json({ error: "需要 story_id 或 review_id" }, { status: 400 })
  }

  let query = supabase
    .from("comments")
    .select("id, user_id, author_name, author_image, content, created_at")
    .order("created_at", { ascending: true })

  if (story_id) query = query.eq("story_id", parseInt(story_id))
  else if (review_id) query = query.eq("review_id", parseInt(review_id))

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/comments
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id ?? ""
  if (!userId) return NextResponse.json({ error: "未登入" }, { status: 401 })

  const { content, story_id, review_id } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: "留言不能為空" }, { status: 400 })
  if (!story_id && !review_id) return NextResponse.json({ error: "需要 story_id 或 review_id" }, { status: 400 })

  const { data, error } = await supabase.from("comments").insert({
    user_id: userId,
    author_name: session?.user?.name ?? "旅人",
    author_image: session?.user?.image ?? null,
    content: content.trim(),
    story_id: story_id ?? null,
    review_id: review_id ?? null,
  }).select("id, author_name, author_image, content, created_at").single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
