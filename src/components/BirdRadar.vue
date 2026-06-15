<script setup>
import { computed, ref, watch, nextTick } from 'vue'

const props = defineProps({
  bird: { type: Object, required: true }
})

const cx = 190, cy = 190, maxR = 150
const axes = ['speed', 'attack', 'size', 'migration', 'agility', 'rarity']
const labels = ['速度', '攻击', '体型', '迁徙', '敏捷', '稀有度']
const gradeMap = { S: 5, A: 4, B: 3, C: 2, D: 1 }

function axisAngle(i) { return (Math.PI * 2 * i) / 6 - Math.PI / 2 }
function pointOnAxis(i, ratio) {
  const a = axisAngle(i)
  return { x: cx + maxR * ratio * Math.cos(a), y: cy + maxR * ratio * Math.sin(a) }
}

const rings = computed(() =>
  [1,2,3,4,5].map(level => {
    const ratio = level / 5
    const pts = axes.map((_, i) => { const p = pointOnAxis(i, ratio); return `${p.x},${p.y}` }).join(' ')
    return { level, ratio, pts }
  })
)

const axisLines = computed(() => axes.map((_, i) => { const p = pointOnAxis(i, 1); return { x1: cx, y1: cy, x2: p.x, y2: p.y } }))
const labelPositions = computed(() => axes.map((_, i) => { const p = pointOnAxis(i, 1.14); return { x: p.x, y: p.y } }))

const dataPoints = computed(() => {
  const panel = props.bird.panel
  if (!panel) return ''
  return axes.map((key, i) => {
    const v = gradeMap[panel[key]] || 1
    const p = pointOnAxis(i, v / 5)
    return `${p.x},${p.y}`
  }).join(' ')
})

// Replay animation on bird change
const animKey = ref(0)
watch(() => props.bird?.id, () => {
  animKey.value++
  nextTick(() => { animKey.value++ })
})
</script>

<template>
  <div class="bird-radar" v-if="bird.panel" :key="'radar-'+animKey">
    <svg viewBox="0 0 380 380" class="radar-svg">
      <!-- Rings -->
      <polygon
        v-for="ring in rings" :key="'r'+ring.level"
        :points="ring.pts" fill="none"
        :stroke="ring.level === 5 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'"
        :stroke-width="ring.level === 5 ? 1.5 : 0.8"
        class="ring-shard"
        :style="{ animationDelay: (0.06 * ring.level) + 's' }"
      />

      <!-- Axis lines -->
      <line
        v-for="(line, i) in axisLines" :key="'ax'+i"
        :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2"
        stroke="rgba(255,255,255,0.08)" stroke-width="0.8"
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

      <!-- Axis labels -->
      <text
        v-for="(label, i) in labels" :key="'lb'+i"
        :x="labelPositions[i].x" :y="labelPositions[i].y"
        text-anchor="middle" dominant-baseline="central"
        fill="rgba(255,255,255,0.75)" font-size="13"
        font-family="inherit" font-weight="300" letter-spacing="3"
        class="label-fade"
        :style="{ animationDelay: (0.3 + 0.04 * i) + 's' }"
      >{{ label }}</text>
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
  width: 320px;
  height: 320px;
  display: block;
}

/* Ring animation */
.ring-shard {
  transform-origin: 190px 190px;
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
  transform-origin: 190px 190px;
  transform: scale(0.3);
  animation: data-expand 0.65s 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
}

@keyframes data-expand {
  0%   { opacity: 0; transform: scale(0.3); }
  100% { opacity: 1; transform: scale(1); }
}

/* Labels */
.label-fade {
  opacity: 0;
  animation: label-appear 0.35s ease forwards;
}

@keyframes label-appear {
  to { opacity: 1; }
}

@media (max-width: 768px) {
  .bird-radar {
    transform: translateY(-50%) scale(0.55);
    left: 50%;
  }
}
</style>
