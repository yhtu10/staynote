import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id ?? ""
  if (!userId) {
    return NextResponse.json({ error: "未登入" }, { status: 401 })
  }

  const body = await req.json()
  const { property_id, rating, positive, negative, check_in_month, purposes, bed_type, has_kids, recommend_for, photos } = body
  const action: "draft" | "submit" = body.action ?? "submit"

  // 草稿不驗證；送審才驗證
  if (action === "submit" && (!property_id || !rating || !positive || positive.length < 50)) {
    return NextResponse.json({ error: "缺少必填欄位" }, { status: 400 })
  }
  if (!property_id) {
    return NextResponse.json({ error: "請選擇飯店" }, { status: 400 })
  }

  const status = action === "draft" ? "draft" : "pending"

  const { data, error } = await supabase.from("reviews").insert({
    property_id,
    user_id: userId,
    author_email: session?.user?.email ?? null,
    author_name: session?.user?.name ?? "",
    rating: rating ?? null,
    positive: positive ?? "",
    negative: negative ?? "",
    check_in_month: check_in_month ?? null,
    purposes: purposes ?? [],
    bed_type: bed_type ?? null,
    has_kids: has_kids ?? false,
    recommend_for: recommend_for ?? [],
    photos: photos ?? [],
    status,
    updated_at: new Date().toISOString(),
  }).select("id").single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data?.id, status })
}
