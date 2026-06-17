import express from 'express'
import cors from 'cors'
import birdsRouter from './routes/birds.js'
import { getDb } from './db.js'

const app = express()
const PORT = process.env.BIRD_API_PORT || 3456

app.use(cors())
app.use(express.json())

// API routes
app.use('/api/birds', birdsRouter)

// Stats overview
app.get('/api/stats/overview', (_req, res) => {
  const db = getDb()
  const total = db.prepare('SELECT COUNT(*) as n FROM birds').get()
  const byStatus = db.prepare(
    "SELECT status, COUNT(*) as count FROM birds GROUP BY status ORDER BY count DESC"
  ).all()
  const avgPop = db.prepare(
    'SELECT ROUND(AVG(population_count)) as avg_pop FROM birds WHERE population_count IS NOT NULL'
  ).get()
  const radarAvg = db.prepare(`
    SELECT dimension, ROUND(AVG(
      CASE grade WHEN 'S' THEN 5 WHEN 'A' THEN 4 WHEN 'B' THEN 3 WHEN 'C' THEN 2 WHEN 'D' THEN 1 ELSE 0 END
    ), 1) as avg_score
    FROM radar_scores GROUP BY dimension ORDER BY dimension
  `).all()
  res.json({ total: total.n, byStatus, avgPopulation: avgPop.avg_pop, radarAvg })
})

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', db: 'sqlite' }))

app.listen(PORT, () => {
  console.log(`🦅 Bird API running on http://localhost:${PORT}`)
})
