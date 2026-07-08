import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
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

  const { data: comments, error } = await supabase
    .from("comments")
    .select("id, content, story_id, review_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!comments || comments.length === 0) return NextResponse.json([])

  // 補上 story/review 的標題與旅宿名稱
  const storyIds = comments.filter(c => c.story_id).map(c => c.story_id)
  const reviewIds = comments.filter(c => c.review_id).map(c => c.review_id)

  const [{ data: stories }, { data: reviews }] = await Promise.all([
    storyIds.length > 0
      ? supabase.from("travel_stories").select("id, zh_tw_title, title, property_id, properties(name_en, name_zh)").in("id", storyIds)
      : Promise.resolve({ data: [] }),
    reviewIds.length > 0
      ? supabase.from("reviews").select("id, property_id, positive, properties(name_en, name_zh)").in("id", reviewIds)
      : Promise.resolve({ data: [] }),
  ])

  const storyMap = new Map((stories ?? []).map((s) => [s.id, s]))
  const reviewMap = new Map((reviews ?? []).map((r) => [r.id, r]))

  const result = comments.map((c) => {
    if (c.story_id) {
      const story = storyMap.get(c.story_id)
      const prop = story?.properties as unknown as { name_en: string; name_zh?: string | null } | null
      return {
        ...c,
        context_type: "story" as const,
        context_title: story?.zh_tw_title || story?.title || null,
        context_property: prop?.name_zh || prop?.name_en || null,
        context_property_id: story?.property_id ?? null,
        link: story ? `/hotel/${story.property_id}` : null,
      }
    } else {
      const review = reviewMap.get(c.review_id)
      const prop = review?.properties as unknown as { name_en: string; name_zh?: string | null } | null
      return {
        ...c,
        context_type: "review" as const,
        context_title: (review?.positive ?? "").slice(0, 40) + "…" || null,
        context_property: prop?.name_zh || prop?.name_en || null,
        context_property_id: review?.property_id ?? null,
        link: review ? `/hotel/${review.property_id}` : null,
      }
    }
  })

  return NextResponse.json(result)
}
