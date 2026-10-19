// hereici 复刻版 · 中英双语内容字典（两语言结构严格对齐）

// 首屏第 1 张内置兜底图：与后台首屏轮播首条同源（Vercel Blob CDN）。
// /api/content 不可达的极端情况下，内置兜底文案仍搭配当前品牌首图，
// 避免回退到已下线的旧湖景图（API 恢复后以远程数据为准自动替换）。
const HERO_HOME_IMG =
  'https://hqhqwl3jcotwfk9s.public.vercel-storage.com/hero/1790551540990-l0oa8rsd-ulwSEMyvXklbAARHSWXcIySpu325WM.jpeg'

// 浏览器标签页站点标题（中英共用一个 SEO 标题，与 server/lib/siteTextsSeed.mjs SITE_TITLE 保持一致）
const SITE_TITLE = 'Apartments for Rent in Guangzhou, Guangdong ｜Expat Housing ｜ChinaHomeRent'

const en = {
  siteName: SITE_TITLE,
  nav: {
    logo: 'V Plus',
    menus: [
      { label: 'Home', href: '#top' },
      {
        label: 'Residences',
        href: '/listings',
        subs: [
          { key: 'luxury', event: 'luxury', label: 'Luxury Homes' },
          { key: 'standard', event: 'standard', label: 'Standard Homes' },
          { key: 'student', event: 'student', label: 'Student Flats' },
          { key: 'city', event: 'city', label: 'City Flats' }
        ]
      },
      { label: 'Map Search', href: '/map' },
      {
        label: 'Other Services',
        href: '#get-started',
        subs: [
          { key: 'video', label: 'Video Viewing Service', img: '/images/extras/video.jpg' },
          { key: 'plane', label: 'Airport Pickup Service', img: '/images/extras/plane.jpg' },
          { key: 'passport', label: 'Accommodation Registration', img: '/images/extras/passport.jpg' },
          { key: 'broom', label: 'House Cleaning Service', img: '/images/extras/broom.jpg' },
          { key: 'truck', label: 'Local Moving Service', img: '/images/extras/truck.jpg' },
          { key: 'briefcase', label: 'Office Rental Service', img: '/images/extras/briefcase.jpg' },
          { key: 'house', label: 'Property Buying & Selling', img: '/images/extras/house.jpg' }
        ]
      },
      { label: 'Renting Guide', href: '/guides' },
      {
        label: 'Contact Us',
        href: '#get-started',
        subs: [
          { key: 'email', icon: 'mail', label: 'Email', value: 'hello@v-plus.house', href: 'mailto:hello@v-plus.house' },
          { key: 'phone', icon: 'phone', label: 'Phone', value: '+352 621780307', href: 'tel:+352621780307' },
          { key: 'whatsapp', icon: 'whatsapp', label: 'WhatsApp', value: '+352 621780307', href: 'https://wa.me/352621780307' },
          { key: 'wechat', icon: 'wechat', label: 'WeChat', value: 'vplus-relocation' }
        ]
      }
    ],
    cta: 'Enter Society'
  },
  dream: {
    join: 'Join society',
    view: 'View Residences',
    slideAria: 'Go to residence {n}',
    features: [
      {
        title: 'Luxury Modern Comfort',
        text: 'Enjoy elegant interiors, warm lighting, spacious living, and a premium stay designed for rest and relaxation.'
      },
      {
        title: 'Easy Private Booking',
        text: 'Reserve your apartment in minutes and experience a seamless stay built for comfort, privacy, and convenience.'
      }
    ],
    slides: [
      {
        rating: 'Rated 4.9 out of 5',
        img: HERO_HOME_IMG,
        titleA: 'A Private Stay',
        titleB: 'Designed for Pure Peace',
        desc: 'Escape the noise and settle into a refined lakeside apartment made for slow mornings, stunning views, and unforgettable comfort.',
        feature: {
          title: 'Lakefront Views',
          text: 'Wake up to peaceful water views and a setting that feels calm, private, and beautifully removed from the city rush.'
        }
      },
      {
        rating: 'Rated 4.8 out of 5',
        titleA: 'Forest Chalet',
        titleB: 'A Whole Forest of Your Own',
        desc: 'As dusk settles over the pines, the timber A-frame glows warm inside — a crackling fire pit, a starlit deck and nothing but mountain air.',
        feature: {
          title: 'Wrapped in Pines',
          text: 'Tall firs and distant peaks frame the cabin. Step onto the deck for the fire pit, the scent of cedar and a sky full of stars.'
        }
      },
      {
        rating: 'Rated 5.0 out of 5',
        titleA: 'Lakeshore Lights',
        titleB: 'Home by the Glowing Water',
        desc: 'Glide across the dusk in a rowboat as the shoreline villa lights up one by one, gold rippling over the lake — your daily homecoming ritual.',
        feature: {
          title: 'Private Dock',
          text: 'Your own lakeshore and dock sits just beyond the door — misty morning rows by day and lantern-lit reflections by night.'
        }
      },
      {
        rating: 'Rated 4.9 out of 5',
        titleA: 'Pool Estate',
        titleB: 'Every Evening Worth a Toast',
        desc: 'Stone walls, warm lanterns, a private pool and a glowing fire bowl — a resort-grade estate that turns an ordinary night into a celebration.',
        feature: {
          title: 'Private Heated Pool',
          text: 'The heated pool faces the garden lawn, with loungers and a fire bowl ready for midnight swims and garden parties that are entirely yours.'
        }
      },
      {
        rating: 'Rated 4.7 out of 5',
        titleA: 'Ocean House',
        titleB: 'Fall Asleep to the Waves',
        desc: 'Raised above the sand at the end of a boardwalk, the beach house glows softly in blue-hour mist, with the tide as your only background music.',
        feature: {
          title: 'Absolute Waterfront',
          text: 'Walk straight from the raised deck onto the sand — unobstructed sea views, the tide below, and sunrises you hear before you see.'
        }
      }
    ]
  },
  ui: { from: 'FROM', perMonth: '/mo', view: 'View' },
  stats: [
    { value: '5,000+', label: 'RESIDENTS WELCOMED' },
    { value: '98%', label: 'CLIENT SATISFACTION' },
    { value: '8', label: 'LANGUAGES SPOKEN' }
  ],
  team: {
    title: 'Questions? Ask Alex & Sophie',
    sub: 'Real humans, fast replies on WhatsApp.',
    whatsapp: 'WhatsApp ＆ Tel ＆WeChat'
  },
  teamIntro: {
    overline: 'Meet the Team',
    titleLead: 'You will be looked after by',
    titleAccent: 'real people.',
    desc: 'Not a faceless platform — a small, senior relocation team that speaks your language, inspects every flat in person, and stays on call from your first viewing to your last month in China.',
    members: [
      { index: '01', name: 'Alex Novi', role: 'Operations Manager' },
      { index: '02', name: 'Sophie Xue', role: 'Property Manager' },
      { index: '03', name: 'Daniel Okafor', role: 'Viewing Specialist' },
      { index: '04', name: 'Mia Laurent', role: 'Tenancy Consultant' },
      { index: '05', name: 'Lucas Meyer', role: 'Maintenance Lead' },
      { index: '06', name: 'Priya Nair', role: 'Client Experience Lead' },
      { index: '07', name: 'Marco Bellini', role: 'Settlement Advisor' },
      { index: '08', name: 'Yuki Tanaka', role: 'Community Manager' }
    ]
  },
  discover: {
    title: 'Discover our selection of homes in Guangzhou',
    mobileKicker: 'Property Types',
    mobileTitle: 'From here, start your home journey',
    mobileSub: 'Select a category to browse featured properties',
    mobileCount: 'homes',
    mobileBack: 'Back to types',
    mobileAll: 'View all homes',
    mobileAllHide: 'Hide all homes',
    mobileAllCount: 'all homes',
    tabs: [
      { key: 'liwan', label: 'Liwan', desc: '' },
      { key: 'tianhe', label: 'Tianhe', desc: 'The CBD core around Zhujiang New Town and Tianhe Sports Circle — the top pick for expat families and young professionals.' },
      { key: 'yuexiu', label: 'Yuexiu', desc: 'Historic city centre dotted with parks and top schools, served by metro Lines 1 and 2 — classic Guangzhou living.' },
      { key: 'haizhu', label: 'Haizhu', desc: 'Leafy riverside district south of the Pearl River, home to universities and quiet residential compounds.' },
      { key: 'baiyun', label: 'Baiyun', desc: 'Spacious green belt at the foot of Baiyun Mountain — bigger flats and better value for families.' },
      { key: 'huangpu', label: 'Huangpu', desc: 'Fast-growing eastern tech hub with modern high-rise compounds and river views.' },
      { key: 'panyu', label: 'Panyu', desc: 'Southern university and coliving belt on Line 4 — affordable rooms minutes from campus.' },
      { key: 'zengcheng', label: 'Zengcheng', desc: 'Eastern green belt around the Zengjiang hi-tech corridor — roomy new compounds, lower rents and a direct Line 21 ride to the city centre.' }
    ],
    all: 'All Districts',
    allDesc: 'Browse every hand-picked home across Guangzhou, then narrow by district.',
    // 住宅类型仅由导航栏菜单切换
    types: [
      { key: 'luxury', label: 'Luxury Homes', desc: 'High-end apartments and penthouses with skyline views and premium finishes.' },
      { key: 'standard', label: 'Standard Homes', desc: 'Spacious family flats in established residential neighbourhoods with easy commutes.' },
      { key: 'student', label: 'Student Flats', desc: 'Private rooms and shared flats near campuses — furnished with bills included.' },
      { key: 'city', label: 'City Flats', desc: 'Serviced studios and lofts in the city centre, steps from metro and malls.' }
    ],
    // 学生公寓二级院校
    schools: [
      { key: 'scut-wushan', label: 'South China University of Technology (Wushan Campus)' },
      { key: 'scut-intl', label: 'South China University of Technology (International Campus)' },
      { key: 'scnu-shipai', label: 'South China Normal University (Shipai Campus)' },
      { key: 'gdut-dongfeng', label: 'Guangdong University of Technology (Dongfeng Road Campus)' },
      { key: 'jnu-huawen', label: 'Jinan University (Chinese Language & Culture College)' },
      { key: 'jnu-shipai', label: 'Jinan University (Shipai Campus)' },
      { key: 'gzmu', label: 'Guangzhou Maritime University' },
      { key: 'gdufs-baiyun', label: 'Guangdong University of Foreign Studies (Baiyunshan Campus)' }
    ],
    schoolPickerTitle: 'Select your campus',
    schoolPickerSub: 'Pick a campus to browse student flats nearby.',
    schoolPickerAll: 'All campuses',
    schoolPickerClose: 'Close campus picker',
    areaPickerTitle: 'Select area',
    areaPickerSub: 'Pick an area to browse {type} in that district.',
    areaPickerAll: 'All areas',
    areaPickerClose: 'Close area picker',
    clearType: 'Clear home type filter',
    empty: 'Homes in this category are coming soon — please check back shortly.',
    emptyCombo: 'No homes of this type in this district yet — clear the type filter or pick another district.',
    emptySchool: 'Homes near this campus are coming soon — please check back shortly.'
  },
  properties: [],
  detail: {
    back: 'Back to all homes',
    overview: 'Overview',
    galleryTitle: 'More photos',
    aboutTitle: 'About this home',
    aboutText:
      'This {br} apartment offers {area} m² of bright, fully furnished living space in {district}. Managed end-to-end by V Plus, it arrives move-in ready with modern appliances, stylish décor and every utility arranged — and with {metro} on your doorstep, the city is only minutes away.',
    aboutTextNoArea:
      'This {br} apartment in {district} offers bright, fully furnished living space. Managed end-to-end by V Plus, it arrives move-in ready with modern appliances, stylish décor and every utility arranged — and with {metro} on your doorstep, the city is only minutes away.',
    amenitiesTitle: 'What this place offers',
    locationTitle: 'Location & transport',
    locationText:
      'Close to {metro}. Supermarkets, cafés and 24-hour convenience stores are all within easy reach.',
    mapOpen: 'Open in Google Maps',
    mapTitle: 'Map of the surrounding area',
    specs: {
      beds: 'Bedrooms',
      baths: 'Bathrooms',
      area: 'Living area',
      minStay: 'Minimum stay',
      available: 'Available'
    },
    minStay: '3 months',
    available: 'Move-in ready',
    depositLabel: 'Deposit',
    depositValue: "2 months' rent",
    leaseLabel: 'Lease',
    leaseValue: 'Flexible lease',
    ask: 'WhatsApp ＆ Tel ＆WeChat',
    amenities: {
      furnished: { icon: '🛋️', label: 'Fully furnished' },
      wifi: { icon: '📶', label: 'High-speed Wi-Fi' },
      ac: { icon: '❄️', label: 'Air conditioning' },
      heating: { icon: '🔥', label: 'Heating' },
      kitchen: { icon: '🍳', label: 'Equipped kitchen' },
      washer: { icon: '🧺', label: 'Washing machine' },
      workspace: { icon: '💻', label: 'Work desk' },
      elevator: { icon: '🛗', label: 'Elevator' },
      gym: { icon: '🏋️', label: 'Gym access' },
      tv: { icon: '📺', label: 'Smart TV' },
      balcony: { icon: '🌇', label: 'Balcony' },
      metro: { icon: '🚇', label: 'Steps from metro' }
    }
  },
  whyHere: {
    eyebrow: 'WHY V PLUS',
    titleA: 'A ',
    titleAccent: 'Seamless',
    titleB: ' Expat Housing Solution.',
    desc: 'V Plus is the trusted leader in China relocation, having welcomed over 5,000+ international clients and students. Our dedicated team anticipates the unique needs of the expat community, streamlining every step from furnishing to ongoing support. We don’t just find you an apartment; we simplify your life in China.',
    subTitle: 'Expert Verified Services',
    cards: [
      { icon: 'globe', title: 'International Team.', desc: 'Our diverse team understands the unique needs of expats from around the world. We speak your language and guide you every step of the way.' },
      { icon: 'doc', title: 'Flexible Lease Terms.', desc: 'Whether you need a short stay or a long-term home, we offer lease options tailored to fit your plans. Enjoy the freedom to choose what works best for you.' },
      { icon: 'home', title: 'Furnished Flats.', desc: 'All our apartments managed by V Plus come fully furnished with modern essentials and stylish décor. Move in comfortably without worrying about a thing.' },
      { icon: 'chat', title: 'Ongoing Support.', desc: "Our dedicated support team is here to help throughout your stay. From maintenance to local advice, we've got you covered." }
    ]
  },
  getStarted: {
    eyebrow: 'GET STARTED',
    titleA: 'Ready to start your ',
    titleAccent: 'next chapter',
    titleB: '?',
    desc: 'Talk to our relocation experts today or keep exploring our curated city guides — we usually reply within 24 hours.',
    book: 'Book Now',
    whatsapp: 'WhatsApp ＆ Tel ＆WeChat',
    checks: ['No obligation', 'English-speaking team', 'Trusted by 5,000+ expats']
  },
  extraServices: {
    eyebrow: 'More Services',
    titleA: 'More than rentals — ',
    titleAccent: 'a full one-stop service.',
    footnote: 'Some services are paid value-added options. Contact us for details.',
    moreTitle: 'Need something else?',
    moreDesc: 'Visa, banking, insurance and daily-life errands — your personal relocation advisor has it covered.',
    moreCta: 'Talk to an advisor',
    cards: [
      { icon: 'video', title: 'Video Viewing Service' },
      { icon: 'plane', title: 'Airport Pickup Service' },
      { icon: 'passport', title: 'Accommodation Registration' },
      { icon: 'broom', title: 'House Cleaning Service' },
      { icon: 'truck', title: 'Local Moving Service' },
      { icon: 'briefcase', title: 'Office Rental Service' },
      { icon: 'house', title: 'Property Buying & Selling' }
    ]
  },
  footer: {
    desc: 'Move-in-ready homes and full relocation support across China — visa, bank, and everything in between.',
    email: 'hello@v-plus.house',
    phone: '+352 621780307',
    groups: [
      { title: 'Our Services.', links: ['Vacation Rentals', 'Serviced Apartments', 'Coliving & Short-Term', 'Relocation Services', 'Office & Retail', 'Property Transactions'] },
      { title: 'Tools & More.', links: ['Move Planner', 'Relocation Tools', 'Exclusive Deals', 'Internships', 'Become a Partner'] }
    ],
    legal: ['Privacy Policy', 'Cookie Policy', 'Terms & Conditions'],
    copyright: '© 2026 V Plus. All rights reserved.',
    language: 'English'
  },
  cookie: {
    text: '🍪 We use cookies to improve your browsing experience, analyze site traffic and personalize content.',
    reject: 'Reject',
    accept: 'Accept all'
  },
  // v8 粒子版首页内置文案（后端 site_texts.v8 可深合并覆盖）
  v8: {
    hero: {
      title: 'V PLUS',
      eyebrow: 'Apartments for Rent in Guangzhou – Expat Housing Solutions',
      lede: 'Move-in-ready apartments, villas and serviced homes across Guangzhou — all verified, fully furnished, and supported by an English-speaking team.',
      bodyEyebrow: 'Apartments for Rent in Guangzhou – Expat Housing Solutions',
      bodyLede: 'Move-in-ready apartments, villas and serviced homes across Guangzhou — all verified, fully furnished, and supported by an English-speaking team.',
      s2Eyebrow: 'Private Villa · Exclusive Pool',
      s2Title: 'POOL VILLA',
      s2Lede: 'Private pool villas for families who love space, sunshine and privacy — move in with just your suitcase.',
      s3Eyebrow: 'Lakeside Living · Quiet & Green',
      s3Title: 'LAKE VILLA',
      s3Lede: 'Wake up to tranquil lake views and greenery, a different pace of life in the heart of Guangzhou.',
      browse: 'Browse Homes',
      whatsapp: 'WhatsApp ＆ Tel ＆WeChat'
    },
    types: {
      eyebrow: 'FIND BY TYPE',
      title: 'Choose the home that fits your life',
      desc: 'Four curated residence types, from single studios to family villas — every listing is personally inspected.',
      view: 'View homes'
    },
    featured: {
      eyebrow: 'FEATURED LISTING',
      title: 'Hand-picked this week',
      desc: 'Our consultants curate the sharpest, best-located homes on the market — real photos, honest prices.',
      book: 'Book a Viewing',
      allText: 'All {n} listings',
      more: 'Show more homes',
      left: '{n} more',
      perMonth: '/ month',
      empty: 'No published listings yet. Please check back soon.',
      emptyFilter: 'No homes match all these conditions yet. Try a higher budget, more rooms or another district.',
      subFallback: '{br} · {area} ㎡'
    },
    process: {
      eyebrow: 'HOW IT WORKS',
      title: 'From inquiry to keys in four steps',
      steps: [
        { title: 'Tell us your needs', desc: 'Budget, districts, move-in date and school commute — a 10-minute chat gets us aligned.' },
        { title: 'Curated shortlist', desc: 'Within 24 hours you receive a hand-picked shortlist with real photos and floor plans.' },
        { title: 'Viewings & negotiation', desc: 'We schedule viewings around your time, accompany you on site and negotiate rent on your behalf.' },
        { title: 'Move in & support', desc: 'Contract, payment, registration and move-in checklist handled — plus ongoing aftercare in English.' }
      ]
    },
    finder: {
      eyebrow: 'FIND YOUR HOME',
      // 句段数组：普通字符串为文字，district/beds/budget 渲染为可点选胶囊
      line: ['I want to rent', 'beds', 'in', 'district', 'with a monthly budget of', 'budget', '.'],
      districtAny: 'Any district',
      bedsAny: 'Any layout',
      budgetAny: 'Any budget',
      beds: [
        { v: 1, label: 'a 1-bedroom' },
        { v: 2, label: 'a 2-bedroom' },
        { v: 3, label: 'a 3-bedroom' },
        { v: 4, label: 'a 4+ bedroom' }
      ],
      budgets: [
        { v: 6000, label: '¥6,000' },
        { v: 10000, label: '¥10,000' },
        { v: 15000, label: '¥15,000' },
        { v: 25000, label: '¥25,000' },
        { v: 40000, label: '¥40,000' }
      ],
      count: '{n} homes found',
      clear: 'Clear all',
      typeAsk: 'Any home type preference?',
      typeAny: 'Any type',
      findBtn: 'Find My Home',
      quiz: {
        trigger: 'Need a more detailed home search?',
        allHomes: 'Or browse all available homes?',
        title: 'Quick Home Finder',
        questions: [
          'Which area would you like to live in?',
          'What type of home do you prefer?',
          'How many bedrooms do you need?',
          'What is your ideal price range?'
        ],
        any: 'No preference'
      }
    },
    listings: {
      back: 'Back to home',
      title: 'Homes for you',
      empty: 'No homes match your filters. Try adjusting your search.'
    },
    team: {
      eyebrow: 'YOUR CONSULTANTS',
      title: 'The people who have your back',
      desc: 'Eight multilingual relocation consultants across Guangzhou — averaging 6 years of expat housing experience.'
    },
    cta: {
      footnote: 'Average response time under 2 hours · English / Cantonese / Mandarin'
    }
  }
}

