import { describe, expect, it, vi } from 'vitest'

import { apply, inject } from '../src/client/index.js'

describe('client plugin registration', () => {
  it('registers additively in the official input dock and delegates cancel', async () => {
    const cancel = vi.fn(async () => ({ ok: true, value: { accepted: true } }))
    let registration: Record<string, unknown> | undefined
    const ctx = {
      effect: (effect: (() => void) | (() => () => void)) => effect(),
      connection: {
        isLoopback: false,
        hostDescription: { getSnapshot: () => ({}), subscribe: () => () => {} },
      },
      sessions: {
        open: vi.fn(),
        binding: () => ({ session: { cancel } }),
      },
      slots: {
        inject: (_name: string, factory: () => unknown) => factory(),
        register: (options: Record<string, unknown>) => {
          registration = options
          return () => {}
        },
      },
    }

    apply(ctx as never)

    expect(inject).toEqual(['slots', 'sessions', 'connection'])
    expect(registration).toMatchObject({
      name: 'conversation.input.dock',
      id: 'dsh-mobile',
      order: -100,
    })
    const injected = (registration?.inject as (id: string) => { onCancel(): Promise<{ ok: boolean }> })('session-1')
    expect(await injected.onCancel()).toEqual({ ok: true })
    expect(cancel).toHaveBeenCalledOnce()
  })
})
