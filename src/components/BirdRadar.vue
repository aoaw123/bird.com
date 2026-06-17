<script setup>
import { computed, ref, watch, nextTick } from 'vue'

const props = defineProps({
  bird: { type: Object, required: true }
})

// ── Layout constants (fixed viewBox) ──────────────────────────────
const cx = 220, cy = 220, maxR = 140
const axes = ['speed', 'attack', 'size', 'migration', 'agility', 'rarity']
const labels = ['速度', '攻击', '体型', '迁徙', '敏捷', '稀有度']
const enLabels = ['Speed', 'Attack', 'Size', 'Migration', 'Agility', 'Rarity']
const gradeMap = { S: 5, A: 4, B: 3, C: 2, D: 1 }
const dataScale = 4

// ── Helpers ───────────────────────────────────────────────────────
function axisAngle(i) { return (Math.PI * 2 * i) / 6 - Math.PI / 2 }
function pointOnAxis(i, ratio) {
  const a = axisAngle(i)
  return { x: cx + maxR * ratio * Math.cos(a), y: cy + maxR * ratio * Math.sin(a) }
}

/**
 * Walk a dot-separated path into an object and return the value
 * if it's a finite number.
 */
function extractValue(obj, paths) {
  for (const path of paths) {
    const parts = path.split('.')
    let val = obj
    let ok = true
    for (const p of parts) {
      if (val && typeof val === 'object' && p in val) {
        val = val[p]
      } else {
        ok = false
        break
      }
    }
    if (ok && typeof val === 'number' && Number.isFinite(val)) return val
  }
  return null
}

// ── Fetch physical JSON ───────────────────────────────────────────
const physicalData = ref(null)
const dataFetchFailed = ref(false)
const dataLoading = ref(false)

watch(() => props.bird?.id, async (id) => {
  if (!id) { physicalData.value = null; dataFetchFailed.value = false; return }
  physicalData.value = null
  dataFetchFailed.value = false
  dataLoading.value = true
  try {
    const resp = await fetch(`/data/${id}/身体素质数据.json`)
    if (resp.ok) {
      physicalData.value = await resp.json()
    } else {
      dataFetchFailed.value = true
    }
  } catch {
    dataFetchFailed.value = true
  } finally {
    dataLoading.value = false
  }
}, { immediate: true })

// ── Physical stats (6 axes → real-world numbers) ──────────────────
const physicalStats = computed(() => {
  const raw = physicalData.value
  if (!raw || dataFetchFailed.value) return null
  const body = raw['身体素质数据'] || raw

  // Speed — try multiple field names
  const speedVal = extractValue(body, [
    '运动能力.飞行速度.种族平均速度_km_h',
    '运动能力.飞行速度.巡航速度_km_h',
    '运动能力.飞行速度.最大速度_km_h'
  ])

  // Weight — kg first, then g→kg conversion
  const weightKg = extractValue(body, ['体型数据.体重.种族平均_kg'])
  const weightG  = extractValue(body, ['体型数据.体重.种族平均_g'])
  const weightInKg = weightKg !== null ? weightKg
    : weightG !== null ? weightG / 1000
    : null

  const bodyLen      = extractValue(body, ['体型数据.体长.种族平均_cm'])
  const agilitySpeed  = extractValue(body, ['运动能力.飞行速度.最大速度_km_h'])
  const rarityPop     = props.bird?.popCount ?? null

  return [
    { label: '速度',  key: 'speed',     value: speedVal,     max: 100,    unit: 'km/h', decimals: 0 },
    { label: '攻击',  key: 'attack',    value: weightInKg,   max: 5,      unit: 'kg',   decimals: 2 },
    { label: '体型',  key: 'size',      value: bodyLen,      max: 130,    unit: 'cm',   decimals: 0 },
    { label: '迁徙',  key: 'migration', value: null,         max: 5,      unit: '',     decimals: 0 },
    { label: '敏捷',  key: 'agility',   value: agilitySpeed, max: 120,    unit: 'km/h', decimals: 0 },
    { label: '稀有度',key: 'rarity',    value: rarityPop,    max: 700000,  unit: '只',   decimals: 0 },
  ]
})

