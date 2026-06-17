import { getDb } from './db.js'
import { birds } from '../src/data/birds.js'

const db = getDb()

// Clear existing data
db.exec('DELETE FROM radar_scores')
db.exec('DELETE FROM bird_tags')
db.exec('DELETE FROM bird_images')
db.exec('DELETE FROM birds')
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('birds','bird_images','bird_tags','radar_scores')")

const insertBird = db.prepare(`
  INSERT INTO birds (name, name_cn, description, status, status_code,
    population_text, population_count, distribution, video_url,
    wingspan, weight, lifespan, diet)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertImage = db.prepare(`
  INSERT INTO bird_images (bird_id, image_path, is_primary, sort_order)
  VALUES (?, ?, ?, ?)
`)

const insertTag = db.prepare(`
  INSERT INTO bird_tags (bird_id, tag) VALUES (?, ?)
`)

const insertRadar = db.prepare(`
  INSERT INTO radar_scores (bird_id, dimension, grade, description)
  VALUES (?, ?, ?, ?)
`)

const seed = db.transaction(() => {
  for (const bird of birds) {
    const result = insertBird.run(
      bird.name,
      bird.nameCN,
      bird.factfile.description,
      bird.factfile.status,
      bird.factfile.status,
      bird.population,
      bird.popCount || null,
      bird.where,
      bird.video || null,
      bird.factfile.stats.wingspan || null,
      bird.factfile.stats.weight || null,
      bird.factfile.stats.lifespan || null,
      bird.factfile.stats.diet || null
    )
    const birdId = result.lastInsertRowid

    // Primary image
    insertImage.run(birdId, bird.image, 1, 0)

    // Gallery images
    if (bird.gallery) {
      bird.gallery.forEach((path, idx) => {
        const isPrimary = path === bird.image ? 1 : 0
        insertImage.run(birdId, path, isPrimary, idx + 1)
      })
    }

    // Tags
    if (bird.factfile.tags) {
      for (const tag of bird.factfile.tags) {
        insertTag.run(birdId, tag)
      }
    }

    // Radar scores
    if (bird.panel) {
      const dims = ['speed', 'attack', 'size', 'migration', 'agility', 'rarity']
      for (const dim of dims) {
        insertRadar.run(
          birdId,
          dim,
          bird.panel[dim],
          bird.panel.desc[dim] || null
        )
      }
    }
  }
})

seed()

const count = db.prepare('SELECT COUNT(*) as n FROM birds').get()
console.log(`✅ Seeded ${count.n} birds into SQLite`)

// Summary
const dims = db.prepare('SELECT dimension, COUNT(*) as n FROM radar_scores GROUP BY dimension').all()
console.log(`  Radar: ${dims.map(d => `${d.dimension}×${d.n}`).join(', ')}`)
console.log(`  Images: ${db.prepare('SELECT COUNT(*) as n FROM bird_images').get().n}`)
console.log(`  Tags: ${db.prepare('SELECT COUNT(*) as n FROM bird_tags').get().n}`)

db.close()
