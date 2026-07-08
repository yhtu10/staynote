const AVATAR_COLORS = ["#EEF2FF", "#FFF8EE", "#F0FFF4", "#FFF0F5", "#F0F8FF", "#FFFBEE"]

export function avatarBg(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export type CardData = {
  id: number
  type: "review" | "story"
  author: string
  avatarBg: string
  initial: string
  stats?: string
  checkIn?: string
  bedType?: string
  purposes?: string[]
  rating?: number
  isAiRating?: boolean
  title?: string
  positive?: string
  negative?: string
  content?: string
  recommendFor?: string[]
  date?: string
  helpfulCount?: number
  replies?: { author: string; content: string; date: string }[]
  hafh_url?: string
  property_id?: number
  prefecture?: string
  country?: string
  avatarImg?: string
}
