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
  if (!session?.user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 })
  }

  const userId = (session.user as { id?: string }).id ?? ""
  const { data } = await supabase
    .from("users")
    .select("id, name, display_name, email, avatar_url")
    .eq("id", userId)
    .single()

  return NextResponse.json(data ?? {})
}
