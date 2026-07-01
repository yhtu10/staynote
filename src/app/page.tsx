import Link from "next/link";

const featuredReviews = [
  {
    id: 1,
    hotel: "金普頓大安酒店",
    location: "台北大安・設計精品",
    excerpt: "「全亞洲第一間 Kimpton，藏在東區巷弄裡。Neri & Hu 的設計把老台北揉進每個角落，卻又完全當代。」",
    rating: 5,
    author: "@shin_taipei",
    tag: "設計",
    color: "bg-violet-50 text-violet-600",
  },
  {
    id: 2,
    hotel: "台南晶英酒店",
    location: "台南中西區・府城文化",
    excerpt: "「早餐直接端上牛肉湯和碗粿，在五星飯店吃到這個才叫台南魂。空中泳池傍晚時分是全台南最美的角度。」",
    rating: 5,
    author: "@vivian_tainan",
    tag: "親子",
    color: "bg-amber-50 text-amber-600",
  },
  {
    id: 3,
    hotel: "白井屋酒店",
    location: "群馬前橋・藝術飯店",
    excerpt: "「藤本壮介設計，Jasper Morrison 的房間住起來像住進美術館。前橋不是觀光地，這間飯店本身就是目的地。」",
    rating: 5,
    author: "@art_traveler_jp",
    tag: "藝術",
    color: "bg-emerald-50 text-emerald-600",
  },
];

const latestReviews = [
  {
    id: 1,
    initial: "林",
    name: "林建宏",
    countries: 11,
    stays: 29,
    hotel: "台北漢來大飯店",
    rating: 4,
    content: "南港展覽館旁，商務會議住宿最方便。浴缸每間標配、minibar 免費、行政酒廊 happy hour 的酒品質不錯。",
    dislike: "位置偏東，離信義商圈需要搭車，自由行旅客要考慮。",
    tags: ["商務出差"],
    date: "2026/05",
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: 2,
    initial: "蘇",
    name: "蘇意涵",
    countries: 12,
    stays: 34,
    hotel: "NOHGA HOTEL AKIHABARA",
    location: "東京秋葉原",
    rating: 5,
    content: "每間房都有高質感喇叭，Deluxe Twin 的音響是五家頂級品牌之一。早餐的西班牙義式風格出乎意料地好。",
    dislike: "房間空間偏小，行李多的話會有點擠。",
    tags: ["獨旅男生", "設計控"],
    date: "2026/04",
    color: "bg-violet-100 text-violet-700",
  },
  {
    id: 3,
    initial: "張",
    name: "張雅婷",
    countries: 9,
    stays: 25,
    hotel: "煙波大飯店 新竹湖濱館",
    rating: 4,
    content: "2300 坪室內兒童樂園真的沒在開玩笑，孩子進去就不想出來。全年溫水泳池讓親子遊不用擔心天氣。",
    dislike: "週末人潮很多，餐廳要排隊，建議平日入住。",
    tags: ["親子出遊"],
    date: "2026/03",
    color: "bg-emerald-100 text-emerald-700",
  },
];

const exploreTags = [
  { label: "台北", type: "city" },
  { label: "台南", type: "city" },
  { label: "京都", type: "city" },
  { label: "東京", type: "city" },
  { label: "首爾", type: "city" },
  { label: "峇里島", type: "city" },
  { label: "親子 × 品味", type: "vibe" },
  { label: "獨旅女生", type: "vibe" },
  { label: "設計控", type: "vibe" },
  { label: "溫泉", type: "vibe" },
];

const topReviewers = [
  { initial: "陳", name: "陳映蓉", countries: 15, stays: 42, color: "bg-violet-100 text-violet-700" },
  { initial: "蘇", name: "蘇意涵", countries: 12, stays: 34, color: "bg-pink-100 text-pink-700" },
  { initial: "林", name: "林建宏", countries: 11, stays: 29, color: "bg-blue-100 text-blue-700" },
  { initial: "張", name: "張雅婷", countries: 9, stays: 25, color: "bg-amber-100 text-amber-700" },
  { initial: "李", name: "李彥霆", countries: 8, stays: 21, color: "bg-emerald-100 text-emerald-700" },
];

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
          <div className="flex items-center gap-3">
            <Link href="/profile" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
              我的
            </Link>
            <Link href="/write" className="text-sm text-neutral-500 border border-neutral-200 rounded-full px-4 py-1.5 hover:border-neutral-400 transition-colors">
              分享住宿
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-5 py-10 flex flex-col gap-12">

        {/* Hero */}
        <section className="bg-white border border-neutral-200 rounded-2xl p-8">
          <span className="inline-block text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1 rounded-full mb-4">
            目前公測中
          </span>
          <h1 className="text-3xl font-semibold text-neutral-900 leading-snug mb-2">
            懂旅行的人，<br />都在這裡說真話
          </h1>
          <p className="text-neutral-500 text-base leading-relaxed mb-6">
            親子 × 品味住宿的旅人都在這裡分享第一手評論。
          </p>
          {/* 搜尋框 */}
          <div className="relative mb-5">
            <input
              type="text"
              placeholder="搜尋城市、地標或情境關鍵字…"
              className="w-full border border-neutral-200 rounded-full px-5 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 bg-neutral-50"
              readOnly
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">🔍</span>
          </div>
          <Link href="/write" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
            分享我的住宿 →
          </Link>
        </section>

        {/* 標籤探索區 */}
        <section>
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-4">探索情境</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {exploreTags.map((t) => (
              <button
                key={t.label}
                className={`flex-shrink-0 text-sm px-4 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                  t.type === "vibe"
                    ? "border-blue-200 text-blue-600 bg-blue-50 hover:border-blue-400"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                }`}
              >
                {t.label}
              </button>
            ))}
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
                  <span className="inline-block text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mb-1">編輯精選</span>
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
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <span className="text-sm font-medium text-neutral-900 truncate">{r.hotel}</span>
                    <StarRating count={r.rating} />
                  </div>
                  <p className="text-xs text-neutral-400 mb-2">
                    {r.name} · 去過 {r.countries} 國 · 住過 {r.stays} 間
                  </p>
                  <p className="text-sm text-neutral-600 leading-relaxed mb-1">{r.content}</p>
                  <p className="text-xs text-neutral-400 mb-2">
                    <span className="text-neutral-300">最不滿意：</span>{r.dislike}
                  </p>
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

        {/* 評論者榜單 */}
        <section>
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-4">本月最有幫助旅人</p>
          <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100">
            {topReviewers.map((r, i) => (
              <div key={r.name} className="px-4 py-3 flex items-center gap-3">
                <span className="text-xs text-neutral-300 w-4 text-right flex-shrink-0">{i + 1}</span>
                <div className={`w-8 h-8 rounded-full ${r.color} flex items-center justify-center text-sm font-medium flex-shrink-0`}>
                  {r.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900">{r.name}</p>
                  <p className="text-xs text-neutral-400">去過 {r.countries} 國 · 住過 {r.stays} 間</p>
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
