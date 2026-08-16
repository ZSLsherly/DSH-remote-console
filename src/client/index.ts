import type { Context } from '@deepseek-ai/cordis'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type { IWorkspaces } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'

import { createInstallPromptController, createPageNotificationController } from './browser.js'
import { MobileDock } from './MobileDock.js'
import { installStyles } from './styles.js'

export const inject = ['slots', 'sessions', 'connection', 'workspaces']

type ClientContext = Context & { connection: ConnectionHandle; workspaces: IWorkspaces }

export function apply(ctx: ClientContext): void {
  const notifications = createPageNotificationController()
  const installPrompt = createInstallPromptController()
  const language = typeof navigator === 'undefined' ? undefined : navigator.language

  ctx.effect(installStyles)
  ctx.effect(() => installPrompt.start())
  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'dsh-mobile',
    order: -100,
    inject: sessionId => ({
      connectionSource: ctx.connection.hostDescription,
      isRemote: !ctx.connection.isLoopback,
      notifications,
      installPrompt,
      language,
      onOpenSession: id => { ctx.sessions.open(id) },
      onOpenWorkspace: async (path: string) => {
        const workspace = await ctx.workspaces.create({ path })
        ctx.workspaces.startSession(workspace.workspaceId)
      },
      onCancel: async () => {
        const binding = ctx.sessions.binding(sessionId)
        if (binding === undefined) return { ok: false, message: 'Session is no longer available' }
        const result = await binding.session.cancel()
        return result.ok ? { ok: true } : { ok: false, message: result.error.message }
      },
    }),
  }, MobileDock))
}
