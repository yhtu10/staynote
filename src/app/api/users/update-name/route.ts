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
  if (!session?.user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 })
  }

  const { display_name } = await req.json()
  if (!display_name || display_name.trim().length < 1) {
    return NextResponse.json({ error: "暱稱不能為空" }, { status: 400 })
  }

  const userId = (session.user as { id?: string }).id ?? ""
  const { error } = await supabase
    .from("users")
    .update({ display_name: display_name.trim(), updated_at: new Date().toISOString() })
    .eq("id", userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