// ── Normalised values for radar polygon (falls back to grade) ────
const normValues = computed(() => {
  const stats = physicalStats.value
  const panel = props.bird.panel
  if (!panel) {
    // No panel at all — all fall to D
    return axes.map(() => 1 / dataScale)
  }
  if (!stats) {
    // No physical data — use grades
    return axes.map(key => (gradeMap[panel[key]] || 1) / dataScale)
  }
  return stats.map((stat, i) => {
    if (stat.value !== null && stat.value !== undefined && Number.isFinite(stat.value)) {
      // Attack & Agility: use panel grade
      if (axes[i] === 'attack' || axes[i] === 'agility') {
        return (gradeMap[panel[axes[i]]] || 1) / dataScale
      }
      // Rarity: log10 normalisation (population spans 2500–680000)
      if (axes[i] === 'rarity') {
        return Math.log10(stat.value) / Math.log10(stat.max)
      }
      return stat.value / stat.max
    }
    // fallback to panel grade
    return (gradeMap[panel[axes[i]]] || 1) / dataScale
  })
})

// Formatted text for the 6-axis data labels
const valueTexts = computed(() => {
  const stats = physicalStats.value
  const panel = props.bird.panel
  if (!stats || !panel) {
    // Full fallback: grades only
    return axes.map(key => panel ? (panel[key] || 'D') : 'D')
  }
  return stats.map((stat, i) => {
    // Attack & Agility: show grade instead of numeric
    if (axes[i] === 'attack' || axes[i] === 'agility') {
      return panel[axes[i]] || 'D'
    }
    if (stat.value !== null && stat.value !== undefined && Number.isFinite(stat.value)) {
      // Population: format with commas
      if (axes[i] === 'rarity') {
        const n = Math.round(stat.value)
        const formatted = n.toLocaleString('en-US')
        return `${formatted} ${stat.unit}`
      }
      const fmt = Number(stat.value).toFixed(stat.decimals)
      return stat.unit ? `${fmt} ${stat.unit}` : fmt
    }
    // migration or missing field → grade
    return panel[axes[i]] || 'D'
  })
})

// Whether ANY physical data loaded successfully
const hasPhysicalData = computed(() => physicalStats.value !== null)

// ── SVG geometry ──────────────────────────────────────────────────
const rings = computed(() =>
  [1, 2, 3, 4].map(level => {
    const ratio = level / dataScale
    const pts = axes.map((_, i) => pointOnAxis(i, ratio)).map(p => `${p.x},${p.y}`).join(' ')
    return { level, ratio, pts }
  })
)

// Axis lines extend beyond outer ring to support S-grade / >1.0 values
const axisLines = computed(() =>
  axes.map((_, i) => {
    const p = pointOnAxis(i, 1.35)
    return { x1: cx, y1: cy, x2: p.x, y2: p.y }
  })
)

// Labels with English subtitle: ratio 1.28 (inner)
const labelPositions = computed(() =>
  axes.map((_, i) => pointOnAxis(i, 1.28))
)

// Data values: ratio 1.52 (outer — above for upper axes, below for lower)
// Per-axis fine-tune: (dx, dy) offsets in SVG units
const dataOffsets = [
  { dx:  0, dy:  5 },  // 速度 — nudge down
  { dx:  0, dy:  0 },  // 攻击
  { dx:  0, dy:  0 },  // 体型
  { dx:  0, dy:  0 },  // 迁徙
  { dx: -6, dy:  4 },  // 敏捷 — nudge left+down
  { dx:  0, dy:  0 },  // 稀有度
]
const dataPositions = computed(() => {
  const base = axes.map((_, i) => pointOnAxis(i, 1.52))
  return base.map((p, i) => ({ x: p.x + dataOffsets[i].dx, y: p.y + dataOffsets[i].dy }))
})

// ── Radar polygon ─────────────────────────────────────────────────
const dataPoints = computed(() => {
  const nv = normValues.value
  return axes.map((_, i) => {
    const p = pointOnAxis(i, nv[i])
    return `${p.x},${p.y}`
  }).join(' ')
})

// Dot positions (same as polygon vertices)
const dotPositions = computed(() => {
  const nv = normValues.value
  return axes.map((_, i) => pointOnAxis(i, nv[i]))
})

// ── Animation control ─────────────────────────────────────────────
const animKey = ref(0)

// Re-trigger on bird change
watch(() => props.bird?.id, () => {
  animKey.value++
  nextTick(() => { animKey.value++ })
})

// Re-trigger when physical data arrives
watch(physicalData, () => {
  animKey.value++
  nextTick(() => { animKey.value++ })
})
</script>

