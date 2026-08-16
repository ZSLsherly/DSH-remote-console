const STYLE_ID = 'dsh-mobile/client'

const css = String.raw`
.dsh-mobile-dock { display: none; }

@media (max-width: 720px), (pointer: coarse) and (max-width: 1024px) {
  .dsh-mobile-dock {
    box-sizing: border-box;
    display: block;
    width: calc(100% - 2 * var(--dsh-composer-side-clearance));
    max-width: var(--dsh-composer-card-max-width);
    margin: 0 auto;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .dsh-mobile-bar {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 6px 8px;
    flex-wrap: wrap;
    -webkit-tap-highlight-color: transparent;
    border: 1px solid var(--dsw-alias-border-l1);
    border-radius: 12px;
    background: var(--dsw-specific-tip);
    box-shadow: var(--dsw-shadow-lv1);
  }

  .dsh-mobile-status {
    display: flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
    flex: 1;
  }

  .dsh-mobile-dot {
    width: 8px;
    height: 8px;
    flex: none;
    border-radius: 999px;
    background: var(--dsw-alias-state-success-primary);
  }

  .dsh-mobile-dot[data-state='connecting'] {
    background: var(--dsw-alias-state-warn-primary);
    animation: dsh-mobile-pulse 1.2s ease-in-out infinite alternate;
  }

  .dsh-mobile-dot[data-state='attention'] {
    background: var(--dsw-alias-state-warn-primary);
  }

  .dsh-mobile-copy {
    min-width: 0;
    overflow: hidden;
    color: var(--dsw-alias-label-secondary);
    font-size: 12px;
    line-height: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dsh-mobile-copy strong {
    color: var(--dsw-alias-label-primary);
    font-weight: 600;
  }

  .dsh-mobile-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: none;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .dsh-mobile-button {
    min-width: 40px;
    min-height: 40px;
    padding: 0 12px;
    border: none;
    border-radius: 10px;
    background: var(--dsw-alias-interactive-bg-hover);
    color: var(--dsw-alias-label-primary);
    font-size: 12px;
    font-weight: 500;
    line-height: 18px;
    cursor: pointer;
    user-select: none;
    touch-action: manipulation;
    transition: filter .12s ease, transform .12s ease, opacity .12s ease;
  }

  .dsh-mobile-button:active {
    transform: scale(.97);
  }

  .dsh-mobile-button:disabled {
    opacity: .45;
    cursor: default;
  }

  .dsh-mobile-button[data-primary='true'] {
    background: var(--dsw-alias-interactive-bg-primary, var(--dsw-alias-state-info-primary));
    color: var(--dsw-alias-label-on-primary, #fff);
  }

  .dsh-mobile-button[data-attention='true'] {
    background: var(--dsw-alias-state-warn-primary);
    color: var(--dsw-alias-label-on-warn, #fff);
  }

  .dsh-mobile-error {
    margin: 4px 8px 0;
    color: var(--dsw-alias-state-error-primary);
    font-size: 12px;
    line-height: 18px;
  }
}

@media (max-width: 430px) {
  .dsh-mobile-button[data-secondary='true']:not(.dsh-mobile-workspace) { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .dsh-mobile-dot { animation: none !important; }
}


.dsh-mobile-workspace-flow {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  background: rgba(0, 0, 0, .45);
  backdrop-filter: blur(4px);
}

.dsh-mobile-workspace-form {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(480px, 100%);
  max-height: 100%;
  margin: auto;
  overflow-y: auto;
  padding: 16px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 16px;
  background: var(--dsw-bg-elevated, #fff);
  box-shadow: var(--dsw-shadow-lv2);
}

.dsh-mobile-workspace-label {
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.dsh-mobile-workspace-input {
  box-sizing: border-box;
  width: 100%;
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 10px;
  background: var(--dsw-alias-interactive-bg);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 16px;
  line-height: 22px;
}

.dsh-mobile-workspace-input:focus {
  outline: 2px solid var(--dsw-alias-state-info-primary);
}

.dsh-mobile-workspace-hint {
  margin: 0;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
}

.dsh-mobile-workspace-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 430px) {
  .dsh-mobile-workspace-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .dsh-mobile-workspace-actions .dsh-mobile-button {
    width: 100%;
  }
}

@keyframes dsh-mobile-pulse {
  from { opacity: .45; }
  to { opacity: 1; }
}
`

export function installStyles(): () => void {
  if (typeof document === 'undefined') return () => {}
  const existing = document.querySelector<HTMLStyleElement>(`style[data-plugin-css="${STYLE_ID}"]`)
  if (existing !== null) return () => {}
  const tag = document.createElement('style')
  tag.dataset.plugin = 'dsh-mobile'
  tag.dataset.pluginCss = STYLE_ID
  tag.textContent = css
  document.head.appendChild(tag)
  return () => { tag.remove() }
}
