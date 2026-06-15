<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  bird: { type: Object, required: true }
})

const emit = defineEmits(['close'])

const isVisible = ref(false)

function handleKeydown(e) {
  if (e.key === 'Escape') {
    handleClose()
  }
}

function handleClose() {
  isVisible.value = false
  setTimeout(() => {
    emit('close')
  }, 400)
}

function openDouyin() {
  window.open(props.bird.video, '_blank')
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
    <div class="video-overlay" :class="{ visible: isVisible }" @click.self="handleClose">
      <div class="video-content">
        <!-- Close button -->
        <button class="video-close" @click="handleClose">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Bird name -->
        <div class="video-header">
          <h2 class="video-bird-name">{{ bird.name }}</h2>
          <p class="video-bird-name-cn">{{ bird.nameCN }}</p>
        </div>

        <!-- Video preview card -->
        <div class="video-card">
          <div class="video-placeholder">
            <div class="play-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <span class="video-label">视频预览</span>
          </div>
        </div>

        <!-- Action button -->
        <button class="douyin-btn" @click="openDouyin">
          <span class="douyin-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.82a8.16 8.16 0 0 0 4.76 1.52V6.69z"/>
            </svg>
          </span>
          在抖音观看
        </button>

        <!-- Description -->
        <p class="video-desc">鸟类数量稀少，野外影像珍贵</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.video-overlay {
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

.video-overlay.visible {
  opacity: 1;
  pointer-events: auto;
}

.video-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 480px;
  padding: 40px 20px;
  position: relative;
  transform: scale(0.95);
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.video-overlay.visible .video-content {
  transform: scale(1);
}

.video-close {
  position: absolute;
  top: 0;
  right: 0;
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

.video-close:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.video-close:active {
  transform: scale(0.95);
}

.video-header {
  text-align: center;
}

.video-bird-name {
  font-size: 24px;
  font-weight: 300;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin: 0;
}

.video-bird-name-cn {
  font-size: 14px;
  font-weight: 300;
  letter-spacing: 3px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 8px;
}

.video-card {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.play-icon {
  color: rgba(255, 255, 255, 0.4);
  transition: color 0.3s ease;
}

.video-card:hover .play-icon {
  color: rgba(255, 255, 255, 0.7);
}

.video-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 2px;
}

.douyin-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #fe2c55, #25f4ee);
  border: none;
  color: #ffffff;
  padding: 14px 32px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 1px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.douyin-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(254, 44, 85, 0.3);
}

.douyin-btn:active {
  transform: scale(0.97);
}

.douyin-icon {
  display: flex;
  align-items: center;
}

.video-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 1px;
  text-align: center;
}

@media (max-width: 768px) {
  .video-content {
    padding: 20px 16px;
    gap: 20px;
  }

  .video-bird-name {
    font-size: 18px;
    letter-spacing: 3px;
  }

  .video-close {
    top: -4px;
    right: -4px;
  }

  .douyin-btn {
    padding: 12px 24px;
    font-size: 13px;
  }
}
</style>
