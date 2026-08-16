import { useEffect, useRef, useState } from 'react'
import type { DirectoryFlowOwnerProps } from '@deepseek-ai/dsh-client-ui-workspace/client'

import { copyFor } from './model.js'

export interface DirectoryFlowInjected {
  isRemote: boolean
  pickLocal(): Promise<string | null>
  language: string | undefined
}

export function DirectoryFlow({
  open,
  busy,
  onPicked,
  onCancel,
  onError,
  isRemote,
  pickLocal,
  language,
}: DirectoryFlowOwnerProps & DirectoryFlowInjected): JSX.Element | null {
  const copy = copyFor(language)
  const [path, setPath] = useState('')
  const armed = useRef(false)
  const outcome = useRef({ onPicked, onCancel, onError })
  outcome.current = { onPicked, onCancel, onError }

  useEffect(() => {
    if (!open) {
      armed.current = false
      setPath('')
      return
    }
    if (armed.current || isRemote) return
    armed.current = true
    pickLocal().then(
      picked => { picked === null ? outcome.current.onCancel() : outcome.current.onPicked(picked) },
      reason => { outcome.current.onError(reason instanceof Error ? reason.message : String(reason)) },
    )
  }, [isRemote, open, pickLocal])

  if (!open || !isRemote) return null

  const submit = (): void => {
    const value = path.trim()
    if (value === '') return
    armed.current = true
    outcome.current.onPicked(value)
  }

  const dismiss = (): void => {
    outcome.current.onCancel()
  }

  return (
    <div className="dsh-mobile-workspace-flow" role="dialog" aria-modal="true">
      <form
        className="dsh-mobile-workspace-form"
        onSubmit={event => {
          event.preventDefault()
          submit()
        }}
      >
        <label className="dsh-mobile-workspace-label">{copy.openWorkspace}</label>
        <input
          className="dsh-mobile-workspace-input"
          autoFocus
          inputMode="text"
          spellCheck={false}
          placeholder="C:\my-project"
          value={path}
          onChange={event => { setPath(event.target.value) }}
          disabled={busy}
        />
        <p className="dsh-mobile-workspace-hint">{copy.workspacePathPrompt}</p>
        <div className="dsh-mobile-workspace-actions">
          <button
            type="button"
            className="dsh-mobile-button"
            data-secondary="true"
            onClick={dismiss}
            disabled={busy}
          >
            {copy.dialogCancel}
          </button>
          <button
            type="submit"
            className="dsh-mobile-button"
            disabled={busy || path.trim() === ''}
          >
            {busy ? copy.openingWorkspace : copy.openWorkspace}
          </button>
        </div>
      </form>
    </div>
  )
}
