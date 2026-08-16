import { describe, expect, it } from 'vitest'
import type { SessionId, SessionListState, SessionSummary } from '@deepseek-ai/dsh-client-runtime/client'

import {
  attentionEvents,
  attentionIds,
  copyFor,
  nextAttentionId,
  snapshotAttention,
} from '../src/client/model.js'

const id = (value: string): SessionId => value as SessionId

function summary(value: string, extra: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: id(value),
    displayTitle: value,
    running: false,
    blank: false,
    updatedAt: 1,
    ...extra,
  }
}

function state(rows: SessionSummary[], current = rows[0]?.id): SessionListState {
  return {
    ids: rows.map(row => row.id),
    byId: Object.fromEntries(rows.map(row => [row.id, row])) as Record<SessionId, SessionSummary>,
    current,
    phase: 'ready',
    subagentsByParent: {},
    jobsBySession: {},
    currentAddress: undefined,
  }
}

describe('mobile session model', () => {
  it('selects pending and completed sessions in list order', () => {
    const value = state([
      summary('a'),
      summary('b', { pendingInteraction: { kind: 'approval', status: 'pending' } as never }),
      summary('c', { completed: true }),
    ], id('b'))

    expect(attentionIds(value)).toEqual([id('b'), id('c')])
    expect(nextAttentionId(value, id('b'))).toBe(id('c'))
    expect(nextAttentionId(value, id('c'))).toBe(id('b'))
  })

  it('reports only newly introduced attention transitions', () => {
    const beforeState = state([summary('a'), summary('b')])
    const afterState = state([
      summary('a', { completed: true }),
      summary('b', { pendingInteraction: { kind: 'question', status: 'pending' } as never }),
    ])

    expect(attentionEvents(snapshotAttention(beforeState), afterState)).toEqual([
      { sessionId: id('a'), kind: 'completed', displayTitle: 'a' },
      { sessionId: id('b'), kind: 'pending', displayTitle: 'b' },
    ])
  })

  it('uses Chinese copy for Chinese browser locales', () => {
    expect(copyFor('zh-CN').cancel).toBe('停止')
    expect(copyFor('en-US').cancel).toBe('Stop')
  })
})
