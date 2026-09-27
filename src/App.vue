<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useAchievementsStore } from '@/stores/achievements'
import { useCardsStore } from '@/stores/cards'
import { useFocusStore } from '@/stores/focus'
import { useLogsStore } from '@/stores/logs'
import { usePlansStore } from '@/stores/plans'

const achievementsStore = useAchievementsStore()
const plansStore = usePlansStore()
const logsStore = useLogsStore()
const cardsStore = useCardsStore()
const focusStore = useFocusStore()

// 数据变更后统一扫描成就解锁，避免实体 store 反向依赖成就 store
watch(
  [() => plansStore.plans, () => logsStore.logs, () => cardsStore.cards],
  () => achievementsStore.checkAll(),
  { deep: true, immediate: true },
)

// 计时会话存在时，关闭/刷新页面前提示，避免误丢计时
function onBeforeUnload(event: BeforeUnloadEvent): void {
  if (focusStore.session) {
    event.preventDefault()
    // 兼容旧版浏览器：部分内核只认 returnValue
    event.returnValue = ''
  }
}

onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
</script>

<template>
  <router-view />
</template>

<style>
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  color: #303133;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #1f2d3d;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
</style>
