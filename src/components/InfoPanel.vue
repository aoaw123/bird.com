<script setup>
import { computed, ref, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  bird: { type: Object, required: true },
  type: { type: String, required: true }
})

const emit = defineEmits(['close'])

const title = computed(() => {
  const titles = {
    factfile: '物种档案',
    population: '种群数量',
    where: '分布区域'
  }
  return titles[props.type] || ''
})

const content = computed(() => {
  if (props.type === 'factfile') return props.bird.factfile.description
  return props.bird[props.type] || ''
})

const stats = computed(() => props.bird.factfile?.stats || {})
const status = computed(() => props.bird.factfile?.status || '')
const tags = computed(() => props.bird.factfile?.tags || [])

const bodyStats = computed(() => {
  const s = props.bird.factfile?.stats || {}
  return [
    { label: '翼展', value: s.wingspan },
    { label: '体重', value: s.weight },
    { label: '寿命', value: s.lifespan }
  ]
})
const diet = computed(() => props.bird.factfile?.stats?.diet || '')

// Count-up animation
const animatedStats = ref({ wingspan: '', weight: '', lifespan: '' })

function extractNumber(str) {
  if (!str) return null
  const match = str.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : null
}

function countUp(target, key, unit) {
  const num = extractNumber(target)
  if (num === null || isNaN(num)) {
    animatedStats.value[key] = target
    return
  }

  const duration = 800
  const startTime = performance.now()
  const isFloat = num % 1 !== 0

  function tick(now) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    // ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3)
    const current = num * eased

    if (isFloat) {
      animatedStats.value[key] = current.toFixed(1) + unit
    } else {
      animatedStats.value[key] = Math.round(current) + unit
    }

    if (progress < 1) {
      requestAnimationFrame(tick)
    } else {
      animatedStats.value[key] = target
    }
  }

  animatedStats.value[key] = isFloat ? '0.0' + unit : '0' + unit
  requestAnimationFrame(tick)
}

function animateStats() {
  const s = props.bird.factfile?.stats || {}
  const fields = [
    { key: 'wingspan', value: s.wingspan },
    { key: 'weight', value: s.weight },
    { key: 'lifespan', value: s.lifespan }
  ]

  fields.forEach((field, i) => {
    setTimeout(() => {
      const val = field.value || ''
      const num = extractNumber(val)
      if (num !== null) {
        const unit = val.replace(/[\d.]+/, '')
        countUp(val, field.key, '')
      } else {
        animatedStats.value[field.key] = val
      }
    }, i * 150)
  })
}

watch(() => props.bird.id, () => {
  nextTick(animateStats)
}, { immediate: true })

onMounted(() => {
  nextTick(animateStats)
})
</script>

<template>
  <div class="info-panel">
    <div class="panel-header">
      <h2 class="panel-title">{{ title }}</h2>
      <button class="close-btn" @click="emit('close')">
        <span class="close-icon">&times;</span>
        <span class="close-text">关闭</span>
      </button>
    </div>

    <div class="panel-body-factfile">
      <div class="stats-grid">
        <div v-for="(item, idx) in bodyStats" :key="item.label" class="stat-item">
          <span class="stat-label">{{ item.label }}</span>
          <span class="stat-value">{{ animatedStats[['wingspan','weight','lifespan'][idx]] || item.value }}</span>
        </div>
      </div>

      <div class="diet-card">
        <span class="diet-label">食性</span>
        <span class="diet-value">{{ diet }}</span>
      </div>

      <div class="status-row">
        <span class="status-badge">{{ status }}</span>
        <div class="tags">
          <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>

      <p class="panel-content">{{ content }}</p>

      <div class="section">
        <h4 class="section-title">种群数量</h4>
        <p class="panel-content">{{ bird.population }}</p>
      </div>

      <div class="section">
        <h4 class="section-title">分布区域</h4>
        <p class="panel-content">{{ bird.where }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.info-panel {
  position: absolute;
  top: 50%;
  right: 5%;
  transform: translateY(-50%);
  width: 380px;
  max-height: 70vh;
  overflow-y: auto;
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 28px;
  z-index: 10;
}

/* Custom scrollbar */
.info-panel::-webkit-scrollbar {
  width: 4px;
}

.info-panel::-webkit-scrollbar-track {
  background: transparent;
}

.info-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-title {
  font-size: 18px;
  font-weight: 300;
  letter-spacing: 4px;
}

.close-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.6);
  padding: 6px 16px;
  font-size: 12px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.close-btn:hover {
  border-color: rgba(255, 255, 255, 0.5);
  color: #ffffff;
}

.close-btn:active {
  transform: scale(0.95);
}

.close-icon {
  font-size: 18px;
  line-height: 1;
}

.panel-body-factfile {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.diet-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.diet-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 1px;
}

.diet-value {
  font-size: 14px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 1px;
}

.stat-value {
  font-size: 15px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  font-variant-numeric: tabular-nums;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-badge {
  padding: 4px 12px;
  background: rgba(255, 100, 100, 0.2);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 4px;
  font-size: 12px;
  color: #ff8888;
  letter-spacing: 1px;
}

.tags {
  display: flex;
  gap: 8px;
}

.tag {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.panel-content {
  font-size: 15px;
  line-height: 1.8;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.8);
}

.section-title {
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .info-panel {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-height: 60vh;
    border-radius: 16px 16px 0 0;
    transform: none;
    padding: 24px;
    padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .panel-content {
    font-size: 14px;
  }

  .status-row {
    flex-wrap: wrap;
  }

  .tags {
    flex-wrap: wrap;
  }
}
</style>