const zh = {
  siteName: SITE_TITLE,
  nav: {
    logo: 'V Plus',
    menus: [
      { label: '首页', href: '#top' },
      {
        label: '房源',
        href: '/listings',
        subs: [
          { key: 'luxury', event: 'luxury', label: '豪华住宅' },
          { key: 'standard', event: 'standard', label: '普通住宅' },
          { key: 'student', event: 'student', label: '学生公寓' },
          { key: 'city', event: 'city', label: '城市公寓' }
        ]
      },
      { label: '地图找房', href: '/map' },
      {
        label: '其它服务',
        href: '#get-started',
        subs: [
          { key: 'video', label: '视频看房服务', img: '/images/extras/video.jpg' },
          { key: 'plane', label: '机场接机服务', img: '/images/extras/plane.jpg' },
          { key: 'passport', label: '住宿登记服务', img: '/images/extras/passport.jpg' },
          { key: 'broom', label: '房屋保洁服务', img: '/images/extras/broom.jpg' },
          { key: 'truck', label: '同城搬家服务', img: '/images/extras/truck.jpg' },
          { key: 'briefcase', label: '办公室租赁服务', img: '/images/extras/briefcase.jpg' },
          { key: 'house', label: '房屋买卖服务', img: '/images/extras/house.jpg' }
        ]
      },
      { label: '租房指南', href: '/guides' },
      {
        label: '联系我们',
        href: '#get-started',
        subs: [
          { key: 'email', icon: 'mail', label: '邮箱', value: 'hello@v-plus.house', href: 'mailto:hello@v-plus.house' },
          { key: 'phone', icon: 'phone', label: '电话', value: '+352 621780307', href: 'tel:+352621780307' },
          { key: 'whatsapp', icon: 'whatsapp', label: 'WhatsApp', value: '+352 621780307', href: 'https://wa.me/352621780307' },
          { key: 'wechat', icon: 'wechat', label: '微信', value: 'vplus-relocation' }
        ]
      }
    ],
    cta: '加入社群'
  },
  dream: {
    join: '联系我们',
    view: '查看房源',
    slideAria: '切换到第 {n} 套房源',
    features: [
      {
        title: '现代奢华舒适',
        text: '雅致室内、暖色灯光与开阔空间，每一处细节都为休息与放松而设计。'
      },
      {
        title: '私密轻松预订',
        text: '几分钟即可完成预订，全程顺畅，兼顾舒适、隐私与便利。'
      }
    ],
    slides: [
      {
        rating: '',
        img: HERO_HOME_IMG,
        titleA: 'V PLUS·HOME',
        titleB: 'Rentals for Expats',
        desc: '广州市专业外籍租赁服务团队\nLive Globally, Settle Local with V Plus',
        feature: {
          title: '服务流程',
          text: '需求沟通→房源推荐→预约看房→房源预订→合同签署→房屋交接→售后支持'
        }
      },
      {
        rating: '4.8 分（满分 5 分）',
        titleA: '林间木屋',
        titleB: '把一整片森林私有化',
        desc: '暮色漫过松林，整栋原木 A 形屋灯火通明——门前篝火噼啪、露台星光相伴，呼吸间尽是山间清冽空气。',
        feature: {
          title: '森林环抱',
          text: '高松与远山把小屋温柔围住，推门即见篝火与雪松香气，夜里整片星空都只为你点亮。'
        }
      },
      {
        rating: '5.0 分（满分 5 分）',
        titleA: '归舟湖畔',
        titleB: '灯火倒映的回家路',
        desc: '一叶扁舟划过暮色，岸边庄园灯火渐次亮起，把湖面铺成碎金——这是专属于你的归家仪式。',
        feature: {
          title: '私家湖岸码头',
          text: '出门就是私家湖岸与码头：清晨在薄雾中泛舟，入夜看灯火在水面随波轻晃。'
        }
      },
      {
        rating: '4.9 分（满分 5 分）',
        titleA: '泳池庄园',
        titleB: '每个夜晚都值得举杯',
        desc: '石墙暖灯、私家泳池与篝火盆——暮色里的度假级庄园，把寻常夜晚过成值得庆祝的时刻。',
        feature: {
          title: '私享恒温泳池',
          text: '恒温泳池正对庄园草坪，躺椅与篝火随时就位，深夜游泳和庭院派对都只属于你。'
        }
      },
      {
        rating: '4.7 分（满分 5 分）',
        titleA: '听海而居',
        titleB: '枕着浪声入睡的家',
        desc: '沙岸之上、木栈道尽头，一栋架空的海之屋在雾蓝暮色里亮着暖灯，潮声是这里唯一的背景音。',
        feature: {
          title: '一线海岸',
          text: '从架空露台一步踏上沙滩，无遮挡海景尽收眼底：枕浪而眠，迎海而起。'
        }
      }
    ]
  },
  ui: { from: '月租', perMonth: ' 起', view: '查看详情' },
  stats: [
    { value: '5,000+', label: '已服务住户' },
    { value: '98%', label: '客户满意度' },
    { value: '8', label: '服务语言' }
  ],
  team: {
    title: '有疑问？咨询 V PLUS',
    sub: '真人团队，WhatsApp & 微信快速回复',
    whatsapp: 'WhatsApp ＆ Tel ＆WeChat'
  },
  teamIntro: {
    overline: '团队介绍',
    titleLead: '照顾你的，始终是',
    titleAccent: '真实的人。',
    desc: '不是冷冰冰的平台，而是一支资深而精干的安家团队：用你的语言沟通，亲自验看每一间公寓；从第一次带看到在华居住的最后一个月，随时待命。',
    members: [
      { index: '01', name: '亚历克斯·诺维', role: '运营经理' },
      { index: '02', name: '苏菲·薛', role: '物业经理' },
      { index: '03', name: '丹尼尔·奥卡福', role: '带看专员' },
      { index: '04', name: '米娅·洛朗', role: '租约顾问' },
      { index: '05', name: '卢卡斯·迈耶', role: '维修主管' },
      { index: '06', name: '普里亚·奈尔', role: '客户体验主管' },
      { index: '07', name: '马可·贝利尼', role: '安家顾问' },
      { index: '08', name: '田中由纪', role: '社区经理' }
    ]
  },
  discover: {
    title: '探索我们精选的广州房源',
    mobileKicker: '房源类型',
    mobileTitle: '按类型挑选你的家',
    mobileSub: '选择一个类别，即刻查看精选房源。',
    mobileCount: '套精选房源',
    mobileBack: '返回类型选择',
    mobileAll: '查看全部房源',
    mobileAllHide: '收起全部房源',
    mobileAllCount: '套全部房源',
    tabs: [
      { key: 'liwan', label: '荔湾区', desc: '' },
      { key: 'tianhe', label: '天河区', desc: '珠江新城与天河路商圈所在的 CBD 核心，外籍家庭与城市白领聚居首选。' },
      { key: 'yuexiu', label: '越秀区', desc: '千年老城中心，公园名校环绕，1/2 号线直达，经典广州市井生活。' },
      { key: 'haizhu', label: '海珠区', desc: '珠江南岸宜居城区，高校林立，江畔社区安静、生活气息浓厚。' },
      { key: 'baiyun', label: '白云区', desc: '背靠白云山的生态城区，户型宽敞、性价比高，深受家庭租客欢迎。' },
      { key: 'huangpu', label: '黄埔区', desc: '东部科技创新高地，高层新社区与江景房源密集，适合长租。' },
      { key: 'panyu', label: '番禺区', desc: '南部大学城板块，合租单间集中、租金亲民，4 号线通勤便利。' },
      { key: 'zengcheng', label: '增城区', desc: '东部增城江高新走廊生态城区，新社区户型宽敞、租金更低，21 号线直达市中心。' }
    ],
    all: '全部区域',
    allDesc: '不限区域浏览广州全部精选房源，再按区域逐步收窄。',
    // 住宅类型仅由导航栏菜单切换
    types: [
      { key: 'luxury', label: '豪华住宅', desc: '高端公寓与顶层套房，坐拥城市天际线与精装品质。' },
      { key: 'standard', label: '普通住宅', desc: '成熟住宅小区的宽敞家庭户型，通勤生活两便利。' },
      { key: 'student', label: '学生公寓', desc: '高校周边合租单间与公寓，家具齐全、杂费全包。' },
      { key: 'city', label: '城市公寓', desc: '市中心服务式单间与 LOFT，紧邻地铁与商圈。' }
    ],
    // 学生公寓二级院校
    schools: [
      { key: 'scut-wushan', label: '华南理工大学（五山校区）' },
      { key: 'scut-intl', label: '华南理工大学（国际校区）' },
      { key: 'scnu-shipai', label: '华南师范大学（石牌校区）' },
      { key: 'gdut-dongfeng', label: '广东工业大学（东风路校区）' },
      { key: 'jnu-huawen', label: '暨南大学（华文学院）' },
      { key: 'jnu-shipai', label: '暨南大学（石牌校区）' },
      { key: 'gzmu', label: '广州航海学院' },
      { key: 'gdufs-baiyun', label: '广东外语外贸大学（白云山校区）' }
    ],
    schoolPickerTitle: '选择校区',
    schoolPickerSub: '选择你所在或意向的院校，查看周边学生公寓。',
    schoolPickerAll: '全部校区',
    schoolPickerClose: '关闭校区选择',
    areaPickerTitle: '选择区域',
    areaPickerSub: '选择意向区域，查看该区域的{type}房源。',
    areaPickerAll: '全部区域',
    areaPickerClose: '关闭区域选择',
    clearType: '清除住宅类型筛选',
    empty: '该板块房源即将上线，敬请期待。',
    emptyCombo: '当前区域暂无此类房源，可清除类型筛选或切换其他区域。',
    emptySchool: '该校区周边房源即将上线，敬请期待。'
  },
  properties: [],
  detail: {
    back: '返回房源列表',
    overview: '概览',
    galleryTitle: '更多照片',
    aboutTitle: '房源介绍',
    aboutText:
      '这套 {br} 公寓位于{district}，建筑面积 {area} m²，采光充足，家具家电齐全，拎包即可入住。由 V Plus 全程托管，装潢现代雅致，杂费（含水网）均已安排妥当；临近{metro}，出门即是便利的城市生活。',
    aboutTextNoArea:
      '这套 {br} 公寓位于{district}，采光充足，家具家电齐全，拎包即可入住。由 V Plus 全程托管，装潢现代雅致，杂费（含水网）均已安排妥当；临近{metro}，出门即是便利的城市生活。',
    amenitiesTitle: '配套设施',
    locationTitle: '位置与交通',
    locationText:
      '临近{metro}，超市、咖啡馆与 24 小时便利店都在生活圈内，日常采买轻松方便。',
    mapOpen: '在 Google 地图中查看',
    mapTitle: '周边位置地图',
    specs: {
      beds: '户型',
      baths: '卫生间',
      area: '建筑面积',
      minStay: '最短租期',
      available: '起租时间'
    },
    minStay: '3 个月',
    available: '随时入住',
    depositLabel: '押金',
    depositValue: '2 个月房租',
    leaseLabel: '租约',
    leaseValue: '灵活租约',
    ask: 'WhatsApp ＆ Tel ＆WeChat',
    amenities: {
      furnished: { icon: '🛋️', label: '家具齐全' },
      wifi: { icon: '📶', label: '高速 Wi-Fi' },
      ac: { icon: '❄️', label: '空调' },
      heating: { icon: '🔥', label: '暖气' },
      kitchen: { icon: '🍳', label: '整体厨房' },
      washer: { icon: '🧺', label: '洗衣机' },
      workspace: { icon: '💻', label: '办公书桌' },
      elevator: { icon: '🛗', label: '电梯' },
      gym: { icon: '🏋️', label: '健身房' },
      tv: { icon: '📺', label: '智能电视' },
      balcony: { icon: '🌇', label: '阳台' },
      metro: { icon: '🚇', label: '近地铁站' }
    }
  },
  whyHere: {
    eyebrow: '为什么选择 V PLUS',
    titleA: '为外籍人士提供',
    titleAccent: '无缝安居',
    titleB: '体验。',
    desc: 'V Plus 是值得信赖的在华安家服务领导者，已迎接超过 5,000 名国际客户与学生。我们专业的团队深谙外籍社群的独特需求，从家具配置到入住后的持续支持，精简每一个环节。我们不只是帮你找公寓，更是让你在中国的生活更简单。',
    subTitle: '专业认证服务',
    cards: [
      { icon: 'globe', title: '国际化团队', desc: '我们多元的团队了解来自世界各地外籍人士的独特需求，用你的语言沟通，全程为你指引。' },
      { icon: 'doc', title: '灵活租约条款', desc: '无论短住还是长居，我们都能提供契合你计划的租约方案，自由选择最适合你的方式。' },
      { icon: 'home', title: '家具齐全公寓', desc: '所有由 V Plus 托管的公寓均配备现代必需品与时尚装潢，拎包即可舒适入住，无需费心。' },
      { icon: 'chat', title: '全程持续支持', desc: '专属支持团队在你居住期间随时待命，从维修养护到本地生活建议，我们一应关照。' }
    ]
  },
  getStarted: {
    eyebrow: '立即开始',
    titleA: '准备好开启你的',
    titleAccent: '新篇章',
    titleB: '了吗？',
    desc: '立即与我们的安家顾问交流，或继续浏览精心整理的城市指南 —— 我们通常在 24 小时内回复。',
    book: '立即预订',
    whatsapp: 'WhatsApp ＆ Tel ＆WeChat',
    checks: ['无任何强制义务', '英文服务团队', '5,000+ 外籍人士信赖之选']
  },
  extraServices: {
    eyebrow: '其它服务',
    titleA: '不止租房，',
    titleAccent: '一站式全套服务.',
    footnote: '部分内容为增值付费服务，详情请咨询',
    moreTitle: '还有别的需求？',
    moreDesc: '签证、银行、保险与各类生活琐事，交给你的专属安家顾问一站办妥。',
    moreCta: '联系顾问',
    cards: [
      { icon: 'video', title: '视频看房服务' },
      { icon: 'plane', title: '机场接机服务' },
      { icon: 'passport', title: '住宿登记服务' },
      { icon: 'broom', title: '房屋保洁服务' },
      { icon: 'truck', title: '同城搬家服务' },
      { icon: 'briefcase', title: '办公室租赁服务' },
      { icon: 'house', title: '房屋买卖服务' }
    ]
  },
  footer: {
    desc: '覆盖中国主要城市的拎包入住房源与全方位安家服务 —— 签证、银行及生活琐事一站搞定。',
    email: 'hello@v-plus.house',
    phone: '+352 621780307',
    groups: [
      { title: '我们的服务', links: ['度假短租', '服务式公寓', '合租与短租', '安家服务', '办公与商铺', '房产交易'] },
      { title: '工具与更多', links: ['搬家计划', '安家工具', '专属优惠', '实习项目', '成为合作伙伴'] }
    ],
    legal: ['隐私政策', 'Cookie 政策', '条款与细则'],
    copyright: '© 2026 V Plus. 保留所有权利。',
    language: 'English'
  },
  cookie: {
    text: '🍪 我们使用 Cookie 来提升浏览体验、分析网站流量并提供个性化内容。',
    reject: '拒绝',
    accept: '全部接受'
  },
  // v8 粒子版首页内置文案（后端 site_texts.v8 可深合并覆盖）
  v8: {
    hero: {
      title: 'V PLUS',
      eyebrow: '广州外籍人士安家服务',
      lede: '覆盖广州全城的精装公寓、别墅与服务式住宅，全部实地核验、拎包入住，由中英双语团队全程服务。',
      bodyEyebrow: '广州外籍人士安家服务',
      bodyLede: '覆盖广州全城的精装公寓、别墅与服务式住宅，全部实地核验、拎包入住，由中英双语团队全程服务。',
      s2Eyebrow: '私家别墅 · 专属泳池',
      s2Title: '泳池别墅',
      s2Lede: '带私人泳池的独栋别墅，给热爱阳光与空间的家庭，拎包即可入住。',
      s3Eyebrow: '湖畔生活 · 静谧自然',
      s3Title: '湖景别墅',
      s3Lede: '推窗即见湖光与绿意，在广州中心体验另一种慢节奏生活。',
      browse: '浏览房源',
      whatsapp: 'WhatsApp ＆ Tel ＆WeChat'
    },
    types: {
      eyebrow: '按户型找房',
      title: '找到契合你生活方式的家',
      desc: '四类精选住宅，从单人开间到家庭别墅，每套房源都由顾问实地核验。',
      view: '查看房源'
    },
    featured: {
      eyebrow: '本周精选',
      title: '顾问手工甄选',
      desc: '我们每周从市场上挑选性价比与位置最出色的房源，真实照片、透明价格。',
      book: '预约看房',
      allText: '全部 {n} 套房源',
      more: '展开更多房源',
      left: '还有 {n} 套',
      perMonth: '/ 月',
      empty: '暂无已发布房源，敬请期待。',
      emptyFilter: '没有同时满足这些条件的房源，试试放宽预算、增加房间数或换个区域。',
      subFallback: '{br} · {area} ㎡'
    },
    process: {
      eyebrow: '服务流程',
      title: '四步完成，从咨询到拿到钥匙',
      steps: [
        { title: '说出你的需求', desc: '预算、区域、入住时间与校区通勤，10 分钟沟通即可对齐方向。' },
        { title: '专属房源清单', desc: '24 小时内收到手工筛选的房源清单，含真实照片与户型信息。' },
        { title: '看房与议价', desc: '按你的时间安排看房、全程陪同，并代表你与房东议价。' },
        { title: '入住与售后', desc: '合同、付款、住宿登记与入住验收一站办妥，入住后双语售后持续在线。' }
      ]
    },
    finder: {
      eyebrow: '一句话找房',
      // 句段数组：普通字符串为文字，district/beds/budget 渲染为可点选胶囊
      line: ['我想在', 'district', '租一间', 'beds', '的房子，我的月预算是', 'budget', '。'],
      districtAny: '全部区域',
      bedsAny: '不限户型',
      budgetAny: '不限预算',
      beds: [
        { v: 1, label: '一房一厅' },
        { v: 2, label: '两房一厅' },
        { v: 3, label: '三房两厅' },
        { v: 4, label: '四房及以上' }
      ],
      budgets: [
        { v: 6000, label: '¥6,000' },
        { v: 10000, label: '¥10,000' },
        { v: 15000, label: '¥15,000' },
        { v: 25000, label: '¥25,000' },
        { v: 40000, label: '¥40,000' }
      ],
      count: '为你找到 {n} 套房源',
      clear: '清除条件',
      typeAsk: '有房型要求吗？',
      typeAny: '不限房型',
      findBtn: '帮我找房',
      quiz: {
        trigger: '需要更详细的筛选房屋？',
        allHomes: '或者查看当前全部房源？',
        title: '快速找房',
        questions: [
          '您希望住在哪个区域？',
          '您希望您的房型是什么？',
          '您希望您的房间数规格是？',
          '您的理想价格是？'
        ],
        any: '不限'
      }
    },
    listings: {
      back: '返回首页',
      title: '为你找到的房源',
      empty: '当前条件下暂无房源，试试调整筛选条件。'
    },
    team: {
      eyebrow: '你的安家顾问',
      title: '全程为你托底的人',
      desc: '8 位多语安家顾问分布广州各片区，平均拥有 6 年外籍人士租房服务经验。'
    },
    cta: {
      footnote: '平均 2 小时内回复 · 英语 / 粤语 / 普通话'
    }
  }
}

