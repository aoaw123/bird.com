<script setup>
import { ref } from 'vue'

const showHints = ref(false)
</script>

<template>
  <div class="keyboard-hints" @mouseenter="showHints = true" @mouseleave="showHints = false">
    <div class="hint-icon">
      <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
        <line x1="6" y1="10" x2="6" y2="10"></line>
        <line x1="10" y1="10" x2="10" y2="10"></line>
        <line x1="14" y1="10" x2="14" y2="10"></line>
        <line x1="18" y1="10" x2="18" y2="10"></line>
        <line x1="8" y1="14" x2="16" y2="14"></line>
      </svg>
    </div>

    <Transition name="hint-fade">
      <div v-if="showHints" class="hint-popup">
        <div class="hint-item">
          <kbd>←</kbd><kbd>→</kbd>
          <span>切换鸟类</span>
        </div>
        <div class="hint-item">
          <kbd>🖱️</kbd>
          <span>滚轮切换</span>
        </div>
        <div class="hint-item">
          <kbd>Space</kbd>
          <span>切换面板</span>
        </div>
        <div class="hint-item">
          <kbd>Esc</kbd>
          <span>关闭面板</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.keyboard-hints {
  position: absolute;
  bottom: 20px;
  right: 28px;
  z-index: 15;
}

.hint-icon {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
  cursor: default;
  transition: all 0.3s ease;
}

.keyboard-hints:hover .hint-icon {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
}

.hint-popup {
  position: absolute;
  bottom: 66px;
  right: 0;
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 18px 24px;
  white-space: nowrap;
  min-width: 180px;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.5);
}

.hint-item kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 30px;
  padding: 0 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 5px;
  font-size: 14px;
  font-family: inherit;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.5px;
}

.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@media (max-width: 768px) {
  .keyboard-hints {
    display: none;
  }
}
</style>
