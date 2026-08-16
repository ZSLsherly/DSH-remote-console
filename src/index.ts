/**
 * Node half of dsh-mobile.
 *
 * The bundle needs a Loader row so the official dsh client-module scanner can
 * discover package.json#dsh.client. The node half also registers a heartbeat
 * endpoint: while a phone browser is connected, DSH periodically calls
 * SetThreadExecutionState so Windows stays awake instead of sleeping during a
 * remote session.
 */
import koffi from 'koffi'
import type { Context } from '@deepseek-ai/cordis'

declare const process: { readonly platform: string }

export const inject = ['webServer']

const KEEPALIVE_PATH = '/plugins/@wahu/dsh-mobile/keepalive'
const HEARTBEAT_TTL_MS = 90_000
const CHECK_INTERVAL_MS = 30_000

const ES_CONTINUOUS = 0x80000000
const ES_SYSTEM_REQUIRED = 0x00000001
const ES_DISPLAY_REQUIRED = 0x00000002
const ES_AWAKE = ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED

interface WebServer {
  register(route: {
    kind: 'exact'
    path: string
    handler(req: { method?: string }, res: { writeHead(code: number): void; end(): void }): void | Promise<void>
  }): () => void
}

let setExecutionState: ((flags: number) => void) | undefined
if (process.platform === 'win32') {
  try {
    const kernel32 = koffi.load('kernel32.dll')
    const fn = kernel32.func('uint32 __stdcall SetThreadExecutionState(uint32 esFlags)')
    setExecutionState = (flags: number) => { void fn(flags) }
  } catch {
    setExecutionState = undefined
  }
}

export function apply(ctx: Context & { webServer: WebServer }): void {
  let lastHeartbeat = 0
  let active = false
  let disposed = false

  const setAwake = (value: boolean): void => {
    if (setExecutionState === undefined || disposed) return
    setExecutionState(value ? ES_AWAKE : ES_CONTINUOUS)
  }

  const disposeRoute = ctx.webServer.register({
    kind: 'exact',
    path: KEEPALIVE_PATH,
    handler: (req, res) => {
      if (req.method === 'POST') lastHeartbeat = Date.now()
      res.writeHead(204)
      res.end()
    },
  })

  const timer = setInterval(() => {
    if (disposed) return
    const awake = Date.now() - lastHeartbeat < HEARTBEAT_TTL_MS
    if (awake === active) return
    active = awake
    setAwake(active)
  }, CHECK_INTERVAL_MS)

  ctx.effect(() => () => {
    disposed = true
    clearInterval(timer)
    disposeRoute()
    if (active) {
      active = false
      setAwake(false)
    }
  })
}
