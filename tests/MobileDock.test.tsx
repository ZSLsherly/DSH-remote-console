import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { HostDescriptionSource } from '@deepseek-ai/dsh-client-connection/client'
import type { SessionId, SessionListState, SessionSummary } from '@deepseek-ai/dsh-client-runtime/client'

import type {
  InstallPromptController,
  NotificationPermissionState,
  PageNotificationController,
} from '../src/client/browser.js'
import { MobileDock, type MobileDockProps } from '../src/client/MobileDock.js'

const sessionId = 'session-1' as SessionId

afterEach(cleanup)

function sessions(summary: Partial<SessionSummary> = {}): SessionListState {
  const row: SessionSummary = {
    id: sessionId,
    displayTitle: 'Mobile task',
    running: true,
    blank: false,
    updatedAt: 1,
    ...summary,
  }
  return {
    ids: [sessionId],
    byId: { [sessionId]: row },
    current: sessionId,
    phase: 'ready',
    subagentsByParent: {},
    jobsBySession: {},
    currentAddress: undefined,
  }
}

function props(value: SessionListState): MobileDockProps {
  const useSessions = <S,>(selector: (state: SessionListState) => S): S => selector(value)
  const connectionSource: HostDescriptionSource = {
    getSnapshot: () => ({}) as never,
    subscribe: () => () => {},
  }
  const notifications: PageNotificationController = {
    permission: () => 'default',
    request: vi.fn(async (): Promise<NotificationPermissionState> => 'granted'),
    show: vi.fn(),
  }
  const installPrompt: InstallPromptController = {
    getSnapshot: () => false,
    subscribe: () => () => {},
    prompt: vi.fn(async () => false),
    start: () => () => {},
  }

  return {
    sessionId,
    useSessions,
    connectionSource,
    isRemote: true,
    notifications,
    installPrompt,
    language: 'en-US',
    onOpenSession: vi.fn(),
    onOpenWorkspace: vi.fn(async () => {}),
  } as unknown as MobileDockProps
}

describe('MobileDock', () => {
  it('shows connection state without a dedicated stop button', () => {
    render(<MobileDock {...props(sessions())} />)

    expect(screen.getByRole('status').textContent).toContain('Running')
    expect(screen.getByRole('status').textContent).toContain('Remote')
    expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull()
  })

  it('keeps the remote workspace opener visible', () => {
    render(<MobileDock {...props(sessions())} />)

    expect(screen.getByRole('button', { name: 'Open workspace' })).toBeTruthy()
  })
})
