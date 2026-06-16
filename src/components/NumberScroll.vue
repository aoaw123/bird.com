<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  target: { type: Number, required: true }
})

const display = ref('0')

function animate(from, to, duration = 1800) {
  const start = performance.now()
  const easeOut = t => 1 - Math.pow(1 - t, 3) // cubic ease-out

  function tick(now) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    const eased = easeOut(progress)
    const current = Math.round(from + (to - from) * eased)
    display.value = current.toLocaleString()
    if (progress < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

watch(() => props.target, (val, old) => {
  if (old === undefined) return
  animate(0, val)
})

onMounted(() => {
  animate(0, props.target)
})
</script>

<template>
  <span class="number-scroll">{{ display }}</span>
</template>

<style scoped>
.number-scroll {
  font-size: 42px;
  font-weight: 200;
  letter-spacing: 3px;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
  display: inline-block;
  line-height: 1;
}
</style>
