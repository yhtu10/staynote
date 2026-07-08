import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// GET /api/reviews/[id] - 取得自己的評論（用於編輯頁面載入）
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id ?? ""
  if (!userId) return NextResponse.json({ error: "未登入" }, { status: 401 })

  const { id } = await params

  const { data, error } = await supabase
    .from("reviews")
    .select("id, property_id, rating, positive, negative, check_in_month, purposes, bed_type, has_kids, recommend_for, photos, status, rejection_reason")
    .eq("id", parseInt(id))
    .eq("user_id", userId)
    .single()

  if (error || !data) return NextResponse.json({ error: "找不到評論" }, { status: 404 })
  return NextResponse.json(data)
}

// PATCH /api/reviews/[id] - 更新評論（草稿或重新送審）
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id ?? ""
  if (!userId) return NextResponse.json({ error: "未登入" }, { status: 401 })

  const { id } = await params

  // 確認是本人的評論，且尚未通過審核
  const { data: existing } = await supabase
    .from("reviews")
    .select("id, status")
    .eq("id", parseInt(id))
    .eq("user_id", userId)
    .single()

  if (!existing) return NextResponse.json({ error: "找不到評論" }, { status: 404 })

  const body = await req.json()
  const { property_id, rating, positive, negative, check_in_month, purposes, bed_type, has_kids, recommend_for, photos } = body
  const action: "draft" | "submit" = body.action ?? "submit"

  if (action === "submit" && (!rating || !positive || positive.length < 50)) {
    return NextResponse.json({ error: "缺少必填欄位" }, { status: 400 })
  }

  // 已發布的評論修改後重新送審（避免濫用）
  const status = action === "draft" ? "draft" : "pending"

  const { error } = await supabase.from("reviews").update({
    property_id,
    rating: rating ?? null,
    positive: positive ?? "",
    negative: negative ?? "",
    check_in_month: check_in_month ?? null,
    purposes: purposes ?? [],
    bed_type: bed_type ?? null,
    has_kids: has_kids ?? false,
    recommend_for: recommend_for ?? [],
    ...(photos && photos.length > 0 ? { photos } : {}),
    status,
    rejection_reason: null,
    updated_at: new Date().toISOString(),
  }).eq("id", parseInt(id)).eq("user_id", userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, status })
}

// DELETE /api/reviews/[id] - 刪除草稿或被退回的評論
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id ?? ""
  if (!userId) return NextResponse.json({ error: "未登入" }, { status: 401 })

  const { id } = await params

  const { data: existing } = await supabase
    .from("reviews")
    .select("id, status")
    .eq("id", parseInt(id))
    .eq("user_id", userId)
    .single()

  if (!existing) return NextResponse.json({ error: "找不到評論" }, { status: 404 })
  if (existing.status === "approved") {
    return NextResponse.json({ error: "已審核通過的評論無法刪除" }, { status: 403 })
  }

  const { error } = await supabase.from("reviews").delete().eq("id", parseInt(id)).eq("user_id", userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
