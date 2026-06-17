const BASE = '/api/birds'

export async function fetchBirds() {
  const res = await fetch(BASE)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchBird(id) {
  const res = await fetch(`${BASE}/${id}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchBirdRadar(id) {
  const res = await fetch(`${BASE}/${id}/radar`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchStats() {
  const res = await fetch(`/api/stats/overview`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
