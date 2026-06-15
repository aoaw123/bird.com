<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  bird: { type: Object, required: true }
})

const cx = 150
const cy = 150
const maxR = 110
const axes = ['speed', 'attack', 'size', 'migration', 'agility', 'rarity']
const labels = ['速度', '攻击', '体型', '迁徙', '敏捷', '稀有度']
const gradeMap = { S: 5, A: 4, B: 3, C: 2, D: 1 }
const gradeNames = ['D', 'C', 'B', 'A', 'S']

function axisAngle(i) {
  return (Math.PI * 2 * i) / 6 - Math.PI / 2
}

function pointOnAxis(i, ratio) {
  const a = axisAngle(i)
  return {
    x: cx + maxR * ratio * Math.cos(a),
    y: cy + maxR * ratio * Math.sin(a)
  }
}

// Pentagon rings for each grade level
const rings = computed(() => {
  return [1, 2, 3, 4, 5].map(level => {
    const ratio = level / 5
    const points = axes.map((_, i) => {
      const p = pointOnAxis(i, ratio)
      return `${p.x},${p.y}`
    }).join(' ')
    return { level, ratio, points, label: gradeNames[level - 1] }
  })
})

// Axis lines
const axisLines = computed(() => {
  return axes.map((_, i) => {
    const p = pointOnAxis(i, 1)
    return { x1: cx, y1: cy, x2: p.x, y2: p.y }
  })
})

// Label positions (slightly outside the outer ring)
const labelPositions = computed(() => {
  return axes.map((_, i) => {
    const p = pointOnAxis(i, 1.18)
    return { x: p.x, y: p.y }
  })
})

// Data polygon
const dataPoints = computed(() => {
  const panel = props.bird.panel
  if (!panel) return ''
  return axes.map((key, i) => {
    const grade = panel[key] || 'D'
    const value = gradeMap[grade] || 1
    const p = pointOnAxis(i, value / 5)
    return `${p.x},${p.y}`
  }).join(' ')
})

// Individual data dots for hover
const dataDots = computed(() => {
  const panel = props.bird.panel
  if (!panel) return []
  return axes.map((key, i) => {
    const grade = panel[key] || 'D'
    const value = gradeMap[grade] || 1
    const p = pointOnAxis(i, value / 5)
    return {
      x: p.x,
      y: p.y,
      grade,
      desc: panel.desc?.[key] || '',
      label: labels[i]
    }
  })
})

// Tooltip state
const hoveredDot = ref(null)
const tooltipPos = ref({ x: 0, y: 0 })

function onDotEnter(dot, e) {
  hoveredDot.value = dot
  updateTooltip(e)
}

function onDotMove(e) {
  updateTooltip(e)
}

function onDotLeave() {
  hoveredDot.value = null
}

function updateTooltip(e) {
  const rect = e.currentTarget.closest('.bird-radar').getBoundingClientRect()
  tooltipPos.value = {
    x: e.clientX - rect.left + 12,
    y: e.clientY - rect.top - 10
  }
}
</script>

<template>
  <div class="bird-radar" v-if="bird.panel">
    <svg viewBox="0 0 300 300" class="radar-svg">
      <!-- Axis lines -->
      <line
        v-for="(line, i) in axisLines"
        :key="'axis-' + i"
        :x1="line.x1" :y1="line.y1"
        :x2="line.x2" :y2="line.y2"
        stroke="rgba(255,255,255,0.12)"
        stroke-width="1"
      />

      <!-- Pentagon rings -->
      <polygon
        v-for="ring in rings"
        :key="'ring-' + ring.level"
        :points="ring.points"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        stroke-width="1"
      />

      <!-- Grade labels on top axis -->
      <text
        v-for="ring in rings"
        :key="'gl-' + ring.level"
        :x="cx + 4"
        :y="cy - maxR * ring.ratio + 4"
        fill="rgba(255,255,255,0.25)"
        font-size="9"
        font-family="inherit"
      >{{ ring.label }}</text>

      <!-- Data polygon -->
      <polygon
        :points="dataPoints"
        fill="rgba(59,130,246,0.2)"
        stroke="rgba(59,130,246,0.7)"
        stroke-width="2"
        stroke-linejoin="round"
      />

      <!-- Data dots -->
      <circle
        v-for="(dot, i) in dataDots"
        :key="'dot-' + i"
        :cx="dot.x" :cy="dot.y" r="5"
        fill="#fff"
        stroke="rgba(59,130,246,0.9)"
        stroke-width="2"
        class="data-dot"
        @mouseenter="onDotEnter(dot, $event)"
        @mousemove="onDotMove"
        @mouseleave="onDotLeave"
      />

      <!-- Axis labels -->
      <text
        v-for="(label, i) in labels"
        :key="'label-' + i"
        :x="labelPositions[i].x"
        :y="labelPositions[i].y"
        text-anchor="middle"
        dominant-baseline="central"
        fill="rgba(255,255,255,0.7)"
        font-size="12"
        font-family="inherit"
        letter-spacing="1"
      >{{ label }}</text>
    </svg>

    <!-- Tooltip -->
    <Transition name="tooltip-fade">
      <div
        v-if="hoveredDot"
        class="radar-tooltip"
        :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
      >
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
  left: 5%;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  pointer-events: auto;
}

.radar-svg {
  width: 280px;
  height: 280px;
  display: block;
}

.data-dot {
  cursor: pointer;
  transition: r 0.2s ease;
}

.data-dot:hover {
  r: 7;
}

.radar-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
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
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1px;
}

.tooltip-grade {
  font-size: 16px;
  font-weight: 600;
  color: rgba(59, 130, 246, 0.9);
  letter-spacing: 2px;
}

.tooltip-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 300;
  line-height: 1.4;
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.15s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .bird-radar {
    transform: translateY(-50%) scale(0.75);
    left: 2%;
  }
}
</style>
