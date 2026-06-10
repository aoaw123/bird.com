<script setup>
import { computed } from 'vue'

const props = defineProps({
  bird: { type: Object, required: true },
  type: { type: String, required: true }
})

const emit = defineEmits(['close'])

const title = computed(() => {
  const titles = {
    factfile: '物种档案',
    population: '种群数量',
    where: '分布区域'
  }
  return titles[props.type] || ''
})

const content = computed(() => {
  if (props.type === 'factfile') return props.bird.factfile.description
  return props.bird[props.type] || ''
})

const stats = computed(() => props.bird.factfile?.stats || {})
const status = computed(() => props.bird.factfile?.status || '')
const tags = computed(() => props.bird.factfile?.tags || [])

const statLabels = {
  wingspan: '翼展',
  weight: '体重',
  lifespan: '寿命',
  diet: '食性'
}
</script>

<template>
  <div class="info-panel">
    <div class="panel-header">
      <h2 class="panel-title">{{ title }}</h2>
      <button class="close-btn" @click="emit('close')">
        <span class="close-icon">&times;</span>
        <span class="close-text">关闭</span>
      </button>
    </div>

    <div v-if="type === 'factfile'" class="panel-body-factfile">
      <div class="stats-grid">
        <div v-for="(value, key) in stats" :key="key" class="stat-item">
          <span class="stat-label">{{ statLabels[key] }}</span>
          <span class="stat-value">{{ value }}</span>
        </div>
      </div>

      <div class="status-row">
        <span class="status-badge">{{ status }}</span>
        <div class="tags">
          <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>

      <p class="panel-content">{{ content }}</p>
    </div>

    <div v-else class="panel-body">
      <p class="panel-content">{{ content }}</p>
    </div>
  </div>
</template>

<style scoped>
.info-panel {
  position: absolute;
  top: 50%;
  right: 5%;
  transform: translateY(-50%);
  width: 380px;
  max-height: 70vh;
  overflow-y: auto;
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 28px;
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

.panel-body-factfile {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 1px;
}

.stat-value {
  font-size: 15px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
}

.status-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-badge {
  padding: 4px 12px;
  background: rgba(255, 100, 100, 0.2);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 4px;
  font-size: 12px;
  color: #ff8888;
  letter-spacing: 1px;
}

.tags {
  display: flex;
  gap: 8px;
}

.tag {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
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

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .panel-content {
    font-size: 14px;
  }
}
</style>
