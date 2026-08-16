import type { SessionId, SessionListState, SessionSummary } from '@deepseek-ai/dsh-client-runtime/client'

export type SessionListLike = Pick<SessionListState, 'ids' | 'byId' | 'current'>

export interface AttentionBits {
  pending: boolean
  completed: boolean
  displayTitle: string
}

export type AttentionSnapshot = Record<string, AttentionBits>

export interface AttentionEvent {
  sessionId: SessionId
  kind: 'pending' | 'completed'
  displayTitle: string
}

export interface MobileCopy {
  connecting: string
  connected: string
  remote: string
  local: string
  running: string
  actionRequired: string
  ready: string
  attention: (count: number) => string
  openAttention: string
  openWorkspace: string
  workspacePathPrompt: string
  openingWorkspace: string
  workspaceOpenFailed: string
  dialogCancel: string
  enableNotifications: string
  notificationsEnabled: string
  notificationsDenied: string
  install: string
  pendingNotificationTitle: string
  pendingNotificationBody: (title: string) => string
  completedNotificationTitle: string
  completedNotificationBody: (title: string) => string
}

const zh: MobileCopy = {
  connecting: '连接中',
  connected: '已连接',
  remote: '远程',
  local: '本机',
  running: '运行中',
  actionRequired: '等待操作',
  ready: '已就绪',
  attention: count => `待处理 ${count}`,
  openAttention: '打开下一个待处理会话',
  openWorkspace: '打开工作区',
  workspacePathPrompt: '请输入电脑上的本地工作区绝对路径，例如 C:\\my-project',
  openingWorkspace: '正在打开...',
  workspaceOpenFailed: '打开工作区失败',
  dialogCancel: '取消',
  enableNotifications: '开启通知',
  notificationsEnabled: '通知已开启',
  notificationsDenied: '通知已禁用',
  install: '安装应用',
  pendingNotificationTitle: 'DSH 需要操作',
  pendingNotificationBody: title => `${title} 正在等待你的操作`,
  completedNotificationTitle: 'DSH 任务完成',
  completedNotificationBody: title => `${title} 已完成`,
}

const en: MobileCopy = {
  connecting: 'Connecting',
  connected: 'Connected',
  remote: 'Remote',
  local: 'Local',
  running: 'Running',
  actionRequired: 'Action needed',
  ready: 'Ready',
  attention: count => `${count} pending`,
  openAttention: 'Open next session needing attention',
  openWorkspace: 'Open workspace',
  workspacePathPrompt: 'Enter the absolute local workspace path on the computer, e.g. C:\\my-project',
  openingWorkspace: 'Opening...',
  workspaceOpenFailed: 'Could not open workspace',
  dialogCancel: 'Cancel',
  enableNotifications: 'Enable alerts',
  notificationsEnabled: 'Alerts enabled',
  notificationsDenied: 'Alerts blocked',
  install: 'Install app',
  pendingNotificationTitle: 'DSH needs your input',
  pendingNotificationBody: title => `${title} is waiting for you`,
  completedNotificationTitle: 'DSH task finished',
  completedNotificationBody: title => `${title} finished`,
}

export function copyFor(language: string | undefined): MobileCopy {
  return language?.toLowerCase().startsWith('zh') === true ? zh : en
}

export function needsAttention(summary: Pick<SessionSummary, 'pendingInteraction' | 'completed'>): boolean {
  return summary.pendingInteraction !== undefined || summary.completed === true
}

export function attentionIds(state: SessionListLike): SessionId[] {
  return state.ids.filter(id => {
    const summary = state.byId[id]
    return summary !== undefined && needsAttention(summary)
  })
}

export function nextAttentionId(state: SessionListLike, current: SessionId): SessionId | undefined {
  const ids = attentionIds(state)
  if (ids.length === 0) return undefined
  const index = ids.indexOf(current)
  return ids[(index + 1 + ids.length) % ids.length]
}

export function snapshotAttention(state: SessionListLike): AttentionSnapshot {
  const result: AttentionSnapshot = {}
  for (const id of state.ids) {
    const summary = state.byId[id]
    if (summary === undefined) continue
    result[id] = {
      pending: summary.pendingInteraction !== undefined,
      completed: summary.completed === true,
      displayTitle: summary.displayTitle,
    }
  }
  return result
}

export function attentionEvents(previous: AttentionSnapshot, state: SessionListLike): AttentionEvent[] {
  const events: AttentionEvent[] = []
  const current = snapshotAttention(state)
  for (const id of state.ids) {
    const before = previous[id]
    const after = current[id]
    if (after === undefined) continue
    if (after.pending && before?.pending !== true) {
      events.push({ sessionId: id, kind: 'pending', displayTitle: after.displayTitle })
    } else if (after.completed && before?.completed !== true) {
      events.push({ sessionId: id, kind: 'completed', displayTitle: after.displayTitle })
    }
  }
  return events
}
