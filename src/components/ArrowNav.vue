<script setup>
const emit = defineEmits(['prev', 'next'])
</script>

<template>
  <div class="arrow-nav">
    <button class="arrow-btn prev" @click="emit('prev')">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
    <button class="arrow-btn next" @click="emit('next')">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.arrow-nav {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 30px;
  pointer-events: none;
  z-index: 5;
}

.arrow-btn {
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.5);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.arrow-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
  color: #ffffff;
}

@media (max-width: 768px) {
  .arrow-nav {
    padding: 0 15px;
  }

  .arrow-btn {
    width: 40px;
    height: 40px;
  }

  .arrow-btn svg {
    width: 18px;
    height: 18px;
  }
}
</style>
