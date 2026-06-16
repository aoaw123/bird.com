<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  bird: { type: Object, required: true }
})

const emit = defineEmits(['close'])

const isVisible = ref(false)

function handleKeydown(e) {
  if (e.key === 'Escape') handleClose()
}

function handleClose() {
  isVisible.value = false
  setTimeout(() => emit('close'), 400)
}

function openDouyin() {
  window.open(props.bird.video, '_blank')
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  requestAnimationFrame(() => { isVisible.value = true })
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="video-overlay" :class="{ visible: isVisible }" @click.self="handleClose">
      <div class="video-content">
        <button class="video-close" @click="handleClose">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div class="video-header">
          <p class="video-label">野外实录</p>
          <h2 class="video-bird-name">{{ bird.nameCN }}</h2>
          <p class="video-bird-sub">{{ bird.name }}</p>
        </div>

        <!-- Preview card using bird's image -->
        <div class="video-preview" @click="openDouyin">
          <img
            :src="bird.image"
            :alt="bird.nameCN"
            class="video-thumb"
          />
          <div class="play-overlay">
            <div class="play-circle">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span class="play-text">点击播放</span>
          </div>
        </div>

        <button class="douyin-btn" @click="openDouyin">
          <span class="douyin-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.82a8.16 8.16 0 0 0 4.76 1.52V6.69z"/>
            </svg>
          </span>
          在抖音观看
        </button>

        <p class="video-hint">点击视频预览或按钮，在新标签页打开抖音</p>
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
  backdrop-filter: blur(12px);
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
  gap: 20px;
  width: 100%;
  max-width: 460px;
  padding: 36px 24px;
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
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.5);
  width: 36px; height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 10;
}
.video-close:hover {
  background: rgba(255,255,255,0.12);
  color: #fff;
}
.video-header {
  text-align: center;
}
.video-label {
  font-size: 11px;
  color: rgba(255,255,255,0.35);
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0 0 6px;
}
.video-bird-name {
  font-size: 22px;
  font-weight: 300;
  letter-spacing: 3px;
  margin: 0;
}
.video-bird-sub {
  font-size: 13px;
  font-weight: 300;
  color: rgba(255,255,255,0.4);
  letter-spacing: 2px;
  margin: 4px 0 0;
}
.video-preview {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}
.video-preview:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}
.video-preview:hover .play-overlay {
  background: rgba(0,0,0,0.3);
}
.video-preview:hover .play-circle {
  transform: scale(1.1);
}
.video-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background 0.3s;
}
.play-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;
}
.play-circle svg {
  margin-left: 3px;
}
.play-text {
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  letter-spacing: 2px;
}
.douyin-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #fe2c55, #25f4ee);
  border: none;
  color: #fff;
  padding: 14px 36px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 1px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
}
.douyin-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(254,44,85,0.3);
}
.douyin-btn:active {
  transform: scale(0.97);
}
.douyin-icon {
  display: flex;
}
.video-hint {
  font-size: 11px;
  color: rgba(255,255,255,0.25);
  letter-spacing: 1px;
  text-align: center;
  margin: 0;
}

@media (max-width: 768px) {
  .video-content {
    padding: 24px 16px;
    gap: 16px;
  }
  .video-bird-name {
    font-size: 18px;
  }
  .douyin-btn {
    padding: 12px 24px;
    font-size: 13px;
  }
}
</style>
