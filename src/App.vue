<script setup>
import { ref, computed } from 'vue'
import { birds } from './data/birds.js'
import BirdViewer from './components/BirdViewer.vue'
import InfoPanel from './components/InfoPanel.vue'
import NavDots from './components/NavDots.vue'
import ArrowNav from './components/ArrowNav.vue'

const currentIndex = ref(0)
const activePanel = ref(null)

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
</style>
