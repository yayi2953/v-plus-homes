import { requireAdmin } from '../lib/guard.js'
import { getListings, createListing, updateListing, deleteListing } from '../lib/store.js'

export default async function handler(req, res) {
  const admin = requireAdmin(req)
  if (!admin) return res.status(403).json({ error: '需要管理员权限' })

  if (req.method === 'GET') {
    return res.status(200).json({ listings: getListings() })
  }

  if (req.method === 'POST') {
    const data = req.body || {}
    const required = ['title', 'type', 'price', 'city']
    for (const f of required) {
      if (!data[f]) return res.status(400).json({ error: `缺少字段: ${f}` })
    }
    const listing = createListing(data)
    return res.status(201).json({ listing })
  }

  if (req.method === 'PUT') {
    const { id, ...fields } = req.body || {}
    if (!id) return res.status(400).json({ error: '缺少 id' })
    const listing = updateListing(id, fields)
    if (!listing) return res.status(404).json({ error: '房源不存在' })
    return res.status(200).json({ listing })
  }

  if (req.method === 'DELETE') {
    const id = req.body?.id || req.query?.id
    if (!id) return res.status(400).json({ error: '缺少 id' })
    const ok = deleteListing(id)
    return res.status(ok ? 200 : 404).json({ ok })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
