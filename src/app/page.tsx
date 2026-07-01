import Link from "next/link";

const featuredReviews = [
  {
    id: 1,
    hotel: "The Lalu 涵碧樓",
    location: "日月潭・日式湖景",
    excerpt: "「清晨五點的湖面安靜得像一面鏡，早餐的蛋根本不需要配料…」",
    rating: 5,
    author: "@wei_travels",
    tag: "湖景",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    id: 2,
    hotel: "Trunk Hotel",
    location: "澀谷・設計旅店",
    excerpt: "「選這裡不是因為它便宜，是因為每個角落都讓你想拍照…」",
    rating: 4,
    author: "@mika_hk",
    tag: "設計",
    color: "bg-violet-50 text-violet-600",
  },
  {
    id: 3,
    hotel: "Alaya Ubud",
    location: "峇里島・叢林Villa",
    excerpt: "「附早餐是假的，那是一頓正餐。下午茶是假的，那是另一頓…」",
    rating: 5,
    author: "@solo_chen",
    tag: "Villa",
    color: "bg-amber-50 text-amber-600",
  },
];

const latestReviews = [
  {
    id: 1,
    initial: "李",
    hotel: "The Grand Hyatt 台北",
    rating: 4,
    content: "商務旅行首選。Check-in 效率超高，但早餐的選擇少了些。適合獨旅商務客。",
    tags: ["商務", "獨旅"],
    date: "2025/12",
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: 2,
    initial: "陳",
    hotel: "Hoshinoya Kyoto 星のや京都",
    rating: 5,
    content: "只能搭船進去就已經值回票價。服務員記得你的名字和每次對話的細節。",
    tags: ["情侶"],
    date: "2025/11",
    color: "bg-violet-100 text-violet-700",
  },
  {
    id: 3,
    initial: "王",
    hotel: "Lotte Hotel Seoul 首爾",
    rating: 3,
    content: "地點完美，但房間隔音很差。週末要住的話記得帶耳塞。家庭旅遊慎選。",
    tags: ["家庭"],
    date: "2025/10",
    color: "bg-emerald-100 text-emerald-700",
  },
];

const cities = ["台北", "台南", "京都", "東京", "首爾", "峇里島"];

function StarRating({ count }: { count: number }) {
  return (
    <span className="text-amber-400 text-sm tracking-tight">
      {"★".repeat(count)}{"☆".repeat(5 - count)}
    </span>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="font-semibold text-neutral-900 tracking-tight">StayNote</span>
          <Link href="/write" className="text-sm text-neutral-500 border border-neutral-200 rounded-full px-4 py-1.5 hover:border-neutral-400 transition-colors">
            分享住宿
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-5 py-10 flex flex-col gap-12">

        {/* Hero */}
        <section className="bg-white border border-neutral-200 rounded-2xl p-8">
          <span className="inline-block text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1 rounded-full mb-4">
            目前公測中
          </span>
          <h1 className="text-3xl font-semibold text-neutral-900 leading-snug mb-3">
            有旅人說過，<br />才值得訂
          </h1>
          <p className="text-neutral-500 text-base leading-relaxed mb-6">
            來自真實旅人的第一手飯店評論，結構化、有觀點、附訂房連結。
          </p>
          <div className="flex gap-3 flex-wrap">
            <button className="bg-neutral-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-neutral-700 transition-colors">
              探索評論
            </button>
            <Link href="/write" className="border border-neutral-300 text-neutral-700 text-sm px-5 py-2.5 rounded-full hover:border-neutral-500 transition-colors">
              分享我的住宿
            </Link>
          </div>
        </section>

        {/* Featured */}
        <section>
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-4">本週編輯推薦</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featuredReviews.map((r) => (
              <Link key={r.id} href={`/hotel/${r.id}`} className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col gap-3 hover:border-neutral-400 transition-colors cursor-pointer">
                <div className={`${r.color} rounded-lg h-16 flex items-center justify-center`}>
                  <span className="text-2xl">🏨</span>
                </div>
                <div>
                  <span className="inline-block text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mb-1">策展精選</span>
                  <p className="font-medium text-sm text-neutral-900">{r.hotel}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{r.location}</p>
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed flex-1">{r.excerpt}</p>
                <div className="flex items-center justify-between">
                  <StarRating count={r.rating} />
                  <span className="text-xs text-neutral-400">{r.author}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Cities */}
        <section>
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-4">熱門城市</p>
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => (
              <button
                key={city}
                className="border border-neutral-200 text-neutral-600 text-sm px-4 py-1.5 rounded-full hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                {city}
              </button>
            ))}
          </div>
        </section>

        <hr className="border-neutral-200" />

        {/* Latest Reviews */}
        <section>
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-4">最新旅人評論</p>
          <div className="flex flex-col divide-y divide-neutral-100">
            {latestReviews.map((r) => (
              <div key={r.id} className="py-4 flex gap-3">
                <div className={`w-9 h-9 rounded-full ${r.color} flex items-center justify-center text-sm font-medium flex-shrink-0`}>
                  {r.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-neutral-900 truncate">{r.hotel}</span>
                    <StarRating count={r.rating} />
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed mb-2">{r.content}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                    <span className="text-xs text-neutral-300 ml-auto">{r.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="bg-neutral-100 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-medium text-neutral-900 mb-1">你最近住了哪裡？</p>
            <p className="text-sm text-neutral-500">分享評論，賺訂房點數（50 點起）</p>
          </div>
          <Link href="/write" className="bg-neutral-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-neutral-700 transition-colors whitespace-nowrap">
            開始填寫
          </Link>
        </section>

      </main>
    </div>
  );
}
