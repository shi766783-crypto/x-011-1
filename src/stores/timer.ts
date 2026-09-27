import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { STORAGE_KEYS } from '@/constants'
import { read, remove, write } from '@/services/storage'
import { today } from '@/utils/date'

export type TimerStatus = 'idle' | 'running' | 'paused'

/** 持久化快照：用时间戳记录，刷新页面后仍准确累计 */
interface TimerSnapshot {
  status: TimerStatus
  /** 暂停前已累计的毫秒数 */
  accumulated: number
  /** 最近一次启动/继续的时间戳；非 running 时为 null */
  startedAt: number | null
  content: string
  planId: string
}

/** 结束计时后待带入日志表单的数据 */
export interface PendingLog {
  date: string
  content: string
  planId: string
  /** 小时 */
  duration: number
}

export const useTimerStore = defineStore('timer', () => {
  const status = ref<TimerStatus>('idle')
  const accumulated = ref(0)
  const startedAt = ref<number | null>(null)
  const content = ref('')
  const planId = ref('')
  /** 每秒刷新一次的当前时间，驱动各组件的计时显示 */
  const now = ref(Date.now())
  /** 结束计时后暂存，日志页挂载时取走并预填表单 */
  const pendingLog = ref<PendingLog | null>(null)

  let ticker: number | undefined

  const elapsedMs = computed(() =>
    status.value === 'running' && startedAt.value !== null
      ? accumulated.value + (now.value - startedAt.value)
      : accumulated.value,
  )
  const isActive = computed(() => status.value !== 'idle')

  function persist(): void {
    const snapshot: TimerSnapshot = {
      status: status.value,
      accumulated: accumulated.value,
      startedAt: startedAt.value,
      content: content.value,
      planId: planId.value,
    }
    write(STORAGE_KEYS.timer, snapshot)
  }

  function ensureTicker(): void {
    if (ticker === undefined && status.value === 'running') {
      ticker = window.setInterval(() => {
        now.value = Date.now()
      }, 1000)
    }
  }

  function stopTicker(): void {
    if (ticker !== undefined) {
      window.clearInterval(ticker)
      ticker = undefined
    }
  }

  function start(payload: { content: string; planId?: string }): void {
    content.value = payload.content
    planId.value = payload.planId ?? ''
    accumulated.value = 0
    startedAt.value = Date.now()
    now.value = Date.now()
    status.value = 'running'
    ensureTicker()
    persist()
  }

  function pause(): void {
    if (status.value !== 'running' || startedAt.value === null) return
    accumulated.value += Date.now() - startedAt.value
    startedAt.value = null
    status.value = 'paused'
    stopTicker()
    persist()
  }

  function resume(): void {
    if (status.value !== 'paused') return
    startedAt.value = Date.now()
    now.value = Date.now()
    status.value = 'running'
    ensureTicker()
    persist()
  }

  /** 结束计时：生成待带入日志的数据并重置计时器 */
  function finish(): PendingLog {
    const hours = Math.max(0.5, Math.round((elapsedMs.value / 3_600_000) * 10) / 10)
    const pending: PendingLog = {
      date: today(),
      content: content.value,
      planId: planId.value,
      duration: hours,
    }
    pendingLog.value = pending
    reset()
    return pending
  }

  /** 放弃本次计时，不保留任何数据 */
  function discard(): void {
    reset()
  }

  function reset(): void {
    status.value = 'idle'
    accumulated.value = 0
    startedAt.value = null
    content.value = ''
    planId.value = ''
    stopTicker()
    remove(STORAGE_KEYS.timer)
  }

  /** 日志页取走待预填数据（取一次即清空） */
  function consumePendingLog(): PendingLog | null {
    const pending = pendingLog.value
    pendingLog.value = null
    return pending
  }

  /** 恢复上次未完成的计时（刷新页面后计时依然准确） */
  function restore(): void {
    const snapshot = read<TimerSnapshot | null>(STORAGE_KEYS.timer, null)
    if (!snapshot || snapshot.status === 'idle') return
    status.value = snapshot.status
    accumulated.value = snapshot.accumulated
    startedAt.value = snapshot.startedAt
    content.value = snapshot.content
    planId.value = snapshot.planId
    now.value = Date.now()
    ensureTicker()
  }

  restore()

  return {
    status,
    content,
    planId,
    elapsedMs,
    isActive,
    pendingLog,
    start,
    pause,
    resume,
    finish,
    discard,
    consumePendingLog,
  }
})
