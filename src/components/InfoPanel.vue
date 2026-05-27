<script setup>
import { computed } from 'vue'

const props = defineProps({
  bird: { type: Object, required: true },
  type: { type: String, required: true }
})

const emit = defineEmits(['close'])

const title = computed(() => {
  const titles = {
    factfile: 'Factfile',
    population: 'Population',
    where: 'Where'
  }
  return titles[props.type] || ''
})

const content = computed(() => {
  return props.bird[props.type] || ''
})
</script>

<template>
  <div class="info-panel">
    <div class="panel-header">
      <h2 class="panel-title">{{ title }}</h2>
      <button class="close-btn" @click="emit('close')">
        <span class="close-icon">&times;</span>
        <span class="close-text">Close</span>
      </button>
    </div>
    <div class="panel-body">
      <p class="panel-content">{{ content }}</p>
    </div>
  </div>
</template>

<style scoped>
.info-panel {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 700px;
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 32px;
  z-index: 10;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-title {
  font-size: 18px;
  font-weight: 300;
  letter-spacing: 4px;
  text-transform: uppercase;
}

.close-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.6);
  padding: 6px 16px;
  font-size: 12px;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.close-btn:hover {
  border-color: rgba(255, 255, 255, 0.5);
  color: #ffffff;
}

.close-icon {
  font-size: 18px;
  line-height: 1;
}

.panel-content {
  font-size: 15px;
  line-height: 1.8;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.8);
}

@media (max-width: 768px) {
  .info-panel {
    bottom: 60px;
    padding: 24px;
    width: 95%;
  }

  .panel-content {
    font-size: 14px;
  }
}
</style>
