import SmartImage from '../common/SmartImage.jsx'

/* 服务卡片网格（一比一复刻参考布局）：
   浅灰区块底 + 4 列白色圆角卡片 —— 第 2 列为纵跨两行的通高卡
   （标题 + 橙色大数字 + 标题 + 大图），其余三列各为「上图卡 + 矮卡」，
   矮卡配简单图形（描边数字框 / 对勾 / 斜体大字）。
   仅复刻样式结构，文案与图片均为站内房产内容。 */

const T = {
  zh: {
    title: '选择 V PLUS 的理由',
    c1a: '真实房源实拍', c1b: '0 中介费',
    c2a: '全天候管家在线', c2big: '7×24', c2b: '海量优质房源',
    c3a: '专属顾问带看', c3b: '官方认证房源',
    c4a: '安家好礼相赠', c4b: '专车免费带看', c4big: '¥0'
  },
  en: {
    title: 'Why choose V PLUS',
    c1a: 'Real photo listings', c1b: 'Zero agency fee',
    c2a: 'Always-on concierge', c2big: '7×24', c2b: 'Curated quality homes',
    c3a: 'One-on-one consultant', c3b: 'Verified homes',
    c4a: 'Settling-in gifts', c4b: 'Free viewing shuttle', c4big: '¥0'
  },
  ja: {
    title: 'V PLUS を選ぶ理由',
    c1a: '実撮影の物件', c1b: '手数料 0 円',
    c2a: '24 時間コンシェルジュ', c2big: '7×24', c2b: '厳選物件を多数掲載',
    c3a: '専属コンサルタント', c3b: '公式認証物件',
    c4a: '入居特典プレゼント', c4b: '無料送迎付き内見', c4big: '¥0'
  }
}

export default function V8ServiceCards({ lang = 'zh' }) {
  const t = T[lang] || T.zh
  return (
    <div className="v8-svc">
      <h3 className="v8-svc__title">{t.title}</h3>
      <div className="v8-svc__grid">
        {/* 列 1：上图卡 + 矮卡（描边数字框图形） */}
        <div className="v8-svc__col">
          <div className="v8-svc__card v8-svc__card--img">
            <span className="v8-svc__card-t">{t.c1a}</span>
            <SmartImage src="/images/listing-family.jpg" alt="" />
          </div>
          <div className="v8-svc__card v8-svc__card--mini">
            <span className="v8-svc__card-t">{t.c1b}</span>
            <span className="v8-svc__pct" aria-hidden="true"><b>0</b><i>%</i></span>
          </div>
        </div>

        {/* 列 2：纵跨两行的通高卡 */}
        <div className="v8-svc__card v8-svc__card--tall">
          <span className="v8-svc__card-t">{t.c2a}</span>
          <span className="v8-svc__big" aria-hidden="true">{t.c2big}</span>
          <span className="v8-svc__card-t v8-svc__card-t--mid">{t.c2b}</span>
          <span className="v8-svc__tallimg"><SmartImage src="/images/listing-studio.jpg" alt="" /></span>
        </div>

        {/* 列 3：上图卡 + 矮卡（对勾图形） */}
        <div className="v8-svc__col">
          <div className="v8-svc__card v8-svc__card--img">
            <span className="v8-svc__card-t">{t.c3a}</span>
            <SmartImage src="/images/listing-penthouse.jpg" alt="" />
          </div>
          <div className="v8-svc__card v8-svc__card--mini">
            <span className="v8-svc__card-t">{t.c3b}</span>
            <span className="v8-svc__check" aria-hidden="true">✓</span>
          </div>
        </div>

        {/* 列 4：上图卡 + 矮卡（斜体大字图形） */}
        <div className="v8-svc__col">
          <div className="v8-svc__card v8-svc__card--img">
            <span className="v8-svc__card-t">{t.c4a}</span>
            <SmartImage src="/images/listing-student1.jpg" alt="" />
          </div>
          <div className="v8-svc__card v8-svc__card--mini">
            <span className="v8-svc__card-t">{t.c4b}</span>
            <span className="v8-svc__free" aria-hidden="true">{t.c4big}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
