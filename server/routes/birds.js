import { Router } from 'express'
import { getDb } from '../db.js'

const router = Router()

// GET /api/birds - all birds with full data
router.get('/', (_req, res) => {
  const db = getDb()
  const birds = db.prepare('SELECT * FROM birds ORDER BY id').all()

  const result = birds.map(bird => {
    const images = db.prepare(
      'SELECT image_path, is_primary, sort_order FROM bird_images WHERE bird_id = ? ORDER BY sort_order'
    ).all(bird.id)

    const tags = db.prepare(
      'SELECT tag FROM bird_tags WHERE bird_id = ?'
    ).all(bird.id).map(r => r.tag)

    const radar = db.prepare(
      'SELECT dimension, grade, description FROM radar_scores WHERE bird_id = ?'
    ).all(bird.id)

    return {
      id: bird.id,
      name: bird.name,
      nameCN: bird.name_cn,
      hasDetailData: true,
      image: images.find(i => i.is_primary)?.image_path || images[0]?.image_path,
      gallery: images.map(i => i.image_path),
      factfile: {
        description: bird.description,
        stats: {
          wingspan: bird.wingspan,
          weight: bird.weight,
          lifespan: bird.lifespan,
          diet: bird.diet
        },
        status: bird.status,
        tags
      },
      population: bird.population_text,
      popCount: bird.population_count,
      where: bird.distribution,
      video: bird.video_url,
      panel: buildRadarObject(radar)
    }
  })

  res.json(result)
})

// GET /api/birds/:id - single bird
router.get('/:id', (req, res) => {
  const db = getDb()
  const bird = db.prepare('SELECT * FROM birds WHERE id = ?').get(req.params.id)
  if (!bird) return res.status(404).json({ error: 'Not found' })

  const images = db.prepare(
    'SELECT image_path, is_primary, sort_order FROM bird_images WHERE bird_id = ? ORDER BY sort_order'
  ).all(bird.id)

  const tags = db.prepare(
    'SELECT tag FROM bird_tags WHERE bird_id = ?'
  ).all(bird.id).map(r => r.tag)

  const radar = db.prepare(
    'SELECT dimension, grade, description FROM radar_scores WHERE bird_id = ?'
  ).all(bird.id)

  res.json({
    id: bird.id,
    name: bird.name,
    nameCN: bird.name_cn,
    hasDetailData: true,
    image: images.find(i => i.is_primary)?.image_path || images[0]?.image_path,
    gallery: images.map(i => i.image_path),
    factfile: {
      description: bird.description,
      stats: {
        wingspan: bird.wingspan,
        weight: bird.weight,
        lifespan: bird.lifespan,
        diet: bird.diet
      },
      status: bird.status,
      tags
    },
    population: bird.population_text,
    popCount: bird.population_count,
    where: bird.distribution,
    video: bird.video_url,
    panel: buildRadarObject(radar)
  })
})

// GET /api/birds/:id/radar - radar scores only (lightweight)
router.get('/:id/radar', (req, res) => {
  const db = getDb()
  const radar = db.prepare(
    'SELECT dimension, grade, description FROM radar_scores WHERE bird_id = ?'
  ).all(req.params.id)
  res.json(buildRadarObject(radar))
})

function buildRadarObject(radarRows) {
  const obj = { speed: '', attack: '', size: '', migration: '', agility: '', rarity: '', desc: {} }
  for (const r of radarRows) {
    obj[r.dimension] = r.grade
    obj.desc[r.dimension] = r.description
  }
  return obj
}

export default router
