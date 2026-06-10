<script setup>
import { ref, computed } from 'vue'
import { birds } from './data/birds.js'
import BirdViewer from './components/BirdViewer.vue'
import InfoPanel from './components/InfoPanel.vue'
import NavDots from './components/NavDots.vue'
import ArrowNav from './components/ArrowNav.vue'

const currentIndex = ref(0)
const activePanel = ref(null)
const blurAmount = ref(60)

const currentBird = computed(() => birds[currentIndex.value])

function goNext() {
  currentIndex.value = (currentIndex.value + 1) % birds.length
  activePanel.value = null
}

function goPrev() {
  currentIndex.value = (currentIndex.value - 1 + birds.length) % birds.length
  activePanel.value = null
}

function goTo(index) {
  currentIndex.value = index
  activePanel.value = null
}

function togglePanel(type) {
  activePanel.value = activePanel.value === type ? null : type
}

function closePanel() {
  activePanel.value = null
}
</script>

<template>
  <div class="app">
    <Transition name="fade-bg" mode="out-in">
      <div
        :key="currentBird.id"
        class="bg-blur"
        :style="{
          backgroundImage: `url(${currentBird.image})`,
          filter: `blur(${blurAmount}px) brightness(0.3)`
        }"
      ></div>
    </Transition>

    <div class="blur-control">
      <span class="blur-label">模糊</span>
      <input
        type="range"
        min="0"
        max="120"
        v-model.number="blurAmount"
        class="blur-slider"
      />
      <span class="blur-value">{{ blurAmount }}px</span>
    </div>

    <ArrowNav @prev="goPrev" @next="goNext" />

    <Transition name="fade" mode="out-in">
      <BirdViewer
        :key="currentBird.id"
        :bird="currentBird"
        :active-panel="activePanel"
        @toggle-panel="togglePanel"
      />
    </Transition>

    <Transition name="slide-up">
      <InfoPanel
        v-if="activePanel"
        :bird="currentBird"
        :type="activePanel"
        @close="closePanel"
      />
    </Transition>

    <NavDots
      :total="birds.length"
      :current="currentIndex"
      @go-to="goTo"
    />
  </div>
</template>

<style scoped>
.app {
  width: 100%;
  height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0d0d0d;
  overflow: hidden;
}

.bg-blur {
  position: absolute;
  inset: -40px;
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.fade-bg-enter-active,
.fade-bg-leave-active {
  transition: opacity 0.8s ease;
}

.fade-bg-enter-from,
.fade-bg-leave-to {
  opacity: 0;
}

.blur-control {
  position: absolute;
  top: 24px;
  left: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 20;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.blur-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1px;
  text-transform: uppercase;
  white-space: nowrap;
}

.blur-value {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  min-width: 40px;
  text-align: right;
}

.blur-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.blur-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: #ffffff;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.blur-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.blur-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #ffffff;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style>
