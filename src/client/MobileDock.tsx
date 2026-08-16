import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { HostDescriptionSource } from '@deepseek-ai/dsh-client-connection/client'
import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'

import type { InstallPromptController, PageNotificationController } from './browser.js'
import {
  attentionEvents,
  attentionIds,
  copyFor,
  nextAttentionId,
  snapshotAttention,
} from './model.js'

export interface CancelOutcome {
  ok: boolean
  message?: string
}

export interface MobileDockInjected {
  connectionSource: HostDescriptionSource
  isRemote: boolean
  notifications: PageNotificationController
  installPrompt: InstallPromptController
  language: string | undefined
  onCancel(): Promise<CancelOutcome>
  onOpenSession(id: SessionId): void
  onOpenWorkspace(path: string): Promise<void>
}

export type MobileDockProps = PropsRuntime<'conversation.input.dock'> & MobileDockInjected

export function MobileDock({
  sessionId,
  useSessions,
  connectionSource,
  isRemote,
  notifications,
  installPrompt,
  language,
  onCancel,
  onOpenSession,
  onOpenWorkspace,
}: MobileDockProps): JSX.Element {
  const sessions = useSessions(state => state)
  const connected = useSyncExternalStore(
    connectionSource.subscribe,
    () => connectionSource.getSnapshot() !== undefined,
    () => false,
  )
  const canInstall = useSyncExternalStore(
    installPrompt.subscribe,
    installPrompt.getSnapshot,
    () => false,
  )
  const copy = useMemo(() => copyFor(language), [language])
  const [notificationPermission, setNotificationPermission] = useState(() => notifications.permission())
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string>()
  const [openingWorkspace, setOpeningWorkspace] = useState(false)
  const [workspaceError, setWorkspaceError] = useState<string>()
  const previousAttention = useRef(snapshotAttention(sessions))

  const current = sessions.byId[sessionId]
  const attention = attentionIds(sessions)
  const nextId = nextAttentionId(sessions, sessionId)
  const state = !connected
    ? 'connecting'
    : current?.pendingInteraction !== undefined
      ? 'attention'
      : current?.running === true
        ? 'running'
        : 'ready'
  const stateLabel = state === 'connecting'
    ? copy.connecting
    : state === 'attention'
      ? copy.actionRequired
      : state === 'running'
        ? copy.running
        : copy.ready

  useEffect(() => {
    const events = attentionEvents(previousAttention.current, sessions)
    previousAttention.current = snapshotAttention(sessions)
    for (const event of events) {
      notifications.show(event, copy, () => onOpenSession(event.sessionId))
    }
  }, [copy, notifications, onOpenSession, sessions])

  const requestNotifications = async (): Promise<void> => {
    setNotificationPermission(await notifications.request())
  }

  const openWorkspace = async (): Promise<void> => {
    const path = window.prompt(copy.workspacePathPrompt)
    if (path === null || path.trim() === '') return
    setOpeningWorkspace(true)
    setWorkspaceError(undefined)
    try {
      await onOpenWorkspace(path.trim())
    } catch (cause) {
      setWorkspaceError(cause instanceof Error && cause.message.length > 0 ? cause.message : copy.workspaceOpenFailed)
    } finally {
      setOpeningWorkspace(false)
    }
  }

  const cancel = async (): Promise<void> => {
    setCancelling(true)
    setError(undefined)
    try {
      const result = await onCancel()
      if (!result.ok) setError(result.message ?? copy.cancelFailed)
    } catch (cause) {
      setError(cause instanceof Error && cause.message.length > 0 ? cause.message : copy.cancelFailed)
    } finally {
      setCancelling(false)
    }
  }

  const notificationLabel = notificationPermission === 'granted'
    ? copy.notificationsEnabled
    : notificationPermission === 'denied'
      ? copy.notificationsDenied
      : copy.enableNotifications

  return (
    <div className="dsh-mobile-dock" data-testid="dsh-mobile-dock">
      <div className="dsh-mobile-bar">
        <div className="dsh-mobile-status" role="status" aria-live="polite">
          <span className="dsh-mobile-dot" data-state={state} aria-hidden="true" />
          <span className="dsh-mobile-copy">
            <strong>{stateLabel}</strong>
            {' · '}
            {connected ? copy.connected : copy.connecting}
            {' · '}
            {isRemote ? copy.remote : copy.local}
          </span>
        </div>

        <div className="dsh-mobile-actions">
          {isRemote && (
            <button
              type="button"
              className="dsh-mobile-button"
              data-secondary="true"
              disabled={openingWorkspace}
              title={copy.openWorkspace}
              onClick={() => { void openWorkspace() }}
            >
              {openingWorkspace ? copy.openingWorkspace : copy.openWorkspace}
            </button>
          )}
          {attention.length > 0 && nextId !== undefined && (
            <button
              type="button"
              className="dsh-mobile-button"
              title={copy.openAttention}
              aria-label={copy.openAttention}
              onClick={() => { onOpenSession(nextId) }}
            >
              {copy.attention(attention.length)}
            </button>
          )}
          {current?.running === true && (
            <button
              type="button"
              className="dsh-mobile-button"
              data-danger="true"
              disabled={cancelling}
              onClick={() => { void cancel() }}
            >
              {cancelling ? copy.cancelling : copy.cancel}
            </button>
          )}
          {notificationPermission !== 'unsupported' && notificationPermission !== 'granted' && (
            <button
              type="button"
              className="dsh-mobile-button"
              data-secondary="true"
              disabled={notificationPermission === 'denied'}
              title={notificationLabel}
              onClick={() => { void requestNotifications() }}
            >
              {notificationLabel}
            </button>
          )}
          {canInstall && (
            <button
              type="button"
              className="dsh-mobile-button"
              data-secondary="true"
              onClick={() => { void installPrompt.prompt() }}
            >
              {copy.install}
            </button>
          )}
        </div>
      </div>
      {error !== undefined && <p className="dsh-mobile-error" role="alert">{error}</p>}
      {workspaceError !== undefined && <p className="dsh-mobile-error" role="alert">{workspaceError}</p>}
    </div>
  )
}
