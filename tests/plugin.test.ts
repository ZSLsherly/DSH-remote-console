import { describe, expect, it, vi } from 'vitest'

import { apply, inject } from '../src/client/index.js'

describe('client plugin registration', () => {
  it('registers the mobile dock and opens workspaces by path', async () => {
    const workspace = { workspaceId: 'workspace-1' }
    const create = vi.fn(async () => workspace)
    const startSession = vi.fn()
    let registration: Record<string, unknown> | undefined
    const ctx = {
      effect: (effect: (() => void) | (() => () => void)) => effect(),
      connection: {
        isLoopback: true,
        hostDescription: { getSnapshot: () => ({}), subscribe: () => () => {} },
      },
      sessions: { open: vi.fn() },
      workspaces: { create, startSession, pickDirectory: vi.fn(async () => null) },
      slots: {
        inject: (_name: string, factory: () => unknown) => factory(),
        register: (options: Record<string, unknown>) => {
          registration = options
          return () => {}
        },
      },
    }

    apply(ctx as never)

    expect(inject).toEqual(['slots', 'sessions', 'connection', 'workspaces'])
    expect(registration).toMatchObject({
      name: 'conversation.input.dock',
      id: 'dsh-mobile',
      order: -100,
    })
    const injected = (registration?.inject as (id: string) => { onOpenWorkspace(path: string): Promise<void> })('session-1')
    await injected.onOpenWorkspace('C:\\my-project')
    expect(create).toHaveBeenCalledWith({ path: 'C:\\my-project' })
    expect(startSession).toHaveBeenCalledWith('workspace-1')
  })
})
