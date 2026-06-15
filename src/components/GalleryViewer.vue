<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  bird: { type: Object, required: true }
})

const emit = defineEmits(['close'])

const currentIndex = ref(0)
const imageLoaded = ref(false)
const imageError = ref(false)
const isVisible = ref(false)

// Combine main image + gallery
const images = computed(() => {
  const list = [props.bird.image]
  if (props.bird.gallery && props.bird.gallery.length) {
    list.push(...props.bird.gallery)
  }
  return list
})

const currentImage = computed(() => images.value[currentIndex.value])

// Reset image state on index change
watch(currentIndex, () => {
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

function next() {
  currentIndex.value = (currentIndex.value + 1) % images.value.length
}

function prev() {
  currentIndex.value = (currentIndex.value - 1 + images.value.length) % images.value.length
}

function goTo(index) {
  currentIndex.value = index
}

function handleImageClick(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  if (clickX < rect.width / 2) {
    prev()
  } else {
    next()
  }
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    handleClose()
  } else if (e.key === 'ArrowRight') {
    next()
  } else if (e.key === 'ArrowLeft') {
    prev()
  }
}

function handleClose() {
  isVisible.value = false
  setTimeout(() => {
    emit('close')
  }, 400)
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  requestAnimationFrame(() => {
    isVisible.value = true
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="gallery-overlay" :class="{ visible: isVisible }" @click.self="handleClose">
      <div class="gallery-content">
        <!-- Close button -->
        <button class="gallery-close" @click="handleClose">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Image area -->
        <div class="gallery-image-area">
          <button class="gallery-arrow prev" @click.stop="prev">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <div class="gallery-image-wrapper" @click="handleImageClick">
            <!-- Skeleton -->
            <div v-if="!imageLoaded" class="gallery-skeleton">
              <span class="gallery-skeleton-icon">🪶</span>
            </div>

            <!-- Fallback -->
            <div v-if="imageError" class="gallery-fallback">
              <span class="gallery-fallback-char">{{ bird.nameCN.charAt(0) }}</span>
            </div>

            <img
              v-show="!imageError"
              :src="currentImage"
              :alt="bird.nameCN"
              class="gallery-image"
              :class="{ loaded: imageLoaded }"
              loading="lazy"
              @load="onImageLoad"
              @error="onImageError"
            />
          </div>

          <button class="gallery-arrow next" @click.stop="next">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <!-- Dot indicators -->
        <div class="gallery-dots">
          <button
            v-for="(img, idx) in images"
            :key="idx"
            class="gallery-dot"
            :class="{ active: currentIndex === idx }"
            @click="goTo(idx)"
          >
            <span class="gallery-dot-inner"></span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.gallery-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.gallery-overlay.visible {
  opacity: 1;
  pointer-events: auto;
}

.gallery-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 1000px;
  padding: 20px;
  position: relative;
}

.gallery-close {
  position: absolute;
  top: 0;
  right: 20px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.6);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10;
}

.gallery-close:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.gallery-close:active {
  transform: scale(0.95);
}

.gallery-image-area {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
}

.gallery-arrow {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.5);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.gallery-arrow.prev:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  transform: translateX(-3px);
}

.gallery-arrow.next:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  transform: translateX(3px);
}

.gallery-arrow:active {
  transform: scale(0.95);
}

.gallery-image-wrapper {
  flex: 1;
  height: 65vh;
  min-height: 300px;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
}

.gallery-skeleton {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.04);
  animation: skeleton-pulse 1.8s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery-skeleton-icon {
  font-size: 48px;
  opacity: 0.3;
}

.gallery-fallback {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery-fallback-char {
  font-size: 100px;
  font-weight: 200;
  color: rgba(255, 255, 255, 0.1);
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.gallery-image.loaded {
  opacity: 1;
}

.gallery-dots {
  display: flex;
  gap: 10px;
}

.gallery-dot {
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.gallery-dot-inner {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.gallery-dot:hover .gallery-dot-inner {
  background: rgba(255, 255, 255, 0.5);
}

.gallery-dot.active .gallery-dot-inner {
  background: #ffffff;
  transform: scale(1.4);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .gallery-image-wrapper {
    height: 50vh;
  }

  .gallery-arrow {
    width: 36px;
    height: 36px;
  }

  .gallery-arrow svg {
    width: 20px;
    height: 20px;
  }

  .gallery-content {
    padding: 10px;
  }

  .gallery-close {
    top: -4px;
    right: 4px;
  }
}
</style>
