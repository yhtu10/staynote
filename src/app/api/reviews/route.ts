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
  if (!session?.user?.email) {
    return NextResponse.json({ error: "未登入" }, { status: 401 })
  }

  const body = await req.json()
  const { property_id, rating, positive, negative, check_in_month, purposes, bed_type, has_kids, recommend_for } = body

  if (!property_id || !rating || !positive) {
    return NextResponse.json({ error: "缺少必填欄位" }, { status: 400 })
  }

  const userId = (session.user as { id?: string }).id ?? ""

  const { error } = await supabase.from("reviews").insert({
    property_id,
    user_id: userId,
    author_email: session.user.email,
    author_name: session.user.name ?? "",
    rating,
    positive,
    negative: negative ?? "",
    check_in_month,
    purposes,
    bed_type,
    has_kids,
    recommend_for,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
