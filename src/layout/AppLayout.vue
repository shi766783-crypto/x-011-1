<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatHms } from '@/utils/date'
import { useFocusStore } from '@/stores/focus'

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
const focusStore = useFocusStore()
const activePath = computed(() => route.path)

// 计时进行中且不在计时页时，显示悬浮计时条，点击可回到计时页
const showIndicator = computed(() => focusStore.session !== null && route.path !== '/focus')
const indicatorTime = computed(() => formatHms(focusStore.elapsedMs))

function navigate(path: string): void {
  router.push(path)
}
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
      v-if="showIndicator"
      class="focus-indicator"
      :class="{ paused: !focusStore.running }"
      title="返回专注计时"
      @click="navigate('/focus')"
    >
      <span class="pulse" />
      <span class="time">{{ indicatorTime }}</span>
      <span v-if="!focusStore.running" class="state">已暂停</span>
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

.focus-indicator {
  position: fixed;
  top: 16px;
  right: 24px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background: #1f2d3d;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 2px 12px rgb(0 0 0 / 20%);
  font-variant-numeric: tabular-nums;
}

.focus-indicator:hover {
  background: #2b3a4a;
}

.focus-indicator .pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #67c23a;
  animation: pulse 1.5s ease-in-out infinite;
}

.focus-indicator.paused .pulse {
  background: #e6a23c;
  animation: none;
}

.focus-indicator .state {
  font-size: 12px;
  color: #e6a23c;
}

@keyframes pulse {
  50% {
    opacity: 0.3;
  }
}
</style>
