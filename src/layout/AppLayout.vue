<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTimerStore } from '@/stores/timer'
import { formatHms } from '@/utils/date'

interface NavItem {
  path: string
  title: string
  icon: string
}

const navItems: NavItem[] = [
  { path: '/dashboard', title: '学习看板', icon: '📊' },
  { path: '/plans', title: '学习计划', icon: '🎯' },
  { path: '/focus', title: '专注计时', icon: '⏱️' },
  { path: '/logs', title: '学习日志', icon: '📝' },
  { path: '/cards', title: '知识卡片', icon: '📚' },
  { path: '/review', title: '卡片复习', icon: '🔁' },
  { path: '/challenges', title: '学习挑战', icon: '🏅' },
  { path: '/leaderboard', title: '排行榜', icon: '🏆' },
  { path: '/profile', title: '个人中心', icon: '👤' },
]

const route = useRoute()
const router = useRouter()
const timerStore = useTimerStore()
const activePath = computed(() => route.path)

/** 在其他页面时显示悬浮计时条，提示计时仍在进行 */
const showTimerChip = computed(() => timerStore.isActive && route.path !== '/focus')
const timerChipText = computed(() => formatHms(timerStore.elapsedMs))

function navigate(path: string): void {
  router.push(path)
}

/** 计时进行中关闭/刷新页面前，提示是否放弃本次计时 */
function onBeforeUnload(event: BeforeUnloadEvent): void {
  if (timerStore.isActive) {
    event.preventDefault()
    event.returnValue = ''
  }
}

onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
</script>

<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="brand">
        <span class="brand-icon">🏠</span>
        <span class="brand-text">知识管家</span>
      </div>
      <el-menu :default-active="activePath" class="menu" @select="navigate">
        <el-menu-item v-for="item in navItems" :key="item.path" :index="item.path">
          <span class="menu-icon">{{ item.icon }}</span>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-main class="main">
      <router-view />
    </el-main>

    <div
      v-if="showTimerChip"
      class="timer-chip"
      :class="{ paused: timerStore.status === 'paused' }"
      @click="navigate('/focus')"
    >
      <span class="timer-chip-dot" />
      <span>{{ timerStore.status === 'paused' ? '已暂停' : '专注中' }} {{ timerChipText }}</span>
    </div>
  </el-container>
</template>

<style scoped>
.layout {
  min-height: 100vh;
}

.aside {
  background: #1f2d3d;
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 16px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.brand-icon {
  font-size: 24px;
}

.menu {
  border-right: none;
  background: transparent;
  flex: 1;
}

.menu :deep(.el-menu-item) {
  color: #c0ccda;
}

.menu :deep(.el-menu-item.is-active) {
  background: #2b3a4a;
  color: #fff;
}

.menu :deep(.el-menu-item:hover) {
  background: #273444;
}

.menu-icon {
  margin-right: 8px;
}

.main {
  background: #f5f7fa;
  padding: 24px;
}

.timer-chip {
  position: fixed;
  right: 24px;
  bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 20px;
  background: #1f2d3d;
  color: #fff;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.timer-chip.paused {
  background: #6b7280;
}

.timer-chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #67c23a;
  animation: timer-chip-blink 1.2s infinite;
}

.timer-chip.paused .timer-chip-dot {
  background: #e6a23c;
  animation: none;
}

@keyframes timer-chip-blink {
  50% {
    opacity: 0.3;
  }
}
</style>
