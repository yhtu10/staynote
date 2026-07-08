import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

function checkAdmin(req: NextRequest) {
  // 支援兩種驗證方式：x-admin-auth header 或 Authorization Bearer
  const token = req.headers.get("x-admin-auth") ?? req.headers.get("authorization")?.replace("Bearer ", "")
  return token === "1" && !!process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "無權限" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") ?? "pending"

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, property_id, author_name, author_email, rating, positive, negative, check_in_month, purposes, bed_type, recommend_for, photos, status, rejection_reason, created_at, updated_at")
    .eq("status", status)
    .order("updated_at", { ascending: true })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const propIds = [...new Set((reviews ?? []).map(r => r.property_id))]
  const { data: properties } = propIds.length > 0
    ? await supabase.from("properties").select("id, name_en").in("id", propIds)
    : { data: [] }
  const nameMap = new Map((properties ?? []).map(p => [p.id, p.name_en]))

  // 計算每個 user+property 已有幾則評論（含所有狀態）
  const userPropertyPairs = (reviews ?? []).map(r => `${r.user_id ?? r.author_email}::${r.property_id}`)
  const uniquePairs = [...new Set(userPropertyPairs)]

  // 對每筆評論查詢該 user 對該 property 的歷史總數
  const reviewList = reviews ?? []
  const countMap = new Map<string, number>()
  if (reviewList.length > 0) {
    const { data: allCounts } = await supabase
      .from("reviews")
      .select("author_email, property_id")
      .in("property_id", propIds)
    ;(allCounts ?? []).forEach(c => {
      const key = `${c.author_email}::${c.property_id}`
      countMap.set(key, (countMap.get(key) ?? 0) + 1)
    })
  }

  return NextResponse.json((reviews ?? []).map(r => {
    const key = `${r.author_email}::${r.property_id}`
    const totalCount = countMap.get(key) ?? 1
    return { ...r, property_name: nameMap.get(r.property_id), review_count: totalCount }
  }))
}
