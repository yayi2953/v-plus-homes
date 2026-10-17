import { getListings } from '../../lib/store.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const listings = getListings().filter((l) => l.published !== false)
  res.status(200).json({ listings })
}
