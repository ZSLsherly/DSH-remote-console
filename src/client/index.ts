import type { Context } from '@deepseek-ai/cordis'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type { IWorkspaces } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'

import { createInstallPromptController, createPageNotificationController } from './browser.js'
import { DirectoryFlow } from './DirectoryFlow.js'
import { MobileDock } from './MobileDock.js'
import { installStyles } from './styles.js'

export const inject = ['slots', 'sessions', 'connection', 'workspaces']

type ClientContext = Context & { connection: ConnectionHandle; workspaces: IWorkspaces }

function isRemoteBrowser(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname.toLowerCase()
  return host !== '127.0.0.1' && host !== 'localhost' && host !== '::1' && host !== '[::1]'
}

export function apply(ctx: ClientContext): void {
  const notifications = createPageNotificationController()
  const installPrompt = createInstallPromptController()
  const language = typeof navigator === 'undefined' ? undefined : navigator.language

  ctx.effect(installStyles)
  ctx.effect(() => installPrompt.start())

  const directoryInjected = () => ({
    isRemote: isRemoteBrowser(),
    pickLocal: () => ctx.workspaces.pickDirectory(),
    language,
  })

  ctx.slots.inject('conversation.hero.workspace.directoryFlow', () => ctx.slots.inject('sidebar.workspaces.directoryFlow', function* () {
    yield ctx.slots.register({
      name: 'conversation.hero.workspace.directoryFlow',
      priority: -100,
      inject: directoryInjected,
    }, DirectoryFlow)
    yield ctx.slots.register({
      name: 'sidebar.workspaces.directoryFlow',
      priority: -100,
      inject: directoryInjected,
    }, DirectoryFlow)
  }))
  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'dsh-mobile',
    order: -100,
    inject: sessionId => ({
      connectionSource: ctx.connection.hostDescription,
      isRemote: isRemoteBrowser(),
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
