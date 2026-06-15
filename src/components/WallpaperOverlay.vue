<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  bird: { type: Object, required: true }
})

const emit = defineEmits(['close'])

const currentImageIndex = ref(0)
const isVisible = ref(false)
const isContentVisible = ref(false)

// Get images from public folder based on bird id
const images = computed(() => {
  const id = props.bird.id
  const folderName = `${id}. ${props.bird.nameCN}`
  // For now, use placeholder - will need to copy images to public folder
  return [
    `/birds/${folderName}/1.jpg`,
    `/birds/${folderName}/2.jpg`,
    `/birds/${folderName}/3.jpg`,
    `/birds/${folderName}/4.jpg`,
    `/birds/${folderName}/5.jpg`
  ]
})

const currentImage = computed(() => images.value[currentImageIndex.value])

function nextImage() {
  currentImageIndex.value = (currentImageIndex.value + 1) % images.value.length
}

function prevImage() {
  currentImageIndex.value = (currentImageIndex.value - 1 + images.value.length) % images.value.length
}

let wheelTimer = null
function handleWheel(e) {
  if (wheelTimer) return
  wheelTimer = setTimeout(() => { wheelTimer = null }, 300)
  if (e.deltaY > 0) nextImage()
  else if (e.deltaY < 0) prevImage()
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    handleClose()
  } else if (e.key === 'ArrowRight') {
    nextImage()
  } else if (e.key === 'ArrowLeft') {
    prevImage()
  }
}

function handleImageClick(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const halfWidth = rect.width / 2
  if (clickX < halfWidth) {
    prevImage()
  } else {
    nextImage()
  }
}

function handleClose() {
  isContentVisible.value = false
  setTimeout(() => {
    isVisible.value = false
    setTimeout(() => {
      emit('close')
    }, 600)
  }, 200)
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  // Trigger animation
  requestAnimationFrame(() => {
    isVisible.value = true
    setTimeout(() => {
      isContentVisible.value = true
    }, 300)
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      class="wallpaper-overlay"
      :class="{ visible: isVisible }"
      @click.self="handleClose"
      @wheel="handleWheel"
    >
      <div class="content" :class="{ visible: isContentVisible }">
        <div class="header">
          <h2 class="title">{{ bird.nameCN }}</h2>
          <p class="subtitle">{{ bird.name }}</p>
        </div>

        <div class="image-viewer">
          <button class="nav-btn prev" @click="prevImage">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <div class="image-wrapper" @click="handleImageClick">
            <img :src="currentImage" :alt="bird.nameCN" class="image" />
          </div>

          <button class="nav-btn next" @click="nextImage">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <div class="image-counter">
          {{ currentImageIndex + 1 }} / {{ images.length }}
        </div>

        <div class="download-section">
          <p class="download-title">下载壁纸</p>
          <div class="download-options">
            <a :href="currentImage" download class="download-link">
              <span class="link-label">MacBook</span>
              <span class="link-size">1440x900</span>
            </a>
            <a :href="currentImage" download class="download-link">
              <span class="link-label">Large Desktop</span>
              <span class="link-size">1920x1080</span>
            </a>
            <a :href="currentImage" download class="download-link">
              <span class="link-label">Small Desktop</span>
              <span class="link-size">1366x768</span>
            </a>
          </div>
        </div>

        <button class="close-btn" @click="handleClose">
          <span class="close-icon">&times;</span>
          <span class="close-text">关闭</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.wallpaper-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.055);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

.wallpaper-overlay.visible {
  opacity: 1;
  pointer-events: auto;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.content.visible {
  opacity: 1;
  transform: translateY(0);
}

.header {
  text-align: center;
}

.title {
  font-size: 28px;
  font-weight: 300;
  letter-spacing: 8px;
  color: rgba(0, 0, 0, 0.85);
}

.subtitle {
  font-size: 14px;
  font-weight: 300;
  letter-spacing: 4px;
  color: rgba(0, 0, 0, 0.45);
  font-style: italic;
  margin-top: 4px;
}

.image-viewer {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-btn {
  background: rgba(0, 0, 0, 0.08);
  border: 2px solid rgba(0, 0, 0, 0.2);
  color: rgba(0, 0, 0, 0.6);
  width: 100px;
  height: 100px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.nav-btn:hover {
  background: rgba(0, 0, 0, 0.15);
  border-color: rgba(0, 0, 0, 0.4);
  color: rgba(0, 0, 0, 0.9);
  transform: scale(1.05);
}

.image-wrapper {
  width: 850px;
  height: 550px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-counter {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.4);
  letter-spacing: 2px;
}

.download-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.download-title {
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 6px;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.6);
}

.download-options {
  display: flex;
  gap: 16px;
}

.download-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 28px;
  background: rgba(0, 0, 0, 0.06);
  border: 2px solid rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.download-link:hover {
  background: rgba(0, 0, 0, 0.12);
  border-color: rgba(0, 0, 0, 0.35);
  transform: translateY(-2px);
}

.link-label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.8);
  letter-spacing: 2px;
}

.link-size {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  letter-spacing: 1px;
}

.close-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.15);
  color: rgba(0, 0, 0, 0.5);
  padding: 8px 20px;
  font-size: 12px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  margin-top: 8px;
}

.close-btn:hover {
  border-color: rgba(0, 0, 0, 0.3);
  color: rgba(0, 0, 0, 0.8);
}

.close-icon {
  font-size: 18px;
  line-height: 1;
}

@media (max-width: 768px) {
  .image-wrapper {
    width: 90vw;
    height: 60vw;
  }

  .download-options {
    flex-direction: column;
  }
}
</style>
