<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  bird: { type: Object, required: true }
})

const cx = 190, cy = 190, maxR = 150
const axes = ['speed', 'attack', 'size', 'migration', 'agility', 'rarity']
const labels = ['速度', '攻击', '体型', '迁徙', '敏捷', '稀有度']
const gradeMap = { S: 5, A: 4, B: 3, C: 2, D: 1 }
const gradeNames = ['D', 'C', 'B', 'A', 'S']
const gradeColors = ['#555', '#889', '#bbc', '#eef', '#fff']

function axisAngle(i) { return (Math.PI * 2 * i) / 6 - Math.PI / 2 }

function pointOnAxis(i, ratio) {
  const a = axisAngle(i)
  return { x: cx + maxR * ratio * Math.cos(a), y: cy + maxR * ratio * Math.sin(a) }
}

const rings = computed(() =>
  [1,2,3,4,5].map(level => {
    const ratio = level / 5
    const points = axes.map((_, i) => { const p = pointOnAxis(i, ratio); return `${p.x},${p.y}` }).join(' ')
    return { level, ratio, points, label: gradeNames[level-1], color: gradeColors[level-1] }
  })
)

const axisLines = computed(() => axes.map((_, i) => { const p = pointOnAxis(i, 1); return { x1: cx, y1: cy, x2: p.x, y2: p.y } }))

const labelPositions = computed(() => axes.map((_, i) => { const p = pointOnAxis(i, 1.16); return { x: p.x, y: p.y } }))

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
    return { x: p.x, y: p.y, grade, desc: panel.desc?.[key] || '', label: labels[i], value }
  })
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
  <div class="bird-radar" v-if="bird.panel">
    <svg viewBox="0 0 380 380" class="radar-svg">
      <defs>
        <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(59,130,246,0.06)" />
          <stop offset="100%" stop-color="rgba(59,130,246,0)" />
        </radialGradient>
        <linearGradient id="dataFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(59,130,246,0.35)" />
          <stop offset="50%" stop-color="rgba(139,92,246,0.25)" />
          <stop offset="100%" stop-color="rgba(59,130,246,0.15)" />
        </linearGradient>
      </defs>

      <!-- Center glow -->
      <circle :cx="cx" :cy="cy" r="160" fill="url(#radarGlow)" />

      <!-- Rings -->
      <polygon v-for="ring in rings" :key="'r'+ring.level"
        :points="ring.points" fill="none"
        :stroke="ring.level === 5 ? 'rgba(255,255,255,0.18)' : ring.level >= 3 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'"
        :stroke-width="ring.level === 5 ? 1.5 : 1"
      />

      <!-- Ring grade labels -->
      <text v-for="ring in rings" :key="'gl'+ring.level"
        :x="cx + 5" :y="cy - maxR * ring.ratio + 5"
        :fill="ring.color" font-size="10" font-weight="600"
        font-family="inherit" letter-spacing="1"
      >{{ ring.label }}</text>

      <!-- Axis lines -->
      <line v-for="(line, i) in axisLines" :key="'ax'+i"
        :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2"
        stroke="rgba(255,255,255,0.08)" stroke-width="1"
      />

      <!-- Data polygon fill + stroke -->
      <polygon :points="dataPoints" fill="url(#dataFill)"
        stroke="rgba(96,165,250,0.8)" stroke-width="2" stroke-linejoin="round"
      />

      <!-- Data dots with glow -->
      <circle v-for="(dot, i) in dataDots" :key="'dg'+i"
        :cx="dot.x" :cy="dot.y" r="3.5"
        fill="rgba(96,165,250,0.3)"
      />
      <circle v-for="(dot, i) in dataDots" :key="'dot'+i"
        :cx="dot.x" :cy="dot.y" r="4.5"
        fill="#fff" stroke="rgba(96,165,250,0.9)" stroke-width="2"
        class="data-dot"
        @mouseenter="onDotEnter(dot, $event)"
        @mousemove="onDotMove"
        @mouseleave="onDotLeave"
      />

      <!-- Axis labels -->
      <text v-for="(label, i) in labels" :key="'lb'+i"
        :x="labelPositions[i].x" :y="labelPositions[i].y"
        text-anchor="middle" dominant-baseline="central"
        fill="rgba(255,255,255,0.75)" font-size="13"
        font-family="inherit" font-weight="500" letter-spacing="2"
      >{{ label }}</text>

      <!-- Grade badges on data dots -->
      <text v-for="(dot, i) in dataDots" :key="'gd'+i"
        :x="dot.x" :y="dot.y + 16"
        text-anchor="middle" dominant-baseline="hanging"
        :fill="gradeColors[dot.value - 1]" font-size="9"
        font-weight="700" font-family="inherit" letter-spacing="1"
        opacity="0.9"
      >{{ dot.grade }}</text>
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
  width: 340px;
  height: 340px;
  display: block;
  filter: drop-shadow(0 0 20px rgba(59,130,246,0.15));
}

.data-dot {
  cursor: pointer;
  transition: r 0.2s ease, filter 0.2s ease;
}

.data-dot:hover {
  r: 6.5;
  filter: drop-shadow(0 0 8px rgba(96,165,250,0.8));
}

.radar-tooltip {
  position: absolute;
  background: rgba(10,10,10,0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(96,165,250,0.25);
  border-radius: 8px;
  padding: 10px 14px;
  pointer-events: none;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 110;
}

.tooltip-label {
  font-size: 11px;
  color: rgba(255,255,255,0.45);
  letter-spacing: 2px;
  text-transform: uppercase;
}

.tooltip-grade {
  font-size: 18px;
  font-weight: 700;
  color: rgba(96,165,250,1);
  letter-spacing: 4px;
}

.tooltip-desc {
  font-size: 12px;
  color: rgba(255,255,255,0.75);
  font-weight: 300;
  line-height: 1.4;
}

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
