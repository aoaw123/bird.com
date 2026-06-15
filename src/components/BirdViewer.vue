<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  bird: { type: Object, required: true },
  activePanel: { type: String, default: null }
})

const emit = defineEmits(['toggle-panel', 'open-wallpaper', 'open-gallery'])

const imageLoaded = ref(false)
const imageError = ref(false)

// Reset state when bird changes
watch(() => props.bird.id, () => {
  imageLoaded.value = false
  imageError.value = false
})

function onImageLoad() {
  imageLoaded.value = true
}

function onImageError() {
  imageError.value = true
  imageLoaded.value = true
}

const buttons = [
  { key: 'factfile', label: '物种档案' },
  { key: 'wallpaper', label: 'Wallpaper' }
]
</script>

<template>
  <div class="bird-viewer">
    <div class="bird-image-wrapper" @click="emit('open-gallery')">
      <!-- Skeleton -->
      <div v-if="!imageLoaded" class="skeleton">
        <span class="skeleton-icon">🪶</span>
      </div>

      <!-- Fallback -->
      <div v-if="imageError" class="fallback">
        <span class="fallback-char">{{ bird.nameCN.charAt(0) }}</span>
      </div>

      <!-- Main image -->
      <img
        v-show="!imageError"
        :src="bird.image"
        :alt="bird.name"
        class="bird-image"
        :class="{ loaded: imageLoaded }"
        loading="lazy"
        @load="onImageLoad"
        @error="onImageError"
      />
    </div>

    <h1 class="bird-name">{{ bird.name }}</h1>
    <p class="bird-name-cn">{{ bird.nameCN }}</p>

    <div class="action-buttons">
      <button
        v-for="btn in buttons"
        :key="btn.key"
        class="action-btn"
        :class="{ active: activePanel === btn.key }"
        @click="btn.key === 'wallpaper' ? emit('open-wallpaper') : emit('toggle-panel', btn.key)"
      >
        {{ btn.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.bird-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  z-index: 1;
}

.bird-image-wrapper {
  width: 320px;
  height: 320px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  position: relative;
  cursor: pointer;
  transition: box-shadow 0.3s ease;
}

.bird-image-wrapper:hover {
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.6);
}

/* Skeleton */
.skeleton {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.06);
  animation: skeleton-pulse 1.8s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
}

.skeleton-icon {
  font-size: 48px;
  opacity: 0.3;
}

/* Fallback */
.fallback {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fallback-char {
  font-size: 80px;
  font-weight: 200;
  color: rgba(255, 255, 255, 0.15);
}

/* Image */
.bird-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 0.6s ease;
}

.bird-image.loaded {
  opacity: 1;
}

.bird-name {
  font-size: 28px;
  font-weight: 300;
  letter-spacing: 6px;
  text-transform: uppercase;
  margin-top: 8px;
}

.bird-name-cn {
  font-size: 14px;
  font-weight: 300;
  letter-spacing: 4px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: -12px;
}

.action-buttons {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.action-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.7);
  padding: 10px 28px;
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.action-btn:hover {
  border-color: rgba(255, 255, 255, 0.6);
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
}

.action-btn:active {
  transform: scale(0.95);
}

.action-btn.active {
  border-color: #ffffff;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .bird-image-wrapper {
    width: 240px;
    height: 240px;
  }

  .bird-name {
    font-size: 20px;
    letter-spacing: 4px;
  }

  .action-buttons {
    gap: 10px;
  }

  .action-btn {
    padding: 8px 18px;
    font-size: 11px;
  }
}
</style>
