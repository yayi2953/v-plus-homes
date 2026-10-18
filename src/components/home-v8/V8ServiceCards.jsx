/* 服务卡片网格（复刻 DJI 商城「选购理由」布局，无图片版）：
   4 列白色圆角卡片，各列上下卡高度比保持既有比例：
   列1/3 上下各 50%、列2 矮数字卡+高卡(33/67)、列4 高卡+矮卡(67/33)；
   矮卡配简单图形（描边数字框 / 对勾 / 斜体大字），卡内文字垂直居中。 */

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
        {/* 列 1：上卡(50) + 矮卡(50)，描边数字框图形 */}
        <div className="v8-svc__col">
          <div className="v8-svc__card v8-svc__card--img v8-svc__card--photog">
            <span className="v8-svc__card-t">{t.c1a}</span>
            <span className="v8-svc__imgbox"><img src="/images/photographer.jpg?v=5" alt="" loading="lazy" /></span>
          </div>
          <div className="v8-svc__card v8-svc__card--mini">
            <span className="v8-svc__card-t">{t.c1b}</span>
            <span className="v8-svc__pct" aria-hidden="true"><b>0</b><i>%</i></span>
          </div>
        </div>

        {/* 列 2：矮数字卡(33) + 高卡(67)，橙色特大数字 */}
        <div className="v8-svc__col">
          <div className="v8-svc__card v8-svc__card--mini v8-svc__card--num">
            <span className="v8-svc__card-t">{t.c2a}</span>
            <span className="v8-svc__big" aria-hidden="true">{t.c2big}</span>
          </div>
          <div className="v8-svc__card v8-svc__card--img v8-svc__card--skyline">
            <span className="v8-svc__card-t">{t.c2b}</span>
            <span className="v8-svc__imgbox"><img src="/images/skyline.jpg" alt="" loading="lazy" /></span>
          </div>
        </div>

        {/* 列 3：上卡(50) 文案置顶+顾问半身照，矮卡(50) 对勾图形 */}
        <div className="v8-svc__col">
          <div className="v8-svc__card v8-svc__card--img v8-svc__card--person">
            <span className="v8-svc__card-t">{t.c3a}</span>
            <span className="v8-svc__imgbox"><img src="/images/consultant.jpg" alt="" loading="lazy" /></span>
          </div>
          <div className="v8-svc__card v8-svc__card--mini">
            <span className="v8-svc__card-t">{t.c3b}</span>
            <span className="v8-svc__check" aria-hidden="true">✓</span>
          </div>
        </div>

        {/* 列 4：高卡(67) + 矮卡(33)，斜体大字图形 */}
        <div className="v8-svc__col">
          <div className="v8-svc__card v8-svc__card--img">
            <span className="v8-svc__card-t">{t.c4a}</span>
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
