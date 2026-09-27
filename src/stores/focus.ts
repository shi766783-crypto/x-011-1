import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { FocusLogDraft, FocusSession } from '@/types'
import { STORAGE_KEYS } from '@/constants'
import { read, remove, write } from '@/services/storage'

/**
 * 专注计时 store：会话状态全局唯一并持久化到 localStorage。
 * 计时完全基于时间戳推算，不依赖组件内的计数器，
 * 因此路由切换、页面刷新都不会中断计时。
 */
export const useFocusStore = defineStore('focus', () => {
  const session = ref<FocusSession | null>(read<FocusSession | null>(STORAGE_KEYS.focus, null))

  // 刷新/重开页面后恢复会话时，若上次处于计时中则自动暂停：
  // 页面关闭期间无法确认用户仍在学习，不计入时长
  if (session.value && session.value.startedAt !== null) {
    session.value = { ...session.value, startedAt: null }
    write(STORAGE_KEYS.focus, session.value)
  }

  /** 驱动界面刷新的当前时间（仅会话存在时由 ticker 更新） */
  const now = ref(Date.now())
  let ticker: ReturnType<typeof setInterval> | undefined

  /** 结束计时后待写入日志表单的草稿，由日志页消费 */
  const pendingLog = ref<FocusLogDraft | null>(null)

  const running = computed(() => session.value !== null && session.value.startedAt !== null)

  const elapsedMs = computed(() => {
    const s = session.value
    if (!s) return 0
    return s.accumulatedMs + (s.startedAt !== null ? now.value - s.startedAt : 0)
  })

  function persist(): void {
    if (session.value) {
      write(STORAGE_KEYS.focus, session.value)
    } else {
      remove(STORAGE_KEYS.focus)
    }
  }

  function ensureTicker(): void {
    if (ticker === undefined && session.value !== null) {
      ticker = setInterval(() => {
        now.value = Date.now()
      }, 500)
    }
  }

  function stopTicker(): void {
    if (ticker !== undefined) {
      clearInterval(ticker)
      ticker = undefined
    }
  }

  function start(content: string, planId?: string): void {
    if (session.value) return
    session.value = {
      content,
      planId,
      accumulatedMs: 0,
      startedAt: Date.now(),
      createdAt: Date.now(),
    }
    persist()
    ensureTicker()
  }

  function pause(): void {
    const s = session.value
    if (!s || s.startedAt === null) return
    s.accumulatedMs += Date.now() - s.startedAt
    s.startedAt = null
    persist()
  }

  function resume(): void {
    const s = session.value
    if (!s || s.startedAt !== null) return
    s.startedAt = Date.now()
    persist()
    ensureTicker()
  }

  function updateContent(content: string): void {
    if (!session.value) return
    session.value.content = content
    persist()
  }

  function clearSession(): void {
    session.value = null
    persist()
    stopTicker()
  }

  /** 结束计时：清除会话并把结果存入草稿，返回本次时长（小时，两位小数） */
  function finish(): FocusLogDraft | null {
    const s = session.value
    if (!s) return null
    const totalMs = s.accumulatedMs + (s.startedAt !== null ? Date.now() - s.startedAt : 0)
    const draft: FocusLogDraft = {
      content: s.content,
      planId: s.planId,
      duration: Math.round((totalMs / 3_600_000) * 100) / 100,
    }
    pendingLog.value = draft
    clearSession()
    return draft
  }

  /** 放弃本次计时，不生成日志 */
  function discard(): void {
    clearSession()
  }

  /** 取出并清空日志草稿（日志页预填表单后调用） */
  function consumePendingLog(): FocusLogDraft | null {
    const draft = pendingLog.value
    pendingLog.value = null
    return draft
  }

  ensureTicker()

  return {
    session,
    running,
    elapsedMs,
    pendingLog,
    start,
    pause,
    resume,
    updateContent,
    finish,
    discard,
    consumePendingLog,
  }
})
