# 房源数据开放接口文档

> Viva 广州租房 · 公开房源数据 API
> 供合作网站 / 小程序 / 内部系统调用房源数据，无需鉴权。

## 1. 概览

| 项目 | 说明 |
|------|------|
| Base URL | `https://www.vivagz.com/api` |
| 协议 | HTTPS，仅支持 `GET` |
| 鉴权 | 无需密钥 |
| 跨域 | 响应头 `access-control-allow-origin: *`，浏览器端可直接 fetch |
| 缓存 | 边缘缓存 5 分钟（`public, max-age=60, s-maxage=300`），后台改动最迟约 5 分钟同步 |
| 数据范围 | 仅返回**已发布**房源（后台下架即不可见） |

## 2. 接口列表

### 2.1 房源列表

```
GET /api/properties
```

**查询参数**（全部可选，多值用英文逗号分隔，如 `category=luxury,student`）：

| 参数 | 类型 | 说明 |
|------|------|------|
| `lang` | string | 返回语言：`zh`（默认）/ `en`。户型、区域、地铁等文案字段随语言返回，英文缺失时自动回退中文 |
| `category` | string | 房型，多值逗号分隔：`luxury` 豪华住宅 / `standard` 普通住宅 / `student` 学生公寓 / `city` 城市公寓 |
| `district` | string | 区域 key，多值逗号分隔：`liwan` 荔湾 / `tianhe` 天河 / `yuexiu` 越秀 / `haizhu` 海珠 / `baiyun` 白云 / `huangpu` 黄埔 / `panyu` 番禺 / `zengcheng` 增城 |
| `school` | string | 校区 key，多值逗号分隔（如 `scut-wushan`），仅学生公寓有值 |
| `beds` | int | 房数：`0` 开间 / `1` / `2` / `3` / `4`（表示 ≥4） |
| `minPrice` | int | 月租下限（元），按 `priceValue` 过滤 |
| `maxPrice` | int | 月租上限（元） |
| `q` | string | 关键词，模糊匹配 编号 / 区域 / 地址 / 地铁 / 户型 |
| `sort` | string | 排序：`priceasc` 价格升序 / `pricedesc` 价格降序 / `bedsdesc` 房数降序；缺省按后台排序 |
| `limit` | int | 每页条数，默认 `50`，最大 `200` |
| `offset` | int | 跳过条数，默认 `0`（配合 `limit` 翻页） |

**响应示例**：

```json
{
  "lang": "zh",
  "total": 174,
  "count": 2,
  "limit": 50,
  "offset": 0,
  "items": [
    {
      "code": "VIVA0001",
      "br": "三房两厅",
      "beds": 3,
      "baths": 2,
      "area": 95,
      "amenities": ["furnished", "wifi", "ac"],
      "district": "广州 · 海珠区",
      "districtKey": "haizhu",
      "schoolKeys": [],
      "schoolKey": null,
      "metro": "3 号线 · 广州塔站",
      "address": "海珠区 xx 路 xx 号",
      "lat": 23.10664,
      "lng": 113.32446,
      "price": "26,800",
      "fx": "≈ 3,970$",
      "img": "https://....jpg",
      "gallery": ["https://....jpg"],
      "categories": ["luxury"],
      "intro": "房源介绍长文案（可能缺省）",
      "locationText": "位置描述长文案（可能缺省）",
      "priceValue": 26800
    }
  ]
}
```

**响应字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `total` | int | 满足全部筛选条件的总条数（翻页用它算总页数） |
| `count` | int | 本页实际条数 |
| `items[].code` | string | 房源编号，全局唯一，可作详情页 key |
| `items[].br` | string | 户型展示文案（zh：三房两厅；en：3 Bedrooms） |
| `items[].beds` | int\|null | 数字房数；`0` 为开间，`null` 表示后台户型无法解析 |
| `items[].price` | string | 月租展示串（可能含千分位/货币符） |
| `items[].priceValue` | int | 月租数字（元），程序化筛选/计算用 |
| `items[].fx` | string | 汇率参考展示串，可能为空 |
| `items[].districtKey` | string | 区域 key，见上表；`lat`/`lng` 缺省表示无精确坐标 |
| `items[].categories` | string[] | 房型标签数组，取值同 `category` 参数 |
| `items[].intro` / `locationText` | string | 房源级双语长文案，后台未填时**不下发**（字段缺失，非空串） |
| `items[].copyHidden` | bool | `true` 表示后台勾选了隐藏微信号等联系信息 |

### 2.2 房源详情

```
GET /api/properties/:code
```

按编号精确匹配（不区分大小写），仅返回一套：

```json
{ "lang": "zh", "item": { "code": "VIVA0001", "...": "同列表字段" } }
```

编号不存在或未发布时返回 `404`：

```json
{ "error": "房源不存在或未发布", "details": { "code": "XXX" } }
```

## 3. 错误码

| HTTP | 场景 |
|------|------|
| `400` | `lang` 不是 zh/en，或参数非法 |
| `404` | 详情接口编号不存在或未发布 |
| `503` | 数据库暂不可用（稍后重试） |

## 4. 调用示例

### cURL

```bash
# 全部房源（中文）
curl "https://www.vivagz.com/api/properties?lang=zh"

# 天河区豪华住宅，2 房，预算 4000-8000，价格升序，取前 20 条
curl "https://www.vivagz.com/api/properties?lang=zh&category=luxury&district=tianhe&beds=2&minPrice=4000&maxPrice=8000&sort=priceasc&limit=20"

# 单套详情（英文）
curl "https://www.vivagz.com/api/properties/VIVA0001?lang=en"
```

### JavaScript / 前端（支持跨域，可直接调用）

```js
// 列表
const { total, items } = await fetch('https://www.vivagz.com/api/properties?lang=zh&limit=12').then(r => r.json())

// 详情
const { item } = await fetch('https://www.vivagz.com/api/properties/VIVA0001?lang=zh').then(r => r.json())
```

### React 组件

```jsx
import { useEffect, useState } from 'react'

function HomeList() {
  const [items, setItems] = useState([])
  useEffect(() => {
    fetch('https://www.vivagz.com/api/properties?lang=zh&limit=12')
      .then(r => r.json())
      .then(d => setItems(d.items))
  }, [])
  return (
    <ul>
      {items.map(p => (
        <li key={p.code}>
          <img src={p.img} alt={p.code} />
          {p.district} · {p.br} · ¥{p.price}/月起
        </li>
      ))}
    </ul>
  )
}
```

### Node.js / 服务端

```js
const { items } = await (await fetch('https://www.vivagz.com/api/properties?lang=zh&limit=50')).json()
```

### PHP / WordPress

```php
$items = json_decode(
  file_get_contents('https://www.vivagz.com/api/properties?lang=zh&limit=12'),
  true
)['items'];
```

## 5. 对接建议

1. **分页**：以 `total` 计算总页数，`offset += limit` 翻页；`limit` 上限 200。
2. **价格判断**：一律用 `priceValue`（数字），不要解析 `price` 展示串。
3. **图片**：`img` 为封面，`gallery` 为图集；均为可直链的 CDN 地址。
4. **缓存**：接口已有边缘缓存；高流量站点请自行再加一层本地缓存（建议 ≥5 分钟），避免频繁回源。
5. **多语言**：同一房源两种语言各自调用 `?lang=zh` / `?lang=en`；英文户型在后台未填时会自动转写或回退中文。
6. **数据同步**：后台房源上下架/改价后，最迟约 5 分钟反映到接口。

---
*接口版本：v1（2026-10-18）· 数据来源：vivagz.com 后台房源库*
