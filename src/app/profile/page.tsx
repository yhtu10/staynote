'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'

type Tab = 'reviews' | 'saved' | 'comments'

const mockReviews = [
  {
    id: 1,
    hotel: 'The Lalu 涵碧樓',
    location: '南投・日月潭',
    rating: 5,
    date: '2025/11',
    excerpt: '清晨五點的湖面安靜得像一面鏡，早餐的蛋根本不需要配料…',
    tags: ['情侶', '湖景'],
  },
  {
    id: 2,
    hotel: 'Trunk Hotel',
    location: '澀谷・設計旅店',
    rating: 4,
    date: '2025/08',
    excerpt: '選這裡不是因為它便宜，是因為每個角落都讓你想拍照…',
    tags: ['獨旅休閒', '設計'],
  },
]

const mockSaved = [
  {
    id: 1,
    hotel: 'Hoshinoya Kyoto 星のや京都',
    location: '京都・嵐山',
    tag: '情侶',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    id: 2,
    hotel: 'Alaya Ubud',
    location: '峇里島・叢林Villa',
    tag: 'Villa',
    color: 'bg-amber-50 text-amber-600',
  },
]

const mockComments = [
  {
    id: 1,
    hotel: 'Lotte Hotel Seoul',
    reviewAuthor: '@solo_chen',
    myComment: '同意隔音問題，我住的時候也是這樣，帶耳塞沒錯！',
    date: '2025/10',
  },
]

function StarRating({ count }: { count: number }) {
  return (
    <span className="text-amber-400 text-sm">
      {'★'.repeat(count)}{'☆'.repeat(5 - count)}
    </span>
  )
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [tab, setTab] = useState<Tab>('reviews')

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-400 text-sm">載入中…</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-5">
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl">
            👤
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">查看個人頁面</h1>
          <p className="text-sm text-neutral-500 mb-6">請先登入以查看你的評論與收藏。</p>
          <button
            onClick={() => signIn('line')}
            className="w-full bg-[#06C755] text-white text-sm font-medium py-3 rounded-full hover:bg-[#05b34c] transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-base">💬</span>
            使用 LINE 登入
          </button>
        </div>
      </div>
    )
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'reviews', label: '我的評論', count: mockReviews.length },
    { key: 'saved', label: '我的收藏', count: mockSaved.length },
    { key: 'comments', label: '我的回應', count: mockComments.length },
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold text-neutral-900 tracking-tight">StayNote</Link>
          <Link href="/write" className="text-sm text-neutral-500 border border-neutral-200 rounded-full px-4 py-1.5 hover:border-neutral-400 transition-colors">
            分享住宿
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-5 py-8 flex flex-col gap-6">

        {/* 用戶資訊 */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex items-center gap-4">
          {session.user?.image ? (
            <img
              src={session.user.image}
              alt="頭像"
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center text-2xl">
              👤
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-neutral-900 text-lg truncate">
              {session.user?.name ?? '旅人'}
            </p>
            <p className="text-sm text-neutral-400 mt-0.5">
              {mockReviews.length} 則評論・{mockSaved.length} 個收藏
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-xs text-neutral-400 border border-neutral-200 rounded-full px-3 py-1.5 hover:border-neutral-400 transition-colors"
          >
            登出
          </button>
        </div>

        {/* 積分卡 */}
        <div className="bg-neutral-900 text-white rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-400 mb-1">我的訂房點數</p>
            <p className="text-3xl font-semibold">150 <span className="text-base font-normal text-neutral-400">點</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-400 mb-1">每則評論</p>
            <p className="text-sm text-neutral-300">+50 點</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 ${
                tab === t.key ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-400'
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* 我的評論 */}
        {tab === 'reviews' && (
          <div className="flex flex-col gap-3">
            {mockReviews.map((r) => (
              <div key={r.id} className="bg-white border border-neutral-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-neutral-900 text-sm">{r.hotel}</p>
                    <p className="text-xs text-neutral-400">{r.location}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <StarRating count={r.rating} />
                    <p className="text-xs text-neutral-300 mt-0.5">{r.date}</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed mb-3">{r.excerpt}</p>
                <div className="flex gap-2 flex-wrap">
                  {r.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <Link
              href="/write"
              className="border border-dashed border-neutral-300 rounded-xl p-4 text-center text-sm text-neutral-400 hover:border-neutral-500 hover:text-neutral-600 transition-colors"
            >
              + 新增評論
            </Link>
          </div>
        )}

        {/* 我的收藏 */}
        {tab === 'saved' && (
          <div className="flex flex-col gap-3">
            {mockSaved.map((s) => (
              <div key={s.id} className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-4">
                <div className={`${s.color} w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0`}>
                  🏨
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 text-sm truncate">{s.hotel}</p>
                  <p className="text-xs text-neutral-400">{s.location}</p>
                </div>
                <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full flex-shrink-0">
                  {s.tag}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 我的回應 */}
        {tab === 'comments' && (
          <div className="flex flex-col gap-3">
            {mockComments.map((c) => (
              <div key={c.id} className="bg-white border border-neutral-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">{c.hotel}</span>
                  <span className="text-xs text-neutral-400">回應 {c.reviewAuthor}</span>
                  <span className="text-xs text-neutral-300 ml-auto">{c.date}</span>
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed">{c.myComment}</p>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
