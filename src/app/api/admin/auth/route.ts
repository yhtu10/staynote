import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean)

  if (!adminPassword) return NextResponse.json({ error: "伺服器未設定" }, { status: 500 })
  if (!adminEmails.includes(email?.trim())) return NextResponse.json({ error: "帳號或密碼錯誤" }, { status: 401 })
  if (password !== adminPassword) return NextResponse.json({ error: "帳號或密碼錯誤" }, { status: 401 })

  return NextResponse.json({ ok: true })
}
