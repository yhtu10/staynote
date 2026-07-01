export interface HotelReview {
  id: number
  author: string
  initial: string
  avatarColor: string
  date: string
  checkInDate: string
  ageTag: "recent" | "older" | "oldest"
  rating: number
  positive: string
  negative: string
  bedType: string
  purpose: string[]
  recommendFor: string[]
  photos: string[]
  countries: number
  stays: number
}

export interface HotelDetail {
  id: number
  slug: string
  name: string
  nameEn: string
  city: string
  country: string
  address: string
  mapQuery: string
  priceRange: string
  tags: string[]
  description: string
  ratingDist: { stars: number; count: number; pct: number }[]
  totalReviews: number
  curatedExcerpt: string
  curatedAuthor: string
  curatedHandle: string
  reviews: HotelReview[]
}

export const HOTEL_DETAILS: HotelDetail[] = [
  {
    id: 1,
    slug: "1",
    name: "金普頓大安酒店",
    nameEn: "Kimpton Da An Hotel",
    city: "台北・大安",
    country: "台灣",
    address: "台北市大安區仁愛路四段27巷25號",
    mapQuery: "Kimpton+Da+An+Hotel+Taipei",
    priceRange: "NT$ 7,000 – 18,000 / 晚",
    tags: ["設計感", "寵物友善", "精品酒店", "近捷運"],
    description: "全亞洲第一間 Kimpton，由上海如恩設計（Neri & Hu）操刀，將老台北的眷村記憶融入現代空間。隱身東區巷弄，距忠孝復興捷運站步行 2 分鐘。",
    ratingDist: [
      { stars: 5, count: 41, pct: 45 },
      { stars: 4, count: 33, pct: 36 },
      { stars: 3, count: 10, pct: 11 },
      { stars: 2, count: 4, pct: 4 },
      { stars: 1, count: 3, pct: 3 },
    ],
    totalReviews: 91,
    curatedExcerpt: "Neri & Hu 把眷村的水泥紋路、台式鐵花窗做成了全球通用語言的精品酒店語彙。每天下午五點的 Social Wine Hour 不是噱頭，是真的讓你跟陌生旅人開始說話。129 間房，每一間都有自己的個性。",
    curatedAuthor: "Shin 旅宿誌",
    curatedHandle: "@shin_taipei",
    reviews: [
      {
        id: 1, author: "林建宏", initial: "林", avatarColor: "bg-blue-100 text-blue-700",
        date: "2026-04", checkInDate: "2026-04", ageTag: "recent", rating: 5,
        positive: "Social Wine Hour 真的是 Kimpton 的靈魂。傍晚在大廳拿了一杯酒，跟旁邊的日本旅客聊了一個小時，這種偶遇不是 5 星飯店會有的事。",
        negative: "停車位很少，自駕要提前確認。", bedType: "一大床",
        purpose: ["情侶旅遊"], recommendFor: ["情侶旅遊", "設計控"],
        photos: ["🍷", "🛏️"], countries: 11, stays: 29,
      },
      {
        id: 2, author: "陳映蓉", initial: "陳", avatarColor: "bg-violet-100 text-violet-700",
        date: "2026-02", checkInDate: "2026-02", ageTag: "recent", rating: 5,
        positive: "帶狗入住，完全沒有額外費用。前台還幫我們準備了狗糧和水碗，這個細節讓我很感動。",
        negative: "健身房規模偏小，設備有點舊。", bedType: "一大床",
        purpose: ["獨旅女生"], recommendFor: ["寵物旅行", "獨旅女生"],
        photos: ["🐶", "🏨"], countries: 15, stays: 42,
      },
      {
        id: 3, author: "Kevin Huang", initial: "K", avatarColor: "bg-amber-100 text-amber-700",
        date: "2025-06", checkInDate: "2025-06", ageTag: "older", rating: 4,
        positive: "Neri & Hu 的設計真的值得特地來住一次。走廊的鐵花窗燈影打在地板上，每個轉角都像一張照片。",
        negative: "部分房間面向巷弄，有一些街道噪音。", bedType: "兩小床",
        purpose: ["朋友同行"], recommendFor: ["設計控", "朋友同行"],
        photos: ["🎨", "🌿"], countries: 9, stays: 22,
      },
    ],
  },
  {
    id: 2,
    slug: "2",
    name: "台南晶英酒店",
    nameEn: "Silks Place Tainan",
    city: "台南・中西區",
    country: "台灣",
    address: "台南市中西區和意路1號",
    mapQuery: "Silks+Place+Tainan",
    priceRange: "NT$ 5,500 – 14,000 / 晚",
    tags: ["親子友善", "空中泳池", "府城文化", "早餐推薦"],
    description: "緊鄰台南新光三越，步行可達孔廟、藍晒圖、國華街。大廳巨鼓出自十鼓擊樂團，早餐直送府城小吃：牛肉湯、碗粿、鹹粥一次吃齊。",
    ratingDist: [
      { stars: 5, count: 55, pct: 48 },
      { stars: 4, count: 38, pct: 33 },
      { stars: 3, count: 14, pct: 12 },
      { stars: 2, count: 6, pct: 5 },
      { stars: 1, count: 2, pct: 2 },
    ],
    totalReviews: 115,
    curatedExcerpt: "在五星飯店的早餐吃到牛肉湯和碗粿，這件事只有台南晶英做得到。空中泳池傍晚時分金光灑下來，是全台南最難忘的角度之一。適合帶小孩、帶長輩，府城文化和現代舒適完美共存。",
    curatedAuthor: "Vivian 旅遊開箱",
    curatedHandle: "@vivian_explore",
    reviews: [
      {
        id: 1, author: "張雅婷", initial: "張", avatarColor: "bg-pink-100 text-pink-700",
        date: "2026-05", checkInDate: "2026-05", ageTag: "recent", rating: 5,
        positive: "早餐的府城風味讓我驚艷，牛肉湯是現熬的，碗粿是在地老店合作款。帶孩子去兒童遊戲室後他整個下午都不想出來。",
        negative: "空中泳池週末人很多，需要早點去才有位置。", bedType: "兩小床",
        purpose: ["親子出遊"], recommendFor: ["親子出遊", "帶長輩"],
        photos: ["🌊", "🥣", "🎡"], countries: 9, stays: 25,
      },
      {
        id: 2, author: "吳俊德", initial: "吳", avatarColor: "bg-emerald-100 text-emerald-700",
        date: "2026-03", checkInDate: "2026-03", ageTag: "recent", rating: 4,
        positive: "地點是台南最精華的位置，出門就是台南美術館、孔廟商圈。飯店本身設計融入台南文化，大廳那面茶罐牆很有記憶點。",
        negative: "房間隔音還好，但樓下酒吧週末營業到深夜，低樓層有感。", bedType: "一大床",
        purpose: ["情侶旅遊"], recommendFor: ["情侶旅遊", "文化旅行"],
        photos: ["🏛️", "🫖"], countries: 7, stays: 16,
      },
      {
        id: 3, author: "Mimi Han", initial: "M", avatarColor: "bg-blue-100 text-blue-700",
        date: "2025-02", checkInDate: "2025-02", ageTag: "older", rating: 5,
        positive: "帶爸媽來住，長輩完全不需要出門找吃的，飯店本身的餐飲就很完整。早餐讓爸爸吃到感動。",
        negative: "訂房旺季一房難求，至少提前兩個月預訂。", bedType: "兩小床",
        purpose: ["帶長輩"], recommendFor: ["帶長輩", "親子出遊"],
        photos: ["🌅", "🛁"], countries: 5, stays: 13,
      },
    ],
  },
  {
    id: 3,
    slug: "3",
    name: "白井屋酒店",
    nameEn: "SHIROIYA HOTEL",
    city: "群馬・前橋",
    country: "日本",
    address: "群馬県前橋市本町2-2-15",
    mapQuery: "SHIROIYA+HOTEL+Maebashi+Gunma",
    priceRange: "JPY 35,000 – 80,000 / 晚",
    tags: ["藝術飯店", "建築設計", "米其林合作主廚", "三溫暖"],
    description: "建築師藤本壮介重新設計的老旅館遺址，Heritage Tower 與 Green Tower 兩棟並立。Jasper Morrison、Leandro Erlich 等國際藝術家設計的特別客房，米其林二星主廚川手寛康監修餐廳。",
    ratingDist: [
      { stars: 5, count: 28, pct: 52 },
      { stars: 4, count: 18, pct: 33 },
      { stars: 3, count: 5, pct: 9 },
      { stars: 2, count: 2, pct: 4 },
      { stars: 1, count: 1, pct: 2 },
    ],
    totalReviews: 54,
    curatedExcerpt: "前橋不是旅遊城市，但白井屋讓它成為值得專程前往的理由。住進 Jasper Morrison 設計的房間，早上在米其林主廚監修的餐廳吃早餐，下午走進旁邊的 3F 當代美術館。這是日本最認真的藝術飯店之一。",
    curatedAuthor: "Art Traveler JP",
    curatedHandle: "@art_traveler_jp",
    reviews: [
      {
        id: 1, author: "蘇意涵", initial: "蘇", avatarColor: "bg-violet-100 text-violet-700",
        date: "2026-04", checkInDate: "2026-04", ageTag: "recent", rating: 5,
        positive: "住的是 Jasper Morrison 設計的房間，極簡到極致但每件東西都是對的。早餐在 the RESTAURANT，前菜就知道這個廚師在認真。三溫暖是我用過最安靜的，完全獨享。",
        negative: "前橋交通不便，從東京需要換乘兩次電車約 1.5 小時。", bedType: "一大床",
        purpose: ["獨旅女生"], recommendFor: ["設計控", "獨旅女生"],
        photos: ["🎨", "🛁", "🌿"], countries: 12, stays: 34,
      },
      {
        id: 2, author: "林建宏", initial: "林", avatarColor: "bg-amber-100 text-amber-700",
        date: "2026-01", checkInDate: "2026-01", ageTag: "recent", rating: 5,
        positive: "Green Tower 的植物牆外觀在霧天裡像幅畫。Leandro Erlich 的裝置作品就放在大廳，不用門票，住客可以隨時去。這種密度的藝術配置在日本飯店裡很少見。",
        negative: "餐廳晚餐只有套餐，沒有單點選項，喜歡自由選擇的人要注意。", bedType: "一大床",
        purpose: ["情侶旅遊"], recommendFor: ["情侶旅遊", "藝術愛好者"],
        photos: ["🏛️", "🌱"], countries: 11, stays: 29,
      },
    ],
  },
  {
    id: 4,
    slug: "4",
    name: "台北漢來大飯店",
    nameEn: "Grand Hilai Taipei",
    city: "台北・南港",
    country: "台灣",
    address: "台北市南港區經貿一路168號",
    mapQuery: "Grand+Hilai+Taipei",
    priceRange: "NT$ 6,000 – 20,000 / 晚",
    tags: ["商務出差", "24H健身房", "行政酒廊", "溫水泳池"],
    description: "鄰近南港展覽館，金鑰匙與英式管家協會雙認證。425 間客房每間附浴缸，minibar 免費供應，行政樓層享 Happy Hour。旁鄰 Lalaport 購物中心。",
    ratingDist: [
      { stars: 5, count: 38, pct: 40 },
      { stars: 4, count: 42, pct: 44 },
      { stars: 3, count: 10, pct: 11 },
      { stars: 2, count: 3, pct: 3 },
      { stars: 1, count: 2, pct: 2 },
    ],
    totalReviews: 95,
    curatedExcerpt: "台灣自己養出來的五星飯店品牌，南港館的硬體規格很扎實：每間標準房都有浴缸、minibar 免費、24H 溫水泳池。商務旅行住這裡的 CP 值在台北五星裡算高的，行政酒廊下午的酒水質感讓人意外。",
    curatedAuthor: "旅宿開箱 Leo",
    curatedHandle: "@leo_hotel_review",
    reviews: [
      {
        id: 1, author: "李彥霆", initial: "李", avatarColor: "bg-blue-100 text-blue-700",
        date: "2026-05", checkInDate: "2026-05", ageTag: "recent", rating: 4,
        positive: "開展期間住這最方便，走路到南港展覽館 5 分鐘。minibar 免費讓人很舒服，浴缸每間都有，這在台北五星裡不是理所當然的事。",
        negative: "位置偏東，不是在台北市核心，自由行旅客要搭捷運進市區。", bedType: "一大床",
        purpose: ["商務出差"], recommendFor: ["商務出差", "獨旅男生"],
        photos: ["🏊", "🛁"], countries: 8, stays: 21,
      },
      {
        id: 2, author: "黃雅芳", initial: "黃", avatarColor: "bg-pink-100 text-pink-700",
        date: "2026-02", checkInDate: "2026-02", ageTag: "recent", rating: 5,
        positive: "行政酒廊的 Happy Hour 超值，酒水品質比很多台北飯店好。溫水泳池深夜還可以游，這個對我來說是關鍵選項。",
        negative: "Island 自助早餐假日人多，需要稍等候位。", bedType: "一大床",
        purpose: ["情侶旅遊"], recommendFor: ["商務出差", "情侶旅遊"],
        photos: ["🍹", "🌆"], countries: 6, stays: 14,
      },
    ],
  },
  {
    id: 5,
    slug: "5",
    name: "NOHGA HOTEL AKIHABARA",
    nameEn: "NOHGA HOTEL AKIHABARA TOKYO",
    city: "東京・秋葉原",
    country: "日本",
    address: "東京都千代田区外神田3-10-11",
    mapQuery: "NOHGA+HOTEL+AKIHABARA+TOKYO",
    priceRange: "JPY 18,000 – 45,000 / 晚",
    tags: ["設計感", "音樂", "適合工作", "近車站"],
    description: "以「音樂、食物、藝術」為核心的生活風格飯店。每間房配備高品質喇叭，Deluxe Twin 更有五大頂級音響品牌之一。距秋葉原站步行 6 分鐘，可蘭多義式餐廳全日供應。",
    ratingDist: [
      { stars: 5, count: 30, pct: 44 },
      { stars: 4, count: 25, pct: 37 },
      { stars: 3, count: 9, pct: 13 },
      { stars: 2, count: 2, pct: 3 },
      { stars: 1, count: 2, pct: 3 },
    ],
    totalReviews: 68,
    curatedExcerpt: "NOHGA 把「住在秋葉原」這件事重新定義了。音響設備是真的認真選的，不是裝飾，Deluxe Twin 的喇叭可以讓你在房間開一場私人音樂會。披薩吧的早餐和晚間酒吧氛圍完全像個在地社區空間，不像飯店。",
    curatedAuthor: "No Work All Travel",
    curatedHandle: "@noworkalltravel",
    reviews: [
      {
        id: 1, author: "蘇意涵", initial: "蘇", avatarColor: "bg-violet-100 text-violet-700",
        date: "2026-04", checkInDate: "2026-04", ageTag: "recent", rating: 5,
        positive: "每間房都有高質感喇叭，睡前開著爵士樂，外面是秋葉原，這種反差感很獨特。早餐的西班牙義式風格出乎意料地好，比很多東京飯店的早餐用心。",
        negative: "房間空間偏小，行李多的話活動空間有限。", bedType: "兩小床",
        purpose: ["獨旅女生"], recommendFor: ["設計控", "獨旅女生", "適合工作"],
        photos: ["🎵", "🍕", "🎧"], countries: 12, stays: 34,
      },
      {
        id: 2, author: "陳俊安", initial: "陳", avatarColor: "bg-blue-100 text-blue-700",
        date: "2026-02", checkInDate: "2026-02", ageTag: "recent", rating: 4,
        positive: "遠端工作的朋友推薦的，Lobby 的工作區很舒適，WiFi 超快，書架上放的書都是精選的設計和音樂主題。",
        negative: "沒有健身房，喜歡早上運動的要另找資源。", bedType: "一大床",
        purpose: ["獨旅男生"], recommendFor: ["獨旅男生", "適合工作"],
        photos: ["💻", "📚"], countries: 7, stays: 18,
      },
    ],
  },
  {
    id: 6,
    slug: "6",
    name: "煙波大飯店 新竹湖濱館",
    nameEn: "Lakeshore Hotel Hsinchu",
    city: "新竹・青草湖畔",
    country: "台灣",
    address: "新竹市東區明湖路773號",
    mapQuery: "Lakeshore+Hotel+Hsinchu",
    priceRange: "NT$ 4,500 – 12,000 / 晚",
    tags: ["親子友善", "室內兒童樂園", "溫水泳池", "湖景"],
    description: "桃竹苗最大親子度假飯店，坐落青草湖畔。2300 坪室內兒童樂園「卡樂次元」、全年溫水泳池、SPA 水療區，三棟歐式風格建築：香榭館、麗池館、溫莎館。",
    ratingDist: [
      { stars: 5, count: 45, pct: 42 },
      { stars: 4, count: 40, pct: 37 },
      { stars: 3, count: 15, pct: 14 },
      { stars: 2, count: 5, pct: 5 },
      { stars: 1, count: 2, pct: 2 },
    ],
    totalReviews: 107,
    curatedExcerpt: "台灣親子住宿的天花板之一。2300 坪室內兒童樂園讓父母可以真正放鬆，全年溫水泳池代表天氣不是問題。青草湖畔的早晨散步是意外的驚喜，很少有親子飯店同時提供了度假感。",
    curatedAuthor: "親子旅遊達人",
    curatedHandle: "@family_travel_tw",
    reviews: [
      {
        id: 1, author: "張雅婷", initial: "張", avatarColor: "bg-pink-100 text-pink-700",
        date: "2026-03", checkInDate: "2026-03", ageTag: "recent", rating: 4,
        positive: "2300 坪室內兒童樂園真的沒在開玩笑，孩子進去兩個小時還不想出來。全年溫水泳池對台灣的冬天旅遊很加分，不用擔心天氣。",
        negative: "週末人潮多，餐廳要排隊，建議避開連假入住。", bedType: "兩小床",
        purpose: ["親子出遊"], recommendFor: ["親子出遊"],
        photos: ["🎡", "🏊", "🌊"], countries: 9, stays: 25,
      },
      {
        id: 2, author: "王俊明", initial: "王", avatarColor: "bg-emerald-100 text-emerald-700",
        date: "2026-01", checkInDate: "2026-01", ageTag: "recent", rating: 5,
        positive: "帶三個小孩來，這是我們住過最順利的親子旅遊。早餐品質很不錯，Buffet 選項比我預期的多。湖景房早上開窗看青草湖真的很療癒。",
        negative: "距離市中心較遠，晚上出門吃東西要開車。", bedType: "兩小床",
        purpose: ["親子出遊"], recommendFor: ["親子出遊", "家庭（含幼兒）"],
        photos: ["🌅", "🎠"], countries: 4, stays: 11,
      },
    ],
  },
  {
    id: 7,
    slug: "7",
    name: "Ace Hotel Kyoto",
    nameEn: "Ace Hotel Kyoto",
    city: "京都・中京區",
    country: "日本",
    address: "京都府京都市中京区車屋町245-2",
    mapQuery: "Ace+Hotel+Kyoto",
    priceRange: "JPY 28,000 – 70,000 / 晚",
    tags: ["設計感", "藝術", "日本第一間Stumptown", "近捷運"],
    description: "京都最受設計旅人關注的飯店之一，直連烏丸御池站。Stumptown Coffee 日本首家分店在一樓，三間由知名美籍主廚主理的餐廳，大廳設藝術展覽空間，附腳踏車租借。",
    ratingDist: [
      { stars: 5, count: 52, pct: 47 },
      { stars: 4, count: 38, pct: 35 },
      { stars: 3, count: 13, pct: 12 },
      { stars: 2, count: 5, pct: 5 },
      { stars: 1, count: 2, pct: 2 },
    ],
    totalReviews: 110,
    curatedExcerpt: "Ace Hotel 進駐京都，帶來了美式精品飯店文化遇上古都的化學反應。Stumptown 的咖啡香從早上就瀰漫整個大廳，腳踏車借走直奔鴨川。三間餐廳的水準都在線，不用離開飯店就能吃得很好。",
    curatedAuthor: "設計旅人 Mika",
    curatedHandle: "@mika_designtravel",
    reviews: [
      {
        id: 1, author: "陳映蓉", initial: "陳", avatarColor: "bg-violet-100 text-violet-700",
        date: "2026-05", checkInDate: "2026-05", ageTag: "recent", rating: 5,
        positive: "Stumptown 是我在日本喝過最好的咖啡之一，而且從房間下樓就到。腳踏車騎去哲學之道花了 20 分鐘，沿路全是我的京都。",
        negative: "房間走美式工業風，喜歡傳統和風的旅客可能不太合。", bedType: "一大床",
        purpose: ["獨旅女生"], recommendFor: ["設計控", "獨旅女生"],
        photos: ["☕", "🚲", "🌸"], countries: 15, stays: 42,
      },
      {
        id: 2, author: "林子晴", initial: "林", avatarColor: "bg-amber-100 text-amber-700",
        date: "2026-03", checkInDate: "2026-03", ageTag: "recent", rating: 4,
        positive: "大廳的藝術展覽換得很勤，我去的那次是攝影展，住一晚等於去了一次展覽。捷運站直結超方便，下雨不用打傘。",
        negative: "三間餐廳晚上要提前預訂，臨時去很難有位。", bedType: "一大床",
        purpose: ["情侶旅遊"], recommendFor: ["設計控", "情侶旅遊"],
        photos: ["🖼️", "🍷"], countries: 8, stays: 20,
      },
      {
        id: 3, author: "Yuki Chen", initial: "Y", avatarColor: "bg-blue-100 text-blue-700",
        date: "2025-04", checkInDate: "2025-04", ageTag: "older", rating: 4,
        positive: "花見期間住這，下樓就是烏丸御池，搭地鐵兩站到圓山。飯店大廳在旺季的人潮反而有種節慶感，像個社群聚集地。",
        negative: "賞花旺季房價飆升，CP 值相對平日差很多，建議避開旺季。", bedType: "一大床",
        purpose: ["朋友同行"], recommendFor: ["朋友同行", "設計控"],
        photos: ["🌸", "🏯"], countries: 6, stays: 15,
      },
    ],
  },
  {
    id: 8,
    slug: "8",
    name: "東京日本橋濱町飯店",
    nameEn: "Hamacho Hotel Tokyo Nihonbashi",
    city: "東京・日本橋濱町",
    country: "日本",
    address: "東京都中央区日本橋浜町3-20-2",
    mapQuery: "Hamacho+Hotel+Tokyo+Nihonbashi",
    priceRange: "JPY 22,000 – 55,000 / 晚",
    tags: ["設計感", "手工藝體驗", "下町", "巧克力工坊"],
    description: "由 MUJI HOTEL GINZA 企劃團隊 UDS 設計，層層堆疊的植栽露台是東京少見的垂直綠意建築。以「手工、日本、現代主義」為核心，設有巧克力工作室，提供職人工藝體驗。",
    ratingDist: [
      { stars: 5, count: 26, pct: 46 },
      { stars: 4, count: 20, pct: 36 },
      { stars: 3, count: 7, pct: 12 },
      { stars: 2, count: 2, pct: 4 },
      { stars: 1, count: 1, pct: 2 },
    ],
    totalReviews: 56,
    curatedExcerpt: "MUJI HOTEL 同個企劃團隊，但 Hamacho 有自己的個性。植栽露台在東京這個密度裡是真的罕見，轉角房每層只有一間，視野獨佔整條下町街景。手工巧克力工作室的體驗是住客限定的，這種細節讓人想回來。",
    curatedAuthor: "MATCHA 旅日誌",
    curatedHandle: "@matcha_japan",
    reviews: [
      {
        id: 1, author: "林建宏", initial: "林", avatarColor: "bg-green-100 text-green-700",
        date: "2026-04", checkInDate: "2026-04", ageTag: "recent", rating: 5,
        positive: "訂到了轉角房，一整面窗俯瞰濱町街道，早上有下町的聲音飄進來，晚上換成安靜。手工巧克力體驗課值得特地安排，師傅教得很認真。",
        negative: "距離主要景點較遠，需要搭電車，下町的寧靜是優點也是限制。", bedType: "一大床",
        purpose: ["情侶旅遊"], recommendFor: ["設計控", "情侶旅遊"],
        photos: ["🌿", "🍫", "🏙️"], countries: 11, stays: 29,
      },
      {
        id: 2, author: "陳姿妤", initial: "陳", avatarColor: "bg-pink-100 text-pink-700",
        date: "2026-01", checkInDate: "2026-01", ageTag: "recent", rating: 4,
        positive: "建築外觀的植栽露台在冬天也很美，每層都有綠意。大廳的手作糕點下午茶是要收費的但很值得，品質像精品甜點店。",
        negative: "旁邊沒有便利商店，深夜想買東西要走一段路。", bedType: "一大床",
        purpose: ["獨旅女生"], recommendFor: ["設計控", "獨旅女生"],
        photos: ["🌱", "🍰"], countries: 9, stays: 23,
      },
    ],
  },
  {
    id: 9,
    slug: "9",
    name: "ホテルインディゴ犬山有楽苑",
    nameEn: "Hotel Indigo Inuyama Urakuen Garden",
    city: "愛知・犬山",
    country: "日本",
    address: "愛知県犬山市御門先2",
    mapQuery: "Hotel+Indigo+Inuyama+Urakuen+Garden",
    priceRange: "JPY 45,000 – 120,000 / 晚",
    tags: ["溫泉", "國寶茶室", "犬山城景", "奢華享受"],
    description: "坐落於有楽苑庭園內，三種景觀房型：犬山城・木曾川・國寶茶室「如庵」。館內設犬山唯一天然溫泉「白帝の湯」，含室內外浴池，米其林推薦旅宿。",
    ratingDist: [
      { stars: 5, count: 22, pct: 55 },
      { stars: 4, count: 13, pct: 33 },
      { stars: 3, count: 3, pct: 8 },
      { stars: 2, count: 1, pct: 2 },
      { stars: 1, count: 1, pct: 2 },
    ],
    totalReviews: 40,
    curatedExcerpt: "日本 IHG 旗艦精品之作。有楽苑庭園裡醒來，窗外是木曾川或犬山城，下樓就是犬山唯一的天然溫泉。在這裡住一晚比跑遍名古屋所有飯店更有記憶點，這是一種「目的地本身」的住宿體驗。",
    curatedAuthor: "一休 旅宿精選",
    curatedHandle: "@ikyu_select",
    reviews: [
      {
        id: 1, author: "蘇意涵", initial: "蘇", avatarColor: "bg-amber-100 text-amber-700",
        date: "2026-03", checkInDate: "2026-03", ageTag: "recent", rating: 5,
        positive: "訂了犬山城景的房，早上拉開窗簾的那一秒是本次旅行最難忘的瞬間。天然溫泉在這個等級的飯店裡是正確的，不是噱頭，泡完皮膚真的不一樣。",
        negative: "犬山市本身交通不算方便，從名古屋到犬山站需要 30 分鐘電車再接計程車。", bedType: "一大床",
        purpose: ["情侶旅遊"], recommendFor: ["情侶旅遊", "奢華享受"],
        photos: ["🏯", "♨️", "🌅"], countries: 12, stays: 34,
      },
      {
        id: 2, author: "Kevin Huang", initial: "K", avatarColor: "bg-blue-100 text-blue-700",
        date: "2025-11", checkInDate: "2025-11", ageTag: "older", rating: 5,
        positive: "如庵茶室景觀房讓我對「國寶」有了很具體的感受，窗景裡的茶室是真的國家指定的重要文化財。飯店設計與庭園完全融合，沒有違和感。",
        negative: "價位不便宜，但考量到內容物完全值得，只是不適合預算有限的旅行。", bedType: "一大床",
        purpose: ["情侶旅遊"], recommendFor: ["奢華享受", "情侶旅遊"],
        photos: ["🍵", "🌿", "🏯"], countries: 9, stays: 22,
      },
    ],
  },
]

export function getHotelBySlug(slug: string): HotelDetail | undefined {
  return HOTEL_DETAILS.find((h) => h.slug === slug)
}