<template>
  <div class="bird-radar" v-if="bird.panel" :key="'radar-'+animKey">
    <svg viewBox="0 0 440 440" class="radar-svg">
      <!-- Rings (4 rings: D C B A — S extends beyond if value > maxR) -->
      <polygon
        v-for="ring in rings" :key="'r'+ring.level"
        :points="ring.pts" fill="none"
        :stroke="ring.level === 4 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.1)'"
        :stroke-width="ring.level === 4 ? 1.5 : 0.8"
        class="ring-shard"
        :style="{ animationDelay: (0.06 * ring.level) + 's' }"
      />

      <!-- Axis lines -->
      <line
        v-for="(line, i) in axisLines" :key="'ax'+i"
        :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2"
        stroke="rgba(255,255,255,0.06)" stroke-width="0.8"
        class="axis-line"
        :style="{ animationDelay: (0.03 * i) + 's' }"
      />

      <!-- Data polygon -->
      <polygon
        :points="dataPoints"
        fill="rgba(255,59,92,0.18)"
        stroke="#ff3b5c" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"
        class="data-polygon"
      />

      <!-- Data dots at vertices -->
      <circle
        v-for="(pos, i) in dotPositions" :key="'dot'+i"
        :cx="pos.x" :cy="pos.y"
        r="3.5"
        fill="#ff3b5c"
        stroke="rgba(255,255,255,0.2)"
        stroke-width="1"
        class="data-dot"
        :style="{ animationDelay: (0.5 + 0.04 * i) + 's' }"
      />

      <!-- Physical data values (outer — above labels for upper axes, below for lower) -->
      <text
        v-for="(text, i) in valueTexts" :key="'vl'+i"
        :x="dataPositions[i].x" :y="dataPositions[i].y"
        text-anchor="middle" dominant-baseline="central"
        fill="rgba(255,255,255,0.6)"
        font-size="12" font-weight="400"
        font-family="inherit"
        class="data-fade"
        :style="{ animationDelay: (0.7 + 0.05 * i) + 's' }"
      >{{ text }}</text>

      <!-- Axis labels: Chinese above, English subtitle below -->
      <text
        v-for="(label, i) in labels" :key="'lb'+i"
        :x="labelPositions[i].x" :y="labelPositions[i].y"
        text-anchor="middle" dominant-baseline="central"
        fill="rgba(255,255,255,0.75)" font-size="18"
        font-family="inherit" font-weight="300" letter-spacing="3"
        class="label-fade"
        :style="{ animationDelay: (0.85 + 0.04 * i) + 's' }"
      >{{ label }}</text>
      <text
        v-for="(en, i) in enLabels" :key="'en'+i"
        :x="labelPositions[i].x" :y="labelPositions[i].y + 12"
        text-anchor="middle" dominant-baseline="central"
        fill="rgba(255,255,255,0.25)" font-size="10"
        font-family="inherit" font-style="italic" letter-spacing="1.5"
        class="label-fade"
        :style="{ animationDelay: (0.9 + 0.04 * i) + 's' }"
      >{{ en }}</text>
    </svg>
  </div>
</template>

<style scoped>
.bird-radar {
  position: absolute;
  left: 14%;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  pointer-events: auto;
}

.radar-svg {
  width: 410px;
  height: 410px;
  display: block;
}

/* Ring animation */
.ring-shard {
  transform-origin: 220px 220px;
  opacity: 0;
  transform: scale(0.1) rotate(-15deg);
  animation: shard-build 0.8s cubic-bezier(0.42, 0, 0.1, 1) forwards;
}

@keyframes shard-build {
  0%   { opacity: 0; transform: scale(0.1) rotate(-15deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}

/* Axis lines */
.axis-line {
  opacity: 0;
  animation: fade-in 0.3s ease forwards;
}

@keyframes fade-in {
  to { opacity: 1; }
}

/* Data polygon */
.data-polygon {
  opacity: 0;
  transform-origin: 220px 220px;
  transform: scale(0.3);
  animation: data-expand 0.65s 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
}

@keyframes data-expand {
  0%   { opacity: 0; transform: scale(0.3); }
  100% { opacity: 1; transform: scale(1); }
}

/* Data dots */
.data-dot {
  opacity: 0;
  animation: dot-appear 0.3s ease forwards;
}

@keyframes dot-appear {
  to { opacity: 1; }
}

/* Labels */
.label-fade {
  opacity: 0;
  animation: label-appear 0.35s ease forwards;
}

@keyframes label-appear {
  to { opacity: 1; }
}

/* Data value text */
.data-fade {
  opacity: 0;
  animation: label-appear 0.35s ease forwards;
}

@media (max-width: 768px) {
  .bird-radar {
    transform: translateY(-50%) scale(0.55);
    left: 50%;
  }
}
</style>
