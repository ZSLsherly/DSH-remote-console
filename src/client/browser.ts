import type { AttentionEvent, MobileCopy } from './model.js'

export type NotificationPermissionState = NotificationPermission | 'unsupported'

export interface PageNotificationController {
  permission(): NotificationPermissionState
  request(): Promise<NotificationPermissionState>
  show(event: AttentionEvent, copy: MobileCopy, onOpen: () => void): void
}

export function createPageNotificationController(): PageNotificationController {
  const supported = (): boolean => typeof window !== 'undefined' && 'Notification' in window

  return {
    permission: () => supported() ? Notification.permission : 'unsupported',
    request: async () => supported() ? await Notification.requestPermission() : 'unsupported',
    show: (event, copy, onOpen) => {
      if (!supported() || Notification.permission !== 'granted') return
      if (document.visibilityState === 'visible') return
      const pending = event.kind === 'pending'
      const notification = new Notification(
        pending ? copy.pendingNotificationTitle : copy.completedNotificationTitle,
        {
          body: pending
            ? copy.pendingNotificationBody(event.displayTitle)
            : copy.completedNotificationBody(event.displayTitle),
          tag: `dsh-mobile:${event.kind}:${event.sessionId}`,
        },
      )
      notification.onclick = () => {
        window.focus()
        onOpen()
        notification.close()
      }
    },
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export interface InstallPromptController {
  getSnapshot(): boolean
  subscribe(listener: () => void): () => void
  prompt(): Promise<boolean>
  start(): () => void
}

export function createInstallPromptController(): InstallPromptController {
  let pending: BeforeInstallPromptEvent | undefined
  const listeners = new Set<() => void>()
  const publish = (): void => { for (const listener of listeners) listener() }
  const onPrompt = (raw: Event): void => {
    const event = raw as BeforeInstallPromptEvent
    event.preventDefault()
    pending = event
    publish()
  }

  return {
    getSnapshot: () => pending !== undefined,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    prompt: async () => {
      const event = pending
      if (event === undefined) return false
      pending = undefined
      publish()
      await event.prompt()
      return (await event.userChoice).outcome === 'accepted'
    },
    start: () => {
      if (typeof window === 'undefined') return () => {}
      window.addEventListener('beforeinstallprompt', onPrompt)
      return () => {
        window.removeEventListener('beforeinstallprompt', onPrompt)
        pending = undefined
        publish()
      }
    },
  }
}
