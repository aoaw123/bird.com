<script setup>
const props = defineProps({
  total: { type: Number, required: true },
  current: { type: Number, required: true }
})

const emit = defineEmits(['go-to'])
</script>

<template>
  <div class="nav-dots">
    <button
      v-for="i in total"
      :key="i"
      class="dot"
      :class="{ active: current === i - 1 }"
      @click="emit('go-to', i - 1)"
    >
      <span class="dot-inner"></span>
    </button>
  </div>
</template>

<style scoped>
.nav-dots {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  z-index: 5;
}

.dot {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.dot-inner {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dot:hover .dot-inner {
  background: rgba(255, 255, 255, 0.5);
  transform: scale(1.3);
}

.dot.active .dot-inner {
  background: #ffffff;
  transform: scale(1.5);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .nav-dots {
    gap: 8px;
    bottom: 20px;
  }

  .dot {
    width: 28px;
    height: 28px;
  }
}
</style>
