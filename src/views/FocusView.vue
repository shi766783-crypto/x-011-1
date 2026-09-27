<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePlansStore } from '@/stores/plans'
import { useTimerStore } from '@/stores/timer'
import { formatHms } from '@/utils/date'

const router = useRouter()
const plansStore = usePlansStore()
const timerStore = useTimerStore()

const setup = reactive({
  content: '',
  planId: '',
})
const contentError = ref('')

const isIdle = computed(() => timerStore.status === 'idle')
const display = computed(() => formatHms(timerStore.elapsedMs))
const planName = computed(
  () => plansStore.plans.find((p) => p.id === timerStore.planId)?.name ?? '',
)

function start(): void {
  if (!setup.content.trim()) {
    contentError.value = '请先填写本次要学习的内容'
    return
  }
  contentError.value = ''
  timerStore.start({ content: setup.content.trim(), planId: setup.planId || undefined })
}

function finish(): void {
  const elapsedText = display.value
  timerStore.finish()
  ElMessage.success(`本次专注 ${elapsedText}，已带入日志表单`)
  router.push('/logs')
}

async function giveUp(): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `已计时 ${display.value}，放弃后本次计时不会被记录。`,
      '放弃本次计时？',
      { confirmButtonText: '放弃', cancelButtonText: '继续计时', type: 'warning' },
    )
  } catch {
    return
  }
  timerStore.discard()
  ElMessage.info('已放弃本次计时')
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">专注计时</h2>
    </div>

    <el-card v-if="isIdle" shadow="never" class="setup-card">
      <div class="setup-icon">⏱️</div>
      <p class="setup-tip">开始一次专注学习，结束后自动把时长和内容带入日志表单</p>
      <el-form label-width="96px" class="setup-form">
        <el-form-item
          label="学习内容"
          required
          :error="contentError"
        >
          <el-input
            v-model="setup.content"
            placeholder="这次要学什么？"
            @input="contentError = ''"
            @keyup.enter="start"
          />
        </el-form-item>
        <el-form-item label="关联计划">
          <el-select v-model="setup.planId" clearable placeholder="可选" style="width: 100%">
            <el-option v-for="p in plansStore.plans" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" class="start-btn" @click="start">
            开始专注
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-else shadow="never" class="timer-card">
      <el-tag :type="timerStore.status === 'running' ? 'success' : 'warning'" effect="dark">
        {{ timerStore.status === 'running' ? '专注中' : '已暂停' }}
      </el-tag>
      <div class="timer-display" :class="{ paused: timerStore.status === 'paused' }">
        {{ display }}
      </div>
      <p class="timer-content">{{ timerStore.content }}</p>
      <p v-if="planName" class="timer-plan">关联计划：{{ planName }}</p>
      <div class="timer-actions">
        <el-button v-if="timerStore.status === 'running'" size="large" @click="timerStore.pause()">
          暂停
        </el-button>
        <el-button v-else type="success" size="large" @click="timerStore.resume()">
          继续
        </el-button>
        <el-button type="primary" size="large" @click="finish">结束并写日志</el-button>
        <el-button type="danger" plain size="large" @click="giveUp">放弃</el-button>
      </div>
      <p class="timer-hint">计时期间可以切换到其他页面，计时不会中断</p>
    </el-card>
  </div>
</template>

<style scoped>
.setup-card {
  max-width: 560px;
  margin: 40px auto;
  text-align: center;
  padding: 24px 24px 8px;
}

.setup-icon {
  font-size: 48px;
}

.setup-tip {
  color: #909399;
  margin: 8px 0 24px;
}

.setup-form {
  text-align: left;
}

.start-btn {
  width: 100%;
}

.timer-card {
  max-width: 560px;
  margin: 40px auto;
  text-align: center;
  padding: 32px 24px;
}

.timer-display {
  font-size: 64px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin: 16px 0 8px;
  color: #303133;
}

.timer-display.paused {
  color: #909399;
}

.timer-content {
  font-size: 16px;
  color: #606266;
  margin: 0 0 4px;
}

.timer-plan {
  font-size: 13px;
  color: #909399;
  margin: 0 0 8px;
}

.timer-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}

.timer-hint {
  margin-top: 20px;
  font-size: 12px;
  color: #c0c4cc;
}
</style>
