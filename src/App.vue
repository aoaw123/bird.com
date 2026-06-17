<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useSwipe, onKeyStroke } from '@vueuse/core'
import { birds } from './data/birds.js'
import BirdViewer from './components/BirdViewer.vue'
import InfoPanel from './components/InfoPanel.vue'
import NavDots from './components/NavDots.vue'
import ArrowNav from './components/ArrowNav.vue'
import WallpaperOverlay from './components/WallpaperOverlay.vue'
import GalleryViewer from './components/GalleryViewer.vue'
import BirdRadar from './components/BirdRadar.vue'
import VideoOverlay from './components/VideoOverlay.vue'
import DataOverlay from './components/DataOverlay.vue'
import KeyboardHints from './components/KeyboardHints.vue'
import IntroOverlay from './components/IntroOverlay.vue'
import AudioToggle from './components/AudioToggle.vue'

const showIntro = ref(true)
const currentIndex = ref(0)
const activePanel = ref(null)
const blurAmount = ref(0)
const showWallpaper = ref(false)
const showGallery = ref(false)
const showVideo = ref(false)
const showData = ref(false)

const currentBird = computed(() => birds[currentIndex.value])

// --- Intro ---
function onIntroComplete() {
  showIntro.value = false
  activePanel.value = 'factfile'
}

function onIntroKeydown(e) {
  if (showIntro.value && e.key !== 'Escape') {
    showIntro.value = false
  }
}

// --- Navigation ---
function goNext() {
  currentIndex.value = (currentIndex.value + 1) % birds.length
}

function goPrev() {
  currentIndex.value = (currentIndex.value - 1 + birds.length) % birds.length
}

function goTo(index) {
  currentIndex.value = index
}

function togglePanel(type) {
  activePanel.value = activePanel.value === type ? null : type
}

function closePanel() {
  activePanel.value = null
}

function openWallpaper() {
  showWallpaper.value = true
}

function closeWallpaper() {
  showWallpaper.value = false
}

function openGallery() {
  showGallery.value = true
}

function closeGallery() {
  showGallery.value = false
}

function openVideo() {
  showVideo.value = true
}

function closeVideo() {
  showVideo.value = false
}

function openData() {
  if (showVideo.value) closeVideo()
  showData.value = true
}

function closeData() {
  showData.value = false
}

// --- Keyboard navigation ---
onKeyStroke('ArrowLeft', () => {
  if (!showWallpaper.value && !showGallery.value && !showVideo.value && !showData.value) goPrev()
})

onKeyStroke('ArrowRight', () => {
  if (!showWallpaper.value && !showGallery.value && !showVideo.value && !showData.value) goNext()
})

onKeyStroke('Escape', () => {
  if (showData.value) {
    closeData()
  } else if (showVideo.value) {
    closeVideo()
  } else if (showGallery.value) {
    closeGallery()
  } else if (showWallpaper.value) {
    closeWallpaper()
  } else if (activePanel.value) {
    closePanel()
  }
})

onKeyStroke(' ', (e) => {
  if (!showWallpaper.value && !showGallery.value && !showVideo.value && !showData.value) {
    e.preventDefault()
    if (activePanel.value) {
      closePanel()
    } else {
      togglePanel('factfile')
    }
  }
})

// --- Mouse wheel navigation ---
let wheelTimeout = null
function onWheel(e) {
  if (showWallpaper.value || showGallery.value || showVideo.value || showData.value) return
  if (wheelTimeout) return
  wheelTimeout = setTimeout(() => { wheelTimeout = null }, 500)
  if (e.deltaY > 0) goNext()
  else if (e.deltaY < 0) goPrev()
}

// --- Swipe gesture (mobile) ---
const appContainer = ref(null)
const { direction } = useSwipe(appContainer, {
  onSwipeEnd() {
    if (showWallpaper.value || showGallery.value || showVideo.value || showData.value) return
    if (direction.value === 'left') {
      goNext()
    } else if (direction.value === 'right') {
      goPrev()
    }
  }
})

// --- Preload next bird image ---
function preloadImage(url) {
  const img = new Image()
  img.src = url
}

watch(currentIndex, (newIdx) => {
  const nextIdx = (newIdx + 1) % birds.length
  preloadImage(birds[nextIdx].image)
})

// Preload first next image on mount
onMounted(() => {
  preloadImage(birds[1].image)
  window.addEventListener('keydown', onIntroKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onIntroKeydown)
})
</script>

<template>
  <div ref="appContainer" class="app" @wheel="onWheel">
    <IntroOverlay v-if="showIntro" @complete="onIntroComplete" />

    <Transition name="fade-bg" mode="out-in" appear>
      <div
        :key="currentBird.id"
        class="bg-blur"
        :style="{
          backgroundImage: `url(${encodeURI(currentBird.image)})`,
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

    <Transition name="fade" mode="out-in" appear>
      <BirdViewer
        :key="currentBird.id"
        :bird="currentBird"
        :active-panel="activePanel"
        @toggle-panel="togglePanel"
        @open-wallpaper="openWallpaper"
        @open-gallery="openGallery"
        @open-video="openVideo"
        @open-data="openData"
      />
    </Transition>

    <Transition name="fade">
      <BirdRadar
        v-if="activePanel === 'factfile'"
        :bird="currentBird"
      />
    </Transition>

    <Transition name="slide-right">
      <InfoPanel
        v-if="activePanel"
        :bird="currentBird"
        :type="activePanel"
        @close="closePanel"
        @open-data="openData"
      />
    </Transition>

    <NavDots
      :total="birds.length"
      :current="currentIndex"
      @go-to="goTo"
    />

    <WallpaperOverlay
      v-if="showWallpaper"
      :bird="currentBird"
      @close="closeWallpaper"
    />

    <GalleryViewer
      v-if="showGallery"
      :bird="currentBird"
      @close="closeGallery"
    />

    <VideoOverlay
      v-if="showVideo"
      :bird="currentBird"
      @close="closeVideo"
    />

    <DataOverlay
      v-if="showData"
      :bird="currentBird"
      @close="closeData"
    />

    <KeyboardHints />
    <AudioToggle />
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
  touch-action: pan-y;
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
  transition: opacity 1.2s ease;
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
  gap: 18px;
  z-index: 20;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  padding: 15px 24px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 0.5;
  transition: opacity 0.4s ease;
}

.blur-control:hover {
  opacity: 0.9;
}

.blur-label {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1px;
  text-transform: uppercase;
  white-space: nowrap;
}

.blur-value {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.5);
  min-width: 50px;
  text-align: right;
}

.blur-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 150px;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.blur-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 21px;
  height: 21px;
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
