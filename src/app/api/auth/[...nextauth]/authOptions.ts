import { NextAuthOptions } from "next-auth"
import LineProvider from "next-auth/providers/line"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export const authOptions: NextAuthOptions = {
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
      authorization: { params: { scope: "profile openid email" } },
    }),
  ],
  callbacks: {
    async jwt({ token, profile }) {
      // profile is available on first sign-in
      if (profile) {
        const lineUid = token.sub ?? ""
        const p = profile as { name?: string; picture?: string; email?: string }

        // upsert user to Supabase
        await supabase.from("users").upsert({
          id: lineUid,
          email: p.email ?? token.email ?? null,
          name: p.name ?? token.name ?? null,
          avatar_url: p.picture ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" })

        // store in token for session use
        token.lineUid = lineUid
        token.avatar = p.picture ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub ?? ""
        ;(session.user as { lineUid?: string }).lineUid = token.lineUid as string ?? ""
        ;(session.user as { avatar?: string }).avatar = token.avatar as string ?? session.user.image ?? ""
      }
      return session
    },
  },
  pages: {
    signIn: "/write",
  },
}
