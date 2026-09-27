<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatHms } from '@/utils/date'
import { useFocusStore } from '@/stores/focus'
import { usePlansStore } from '@/stores/plans'

const router = useRouter()
const focusStore = useFocusStore()
const plansStore = usePlansStore()

const formRef = ref<FormInstance>()
const form = reactive({
  content: '',
  planId: '',
})

const rules: FormRules = {
  content: [{ required: true, message: '请输入学习内容', trigger: 'blur' }],
}

const planName = computed(() => {
  const id = focusStore.session?.planId
  return plansStore.plans.find((p) => p.id === id)?.name ?? ''
})

const displayTime = computed(() => formatHms(focusStore.elapsedMs))

async function start(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  focusStore.start(form.content.trim(), form.planId || undefined)
}

function togglePause(): void {
  if (focusStore.running) {
    focusStore.pause()
  } else {
    focusStore.resume()
  }
}

async function finish(): Promise<void> {
  const elapsed = focusStore.elapsedMs
  const tooShort = elapsed < 60_000
  const message = tooShort
    ? `本次专注不足 1 分钟（${displayTime.value}），结束后将按实际时长记录，确定结束吗？`
    : `本次专注 ${displayTime.value}，结束后将自动把时长和内容填入学习日志。`
  const confirmed = await ElMessageBox.confirm(message, '结束专注', {
    confirmButtonText: '结束并写日志',
    cancelButtonText: '再学一会',
    type: tooShort ? 'warning' : 'info',
  }).catch(() => false)
  if (!confirmed) return
  focusStore.finish()
  router.push('/logs')
}

async function discard(): Promise<void> {
  const confirmed = await ElMessageBox.confirm(
    '放弃后本次计时不会被记录，确定放弃吗？',
    '放弃计时',
    {
      confirmButtonText: '放弃',
      cancelButtonText: '继续计时',
      type: 'warning',
    },
  ).catch(() => false)
  if (!confirmed) return
  focusStore.discard()
  ElMessage.info('已放弃本次计时')
}

function onContentChange(value: string): void {
  focusStore.updateContent(value.trim())
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">专注计时</h2>
    </div>

    <el-card v-if="!focusStore.session" shadow="never" class="focus-card">
      <div class="empty-hint">开始一段专注学习，结束后自动生成学习日志</div>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px" class="start-form">
        <el-form-item label="学习内容" prop="content">
          <el-input v-model="form.content" placeholder="准备学什么？" @keyup.enter="start" />
        </el-form-item>
        <el-form-item label="关联计划" prop="planId">
          <el-select v-model="form.planId" clearable placeholder="可选" style="width: 100%">
            <el-option v-for="p in plansStore.plans" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" class="start-btn" @click="start">开始专注</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-else shadow="never" class="focus-card">
      <div class="timer-area">
        <el-tag :type="focusStore.running ? 'success' : 'warning'" effect="dark" class="status-tag">
          {{ focusStore.running ? '计时中' : '已暂停' }}
        </el-tag>
        <div class="timer" :class="{ paused: !focusStore.running }">{{ displayTime }}</div>
        <div v-if="planName" class="plan-name">关联计划：{{ planName }}</div>
        <el-input
          :model-value="focusStore.session.content"
          class="content-input"
          placeholder="学习内容"
          @change="onContentChange"
        />
        <div class="actions">
          <el-button size="large" @click="togglePause">
            {{ focusStore.running ? '暂停' : '继续' }}
          </el-button>
          <el-button type="primary" size="large" @click="finish">结束并写日志</el-button>
          <el-button type="danger" size="large" plain @click="discard">放弃</el-button>
        </div>
        <div class="tip">切到其他页面计时不中断；关闭或刷新页面前会提示确认</div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.focus-card {
  max-width: 640px;
  margin: 0 auto;
}

.empty-hint {
  text-align: center;
  color: #909399;
  margin-bottom: 24px;
}

.start-form {
  max-width: 480px;
  margin: 0 auto;
}

.start-btn {
  width: 100%;
}

.timer-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0 8px;
}

.status-tag {
  margin-bottom: 16px;
}

.timer {
  font-size: 64px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #1f2d3d;
  line-height: 1.2;
}

.timer.paused {
  color: #909399;
}

.plan-name {
  margin-top: 12px;
  color: #606266;
}

.content-input {
  max-width: 360px;
  margin-top: 16px;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
}

.tip {
  margin-top: 20px;
  font-size: 12px;
  color: #909399;
}
</style>
