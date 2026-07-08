import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return NextResponse.json({ error: "未設定" }, { status: 500 })
  if (password !== adminPassword) return NextResponse.json({ error: "密碼錯誤" }, { status: 401 })
  return NextResponse.json({ ok: true })
}