const ja = {
  siteName: SITE_TITLE,
  nav: {
    logo: 'V Plus',
    menus: [
      { label: 'ホーム', href: '#top' },
      {
        label: '物件',
        href: '/listings',
        subs: [
          { key: 'luxury', event: 'luxury', label: '高級住宅' },
          { key: 'standard', event: 'standard', label: '一般住宅' },
          { key: 'student', event: 'student', label: '学生マンション' },
          { key: 'city', event: 'city', label: 'シティアパート' }
        ]
      },
      { label: 'マップ検索', href: '/map' },
      {
        label: 'その他のサービス',
        href: '#get-started',
        subs: [
          { key: 'video', label: 'オンライン内見', img: '/images/extras/video.jpg' },
          { key: 'plane', label: '空港送迎', img: '/images/extras/plane.jpg' },
          { key: 'passport', label: '宿泊登記手続き', img: '/images/extras/passport.jpg' },
          { key: 'broom', label: 'ハウスクリーニング', img: '/images/extras/broom.jpg' },
          { key: 'truck', label: '引越しサービス', img: '/images/extras/truck.jpg' },
          { key: 'briefcase', label: 'オフィス賃貸', img: '/images/extras/briefcase.jpg' },
          { key: 'house', label: '不動産売買', img: '/images/extras/house.jpg' }
        ]
      },
      { label: '賃貸ガイド', href: '/guides' },
      {
        label: 'お問い合わせ',
        href: '#get-started',
        subs: [
          { key: 'email', icon: 'mail', label: 'メール', value: 'hello@v-plus.house', href: 'mailto:hello@v-plus.house' },
          { key: 'phone', icon: 'phone', label: '電話', value: '+352 621780307', href: 'tel:+352621780307' },
          { key: 'whatsapp', icon: 'whatsapp', label: 'WhatsApp', value: '+352 621780307', href: 'https://wa.me/352621780307' },
          { key: 'wechat', icon: 'wechat', label: 'WeChat', value: 'vplus-relocation' }
        ]
      }
    ],
    cta: 'コミュニティに参加'
  },
  dream: {
    join: 'お問い合わせ',
    view: '物件を見る',
    slideAria: '{n}番目の物件へ',
    features: [
      {
        title: 'モダンで贅沢な快適さ',
        text: '洗練された内装、温かみのある照明、開放的な空間。休息とリラックスのためにデザインされた、上質な滞在をお楽しみください。'
      },
      {
        title: '簡単でプライベートな予約',
        text: '数分でアパートを予約。快適さ、プライバシー、利便性を追求した、スムーズな滞在を体験できます。'
      }
    ],
    slides: [
      {
        rating: '',
        img: HERO_HOME_IMG,
        titleA: 'V PLUS·HOME',
        titleB: 'Rentals for Expats',
        desc: '広州発・外国人専門賃貸サービス\nLive Globally, Settle Local with V Plus',
        feature: {
          title: 'サービスの流れ',
          text: 'ニーズヒアリング→物件提案→内見予約→仮予約→契約締結→引き渡し→アフターサポート'
        }
      },
      {
        rating: '4.8 / 5.0',
        titleA: '森のコテージ',
        titleB: '森を独り占め',
        desc: '松の木々に夕暮れが差し込むと、原木造りのAフレームハウスが暖かく灯り始める。焚き火の音、星空のテラス、そして山の空気だけが、あなたを包み込む。',
        feature: {
          title: '森に囲まれて',
          text: '高い松と遠くの山々がコテージを優しく囲む。テラスに出れば焚き火とヒノキの香り、夜空には星が一面に広がる。'
        }
      },
      {
        rating: '5.0 / 5.0',
        titleA: '湖畔の灯火',
        titleB: '灯りが映る帰り道',
        desc: 'ボートで夕暮れの湖を漕ぎ進むと、岸辺の別荘の灯りが一つずつ点り、湖面を黄金色に染めていく——それはあなただけの帰宅の儀式。',
        feature: {
          title: '専用湖岸ドック',
          text: 'ドアを出ればすぐ専用の湖岸とボートドック。朝は靄の中でボートを漕ぎ、夜は灯りが水面にゆらめく。'
        }
      },
      {
        rating: '4.9 / 5.0',
        titleA: 'プール付き邸宅',
        titleB: '毎晩が祝いの晩',
        desc: '石張りの壁、暖かいランプ、専用プールに焚き火ボウル——リゾート級の邸宅で、日常の夜を祝いのひとときに変える。',
        feature: {
          title: '専用温水プール',
          text: '温水プールは芝生の庭に面し、ラウンジャーと焚き火ボウルが常備。真夜中のスイムも庭でのパーティーも、すべてあなただけのもの。'
        }
      },
      {
        rating: '4.7 / 5.0',
        titleA: '海辺の家',
        titleB: '波の音に抱かれて眠る家',
        desc: '砂浜の上、木道の突き当たりに佇む海の家。靄がかかった夕暮れに柔らかく灯りをともし、潮の音だけが背景音となる。',
        feature: {
          title: '完全なる海辺',
          text: '高床式テラスから砂浜へ一歩。遮るもののない海を眺め、波に枕を寄せ、海を感じながら目覚める。'
        }
      }
    ]
  },
  ui: { from: '月額', perMonth: '～', view: '詳細を見る' },
  stats: [
    { value: '5,000+', label: 'ご利用者数' },
    { value: '98%', label: '顧客満足度' },
    { value: '8', label: '対応言語' }
  ],
  team: {
    title: 'ご質問は V PLUS へ',
    sub: '担当者が直接、WhatsApp＆WeChatで素早く返信します',
    whatsapp: 'WhatsApp ＆ Tel ＆WeChat'
  },
  teamIntro: {
    overline: 'チーム紹介',
    titleLead: 'あなたをサポートするのは',
    titleAccent: '生身の人間です。',
    desc: '顔の見えないプラットフォームではありません。少数精鋭の引越し専門チームが、あなたの言語で対応し、物件を一つひとつ直接確認。最初の内見から中国での最後の月まで、いつでも対応可能です。',
    members: [
      { index: '01', name: 'アレックス・ノヴィ', role: 'オペレーションマネージャー' },
      { index: '02', name: 'ソフィー・シュエ', role: 'プロパティマネージャー' },
      { index: '03', name: 'ダニエル・オカフォー', role: '内見スペシャリスト' },
      { index: '04', name: 'ミア・ローラン', role: '賃貸コンサルタント' },
      { index: '05', name: 'ルーカス・マイヤー', role: 'メンテナンス責任者' },
      { index: '06', name: 'プリヤ・ナイル', role: 'カスタマーエクスペリエンス責任者' },
      { index: '07', name: 'マルコ・ベリーニ', role: '入居アドバイザー' },
      { index: '08', name: 'ユキ・タナカ', role: 'コミュニティマネージャー' }
    ]
  },
  discover: {
    title: '広州で厳選した物件を探す',
    mobileKicker: '物件タイプ',
    mobileTitle: 'ここから、あなたの家探しを始めよう',
    mobileSub: 'カテゴリーを選んで、注目の物件をチェック',
    mobileCount: '件の物件',
    mobileBack: 'タイプ選択に戻る',
    mobileAll: 'すべての物件を見る',
    mobileAllHide: 'すべての物件を閉じる',
    mobileAllCount: '件すべて',
    tabs: [
      { key: 'liwan', label: '荔湾区', desc: '' },
      { key: 'tianhe', label: '天河区', desc: '珠江新城と天河路商圏があるCBDの中心地。外国人家庭や若手ビジネスパーソンに人気のエリア。' },
      { key: 'yuexiu', label: '越秀区', desc: '歴史ある旧市街地で、公園や名門校が点在。地下鉄1号線・2号線が通り、広州らしい日常が楽しめる。' },
      { key: 'haizhu', label: '海珠区', desc: '珠江の南に広がる緑豊かなエリア。大学が多く、閑静な団地が並ぶ。' },
      { key: 'baiyun', label: '白云区', desc: '白云山の麓に広がるグリーンベルト。間取りが広くコスパが良く、ファミリーに人気。' },
      { key: 'huangpu', label: '黄埔区', desc: '東部に位置する成長著しいテック拠点。近代的な高層団地と川沿いの物件が充実。' },
      { key: 'panyu', label: '番禺区', desc: '南部の大学街・シェアハウスエリア。4号線沿いで、キャンパスからすぐのリーズナブルな物件が豊富。' },
      { key: 'zengcheng', label: '增城区', desc: '東部の増江ハイテク回廊周辺に広がるグリーンエリア。新築団地が多く家賃が抑えめ。21号線で市中心まで直通。' }
    ],
    all: 'すべてのエリア',
    allDesc: 'エリアを限定せず、広州全市の厳選物件を閲覧してから絞り込めます。',
    types: [
      { key: 'luxury', label: '高級住宅', desc: '高層階の眺望と上質な設備を備えた、ハイエンドなアパートやペントハウス。' },
      { key: 'standard', label: '一般住宅', desc: '成熟した住宅街にある、ファミリー向けの広々とした物件。通勤にも便利。' },
      { key: 'student', label: '学生マンション', desc: 'キャンパス周辺の個室・シェアハウス。家具付きで光熱費込み。' },
      { key: 'city', label: 'シティアパート', desc: '市中心部のサービス付きワンルームやロフト。地下鉄やショッピングモールのすぐそば。' }
    ],
    schools: [
      { key: 'scut-wushan', label: '華南理工大学（五山キャンパス）' },
      { key: 'scut-intl', label: '華南理工大学（国際キャンパス）' },
      { key: 'scnu-shipai', label: '華南師範大学（石牌キャンパス）' },
      { key: 'gdut-dongfeng', label: '広東工業大学（東風路キャンパス）' },
      { key: 'jnu-huawen', label: '暨南大学（華文学院）' },
      { key: 'jnu-shipai', label: '暨南大学（石牌キャンパス）' },
      { key: 'gzmu', label: '広州海事学院' },
      { key: 'gdufs-baiyun', label: '広東外国語外貿大学（白云山キャンパス）' }
    ],
    schoolPickerTitle: 'キャンパスを選択',
    schoolPickerSub: '通学・志望のキャンパスを選び、周辺の学生マンションを検索できます。',
    schoolPickerAll: 'すべてのキャンパス',
    schoolPickerClose: 'キャンパス選択を閉じる',
    areaPickerTitle: 'エリアを選択',
    areaPickerSub: 'エリアを選んで、その地域の{type}物件をご覧ください。',
    areaPickerAll: 'すべてのエリア',
    areaPickerClose: 'エリア選択を閉じる',
    clearType: 'タイプの絞り込みを解除',
    empty: 'このカテゴリーの物件は近日公開予定です。しばらくお待ちください。',
    emptyCombo: 'このエリアには現在このタイプの物件がありません。タイプ絞り込みを解除するか、別のエリアをお選びください。',
    emptySchool: 'このキャンパス周辺の物件は近日公開予定です。しばらくお待ちください。'
  },
  properties: [],
  detail: {
    back: '物件一覧に戻る',
    overview: '概要',
    galleryTitle: '写真をもっと見る',
    aboutTitle: 'この物件について',
    aboutText:
      'この{br}アパートは{district}に位置し、専有面積{area}㎡の明るく家具付きの住空間です。V Plusが一貫して管理し、最新の設備と洗練された内装、すべての公共料金を手配済み。{metro}が目の前で、街まですぐです。',
    aboutTextNoArea:
      'この{br}アパートは{district}に位置し、明るく家具付きの住空間です。V Plusが一貫して管理し、最新の設備と洗練された内装、すべての公共料金を手配済み。{metro}が目の前で、街まですぐです。',
    amenitiesTitle: '設備・アメニティ',
    locationTitle: '立地と交通',
    locationText:
      '{metro}のすぐ近く。スーパー、カフェ、24時間営業のコンビニも徒歩圏内で、日常の買い物に困りません。',
    mapOpen: 'Googleマップで開く',
    mapTitle: '周辺エリアの地図',
    specs: {
      beds: '間取り',
      baths: 'バスルーム',
      area: '専有面積',
      minStay: '最短契約期間',
      available: '入居可能時期'
    },
    minStay: '3ヶ月',
    available: '即入居可',
    depositLabel: '敷金',
    depositValue: '家賃2ヶ月分',
    leaseLabel: '契約',
    leaseValue: 'フレキシブル契約',
    ask: 'WhatsApp ＆ Tel ＆WeChat',
    amenities: {
      furnished: { icon: '🛋️', label: '家具付き' },
      wifi: { icon: '📶', label: '高速Wi-Fi' },
      ac: { icon: '❄️', label: 'エアコン' },
      heating: { icon: '🔥', label: '暖房' },
      kitchen: { icon: '🍳', label: 'キッチン設備' },
      washer: { icon: '🧺', label: '洗濯機' },
      workspace: { icon: '💻', label: 'ワークデスク' },
      elevator: { icon: '🛗', label: 'エレベーター' },
      gym: { icon: '🏋️', label: 'ジム利用可' },
      tv: { icon: '📺', label: 'スマートTV' },
      balcony: { icon: '🌇', label: 'バルコニー' },
      metro: { icon: '🚇', label: '地下鉄駅近く' }
    }
  },
  whyHere: {
    eyebrow: 'V PLUSが選ばれる理由',
    titleA: '外国人のための',
    titleAccent: 'シームレスな',
    titleB: '住まいソリューション。',
    desc: 'V Plusは中国での引越しサービスのリーディングカンパニーとして、5,000名以上の外国人客户・学生をお迎えしてきました。専門チームが外国人コミュニティの特有のニーズを先回りし、家具の手配からアフターサポートまで、すべてのステップを効率化します。私たちはただアパートを探すだけでなく、中国での生活をシンプルにします。',
    subTitle: '専門家が認めたサービス',
    cards: [
      { icon: 'globe', title: '国際色豊かなチーム', desc: '多様なメンバーが世界中の外国人のニーズを理解し、あなたの言語でサポートします。' },
      { icon: 'doc', title: '柔軟な契約条件', desc: '短期滞在でも長期入居でも、あなたのプランに合わせた契約オプションを用意しています。' },
      { icon: 'home', title: '家具付きアパート', desc: 'V Plus管理のアパートはすべて、現代的な必需品とおしゃれな内装付き。荷物を運ぶだけで快適に住めます。' },
      { icon: 'chat', title: '継続的なサポート', desc: '専任サポートチームが滞在中ずっと対応。メンテナンスから現地のアドバイスまで、お任せください。' }
    ]
  },
  getStarted: {
    eyebrow: '始めよう',
    titleA: '次の章を始める',
    titleAccent: '準備はできていますか',
    titleB: '？',
    desc: '今すぐ引越しの専門家に相談するか、厳選された都市ガイドを読み続けてください——通常24時間以内に返信します。',
    book: '今すぐ予約',
    whatsapp: 'WhatsApp ＆ Tel ＆WeChat',
    checks: ['義務なし', '日本語対応チーム', '5,000人以上の外国人が信頼']
  },
  extraServices: {
    eyebrow: 'その他のサービス',
    titleA: '賃貸だけでなく、',
    titleAccent: 'ワンストップで。',
    footnote: '一部サービスは有料のオプションです。詳細はお問い合わせください。',
    moreTitle: '他に必要なものはありますか？',
    moreDesc: 'ビザ、銀行、保険、日常の雑用まで——専属の引越しアドバイザーがすべてカバーします。',
    moreCta: 'アドバイザーに相談',
    cards: [
      { icon: 'video', title: 'オンライン内見' },
      { icon: 'plane', title: '空港送迎' },
      { icon: 'passport', title: '宿泊登記手続き' },
      { icon: 'broom', title: 'ハウスクリーニング' },
      { icon: 'truck', title: '引越しサービス' },
      { icon: 'briefcase', title: 'オフィス賃貸' },
      { icon: 'house', title: '不動産売買' }
    ]
  },
  footer: {
    desc: '中国全土で、荷物を運ぶだけで住める物件と充実の引越しサポート——ビザ、銀行、その他の雑用もワンストップで。',
    email: 'hello@v-plus.house',
    phone: '+352 621780307',
    groups: [
      { title: 'サービス', links: ['バケーションレンタル', 'サービス付きアパート', 'シェアハウス・短期', '引越しサービス', 'オフィス・店舗', '不動産取引'] },
      { title: 'ツール等', links: ['引越しプランナー', '引越しツール', '限定特典', 'インターンシップ', 'パートナー募集'] }
    ],
    legal: ['プライバシーポリシー', 'Cookieポリシー', '利用規約'],
    copyright: '© 2026 V Plus. All rights reserved.',
    language: 'English'
  },
  cookie: {
    text: '🍪 当サイトでは、ブラウジング体験の向上、サイトトラフィックの分析、コンテンツのパーソナライズのためにCookieを使用しています。',
    reject: '拒否する',
    accept: 'すべて許可'
  },
  v8: {
    hero: {
      title: 'V PLUS',
      eyebrow: '広州の賃貸アパート – 外国人向け住まいソリューション',
      lede: '広州全市の家具付きアパート、ヴィラ、サービス付き住宅。すべて実際に確認済み、家具完備、日本語対応チームがサポートします。',
      bodyEyebrow: '広州の賃貸アパート – 外国人向け住まいソリューション',
      bodyLede: '広州全市の家具付きアパート、ヴィラ、サービス付き住宅。すべて実際に確認済み、家具完備、日本語対応チームがサポートします。',
      s2Eyebrow: 'プライベートヴィラ · 専用プール',
      s2Title: 'プールヴィラ',
      s2Lede: '専用プール付きの独立型ヴィラ。陽光と広さを愛するご家族に、荷物だけですぐ入居できます。',
      s3Eyebrow: '湖畔の暮らし · 静けさと緑',
      s3Title: 'レイクヴィラ',
      s3Lede: '窓を開ければ湖と緑。広州の中心で、もう一つのゆったりとした生活を。',
      browse: '物件を探す',
      whatsapp: 'WhatsApp ＆ Tel ＆WeChat'
    },
    types: {
      eyebrow: 'タイプから探す',
      title: 'あなたの暮らしに合う家を選ぼう',
      desc: 'ワンルームからファミリー向けヴィラまで、4タイプの厳選物件。すべてコンサルタントが直接確認しています。',
      view: '物件を見る'
    },
    featured: {
      eyebrow: '注目の物件',
      title: '今週のセレクション',
      desc: 'コンサルタントが市場から厳選した、立地とコスパに優れた物件。実際の写真、正直な価格。',
      book: '内見予約',
      allText: '全{n}件の物件',
      more: 'もっと見る',
      left: 'あと{n}件',
      perMonth: '/ 月',
      empty: '現在公開中の物件はありません。しばらくお待ちください。',
      emptyFilter: '条件に合う物件が見つかりません。予算を上げるか、部屋数を増やすか、別のエリアをお試しください。',
      subFallback: '{br} · {area} ㎡'
    },
    process: {
      eyebrow: 'サービスの流れ',
      title: 'お問い合わせから鍵の受け取りまで4ステップ',
      steps: [
        { title: 'ニーズを教えてください', desc: '予算、エリア、入居日、通学通勤路——10分のヒアリングで方向性を決めます。' },
        { title: '厳選リストをお届け', desc: '24時間以内に、実際の写真と間取り図付きの物件リストをお送りします。' },
        { title: '内見と価格交渉', desc: 'あなたの都合に合わせて内見を手配し、同行して家賃交渉も代行します。' },
        { title: '入居とサポート', desc: '契約、支払い、宿泊登記、入居チェックまで一括対応。入居後も日本語でサポートします。' }
      ]
    },
    finder: {
      eyebrow: 'ひとことで家探し',
      line: ['で', 'district', 'の', 'beds', 'を借りたい。予算は月', 'budget', 'です。'],
      districtAny: 'エリア指定なし',
      bedsAny: '間取り指定なし',
      budgetAny: '予算指定なし',
      beds: [
        { v: 1, label: '1ベッドルーム' },
        { v: 2, label: '2ベッドルーム' },
        { v: 3, label: '3ベッドルーム' },
        { v: 4, label: '4ベッドルーム以上' }
      ],
      budgets: [
        { v: 6000, label: '¥6,000' },
        { v: 10000, label: '¥10,000' },
        { v: 15000, label: '¥15,000' },
        { v: 25000, label: '¥25,000' },
        { v: 40000, label: '¥40,000' }
      ],
      count: '{n}件の物件が見つかりました',
      clear: '条件をクリア',
      typeAsk: 'タイプの希望はありますか？',
      typeAny: 'タイプ不限',
      findBtn: '物件を探す',
      quiz: {
        trigger: 'もっと詳しい条件で探しますか？',
        allHomes: 'または、現在の全物件を見てみますか？',
        title: 'かんたん物件探し',
        questions: [
          'どのエリアに住みたいですか？',
          'どんなタイプの住まいをご希望ですか？',
          '必要な部屋数は？',
          'ご希望の価格帯は？'
        ],
        any: 'こだわらない'
      }
    },
    listings: {
      back: 'ホームに戻る',
      title: 'あなたのための物件',
      empty: '条件に合う物件が見つかりません。検索条件を調整してみてください。'
    },
    team: {
      eyebrow: 'あなたのコンサルタント',
      title: '最後まであなたを支える人たち',
      desc: '広州各地に在籍する8人の多言語対応コンサルタント。外国人向け住まいの経験は平均6年以上です。'
    },
    cta: {
      footnote: '平均返信時間2時間以内 · 日本語 / 英語 / 広東語 / 北京語'
    }
  }
}

export const iciContent = { en, zh, ja }
