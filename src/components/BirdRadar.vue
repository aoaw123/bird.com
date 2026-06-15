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

const dataDots = computed(() => {
  const panel = props.bird.panel
  if (!panel) return []
  return axes.map((key, i) => {
    const grade = panel[key] || 'D'
    const value = gradeMap[grade] || 1
    const p = pointOnAxis(i, value / 5)
    return { x: p.x, y: p.y, grade, desc: panel.desc?.[key] || '', label: labels[i] }
  })
})

// Animation control — replay when bird changes
const animKey = ref(0)
watch(() => props.bird?.id, () => {
  animKey.value++
  nextTick(() => { animKey.value++ })
})

const hoveredDot = ref(null)
const tooltipPos = ref({ x: 0, y: 0 })
function onDotEnter(dot, e) { hoveredDot.value = dot; updateTooltip(e) }
function onDotMove(e) { updateTooltip(e) }
function onDotLeave() { hoveredDot.value = null }
function updateTooltip(e) {
  const rect = e.currentTarget.closest('.bird-radar').getBoundingClientRect()
  tooltipPos.value = { x: e.clientX - rect.left + 14, y: e.clientY - rect.top - 10 }
}
</script>

<template>
  <div class="bird-radar" v-if="bird.panel" :key="'radar-'+animKey">
    <svg viewBox="0 0 380 380" class="radar-svg">
      <!-- Rings with shard-like stagger animation -->
      <polygon
        v-for="ring in rings" :key="'r'+ring.level"
        :points="ring.pts" fill="none"
        :stroke="ring.level === 5 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)'"
        :stroke-width="ring.level === 5 ? 2 : 1"
        class="ring-shard"
        :style="{ animationDelay: (0.08 * ring.level) + 's' }"
      />

      <!-- Axis lines -->
      <line
        v-for="(line, i) in axisLines" :key="'ax'+i"
        :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2"
        stroke="rgba(255,255,255,0.1)" stroke-width="1"
        class="axis-line"
        :style="{ animationDelay: (0.05 * i) + 's' }"
      />

      <!-- Data polygon -->
      <polygon
        :points="dataPoints"
        fill="rgba(255,59,92,0.2)"
        stroke="#ff3b5c" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"
        class="data-polygon"
      />

      <!-- Data dots with staggered pop-in -->
      <circle
        v-for="(dot, i) in dataDots" :key="'dot'+i"
        :cx="dot.x" :cy="dot.y" r="6"
        fill="none" stroke="#ff3b5c" stroke-width="2.5"
        class="data-dot-shard"
        :style="{ animationDelay: (0.7 + 0.08 * i) + 's' }"
        @mouseenter="onDotEnter(dot, $event)"
        @mousemove="onDotMove"
        @mouseleave="onDotLeave"
      />

      <!-- Axis labels -->
      <text
        v-for="(label, i) in labels" :key="'lb'+i"
        :x="labelPositions[i].x" :y="labelPositions[i].y"
        text-anchor="middle" dominant-baseline="central"
        fill="rgba(255,255,255,0.8)" font-size="13"
        font-family="inherit" font-weight="300" letter-spacing="3"
        class="label-fade"
        :style="{ animationDelay: (0.5 + 0.06 * i) + 's' }"
      >{{ label }}</text>
    </svg>

    <Transition name="tooltip-fade">
      <div v-if="hoveredDot" class="radar-tooltip"
        :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }">
        <span class="tooltip-label">{{ hoveredDot.label }}</span>
        <span class="tooltip-grade">{{ hoveredDot.grade }}</span>
        <span class="tooltip-desc">{{ hoveredDot.desc }}</span>
      </div>
    </Transition>
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

/* ── Shard-style ring animation ── */
.ring-shard {
  transform-origin: 190px 190px;
  opacity: 0;
  transform: scale(0.1) rotate(-15deg);
  animation: shard-build 0.85s cubic-bezier(0.56, 0, 0.06, 0.99) forwards;
}

@keyframes shard-build {
  0%   { opacity: 0; transform: scale(0.1) rotate(-15deg); }
  60%  { opacity: 1; }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}

/* Axis line fade-in */
.axis-line {
  opacity: 0;
  animation: fade-in 0.25s ease forwards;
}

@keyframes fade-in {
  to { opacity: 1; }
}

/* Data polygon draw */
.data-polygon {
  opacity: 0;
  transform-origin: 190px 190px;
  transform: scale(0.3);
  animation: data-expand 0.7s 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes data-expand {
  0%   { opacity: 0; transform: scale(0.3); }
  100% { opacity: 1; transform: scale(1); }
}

/* Data dots pop-in */
.data-dot-shard {
  opacity: 0;
  transform-origin: 190px 190px;
  animation: dot-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes dot-pop {
  0%   { opacity: 0; transform: scale(0); }
  60%  { opacity: 1; transform: scale(1.3); }
  100% { opacity: 1; transform: scale(1); }
}

/* Label stagger fade */
.label-fade {
  opacity: 0;
  animation: label-appear 0.4s ease forwards;
}

@keyframes label-appear {
  to { opacity: 1; }
}

.data-dot-shard:hover {
  r: 9;
  filter: drop-shadow(0 0 8px rgba(255,59,92,0.6));
  transition: r 0.15s ease;
}

.radar-tooltip {
  position: absolute;
  background: rgba(10,10,10,0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 8px;
  padding: 10px 14px;
  pointer-events: none;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 110;
}

.tooltip-label { font-size: 11px; color: rgba(255,255,255,0.45); letter-spacing: 2px; }
.tooltip-grade { font-size: 18px; font-weight: 700; color: #ff3b5c; letter-spacing: 4px; }
.tooltip-desc { font-size: 12px; color: rgba(255,255,255,0.75); font-weight: 300; line-height: 1.4; }

.tooltip-fade-enter-active,
.tooltip-fade-leave-active { transition: opacity 0.15s ease; }
.tooltip-fade-enter-from,
.tooltip-fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .bird-radar {
    transform: translateY(-50%) scale(0.55);
    left: 50%;
  }
}
</style>
