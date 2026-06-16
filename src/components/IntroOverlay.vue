<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['complete'])

const phase = ref(0) // 0=loading, 1=text1, 2=text2, 3=text3, 4=cta
const exiting = ref(false)

const lines = [
  { text: '10 种中国珍稀鸟类', delay: 600 },
  { text: '10 段碎片化的生存故事', delay: 1400 },
  { text: '在这里，拼合它们的命运', delay: 2200 },
]

onMounted(() => {
  // Phase 0 → 1 after initial load
  setTimeout(() => { phase.value = 1 }, 800)
  // Phase 1 → 2
  setTimeout(() => { phase.value = 2 }, 2000)
  // Phase 2 → 3
  setTimeout(() => { phase.value = 3 }, 3200)
  // Phase 3 → 4 (show CTA)
  setTimeout(() => { phase.value = 4 }, 4400)
})

function enter() {
  exiting.value = true
  setTimeout(() => emit('complete'), 600)
}
</script>

<template>
  <Teleport to="body">
    <div class="intro-overlay" :class="{ exiting }">
      <!-- Background particles -->
      <div class="particles">
        <div v-for="i in 20" :key="i" class="particle" :style="{
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          animationDelay: Math.random() * 3 + 's',
          animationDuration: (3 + Math.random() * 4) + 's',
          opacity: 0.1 + Math.random() * 0.2,
          transform: `scale(${0.3 + Math.random() * 0.7})`
        }">🪶</div>
      </div>

      <!-- Loading -->
      <div v-if="phase === 0" class="loading">
        <div class="feather-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8">
            <path d="M12 2C8 6 4 10 4 14c0 4.4 3.6 8 8 8s8-3.6 8-8c0-4-4-8-8-12z" opacity="0.3"/>
            <path d="M12 2c-1.5 2-3 4-4 6.5C6.5 11 6 13.5 7 16"/>
            <path d="M15 6c-1 2-2.5 4-3 7-.5 3 0 5.5 1.5 7.5"/>
          </svg>
        </div>
        <p class="loading-text">正在生成碎片...</p>
      </div>

      <!-- Text lines -->
      <div v-if="phase >= 1" class="intro-text">
        <p
          v-for="(line, i) in lines"
          :key="i"
          class="intro-line"
          :class="{ visible: phase > i, exit: phase > i + 1 && phase < 4 }"
        >
          <span v-for="(char, j) in line.text.split('')" :key="j" class="char" :style="{ animationDelay: (i * 600) + (j * 40) + 'ms' }">
            {{ char === ' ' ? '\u00A0' : char }}
          </span>
        </p>
      </div>

      <!-- CTA Button -->
      <div v-if="phase === 4" class="cta">
        <button class="enter-btn" @click="enter">
          <span>进入展览</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
        <p class="skip-hint">或按任意键进入</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.intro-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #0a0a0a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.intro-overlay.exiting {
  opacity: 0;
  pointer-events: none;
}

/* Particles */
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.particle {
  position: absolute;
  font-size: 24px;
  animation: float-up 6s ease-in-out infinite;
  filter: blur(0.5px);
}
@keyframes float-up {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.1; }
  50% { transform: translateY(-40px) rotate(15deg); opacity: 0.2; }
}

/* Loading */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  animation: fade-in 0.6s ease;
}
.feather-icon {
  color: rgba(255,255,255,0.4);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}
.loading-text {
  font-size: 13px;
  letter-spacing: 4px;
  color: rgba(255,255,255,0.3);
  text-transform: uppercase;
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Intro text */
.intro-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}
.intro-line {
  font-size: 22px;
  font-weight: 200;
  letter-spacing: 6px;
  color: rgba(255,255,255,0.15);
  transition: color 0.6s ease;
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  justify-content: center;
}
.intro-line.visible {
  color: rgba(255,255,255,0.9);
}
.intro-line.exit {
  color: rgba(255,255,255,0.2);
}
.char {
  display: inline-block;
  animation: char-in 0.4s ease both;
}
@keyframes char-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* CTA */
.cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 48px;
  animation: fade-in 0.6s ease 0.2s both;
}
.enter-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
  padding: 14px 40px;
  font-size: 15px;
  font-weight: 300;
  letter-spacing: 4px;
  cursor: pointer;
  transition: all 0.4s ease;
  font-family: inherit;
}
.enter-btn:hover {
  border-color: rgba(255,255,255,0.7);
  background: rgba(255,255,255,0.05);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.3);
}
.enter-btn:active {
  transform: scale(0.97);
}
.skip-hint {
  font-size: 11px;
  color: rgba(255,255,255,0.2);
  letter-spacing: 2px;
}

@media (max-width: 768px) {
  .intro-line {
    font-size: 16px;
    letter-spacing: 4px;
  }
  .intro-text {
    gap: 24px;
  }
  .enter-btn {
    padding: 12px 30px;
    font-size: 14px;
    letter-spacing: 3px;
  }
  .particle {
    font-size: 18px;
  }
}
</style>
