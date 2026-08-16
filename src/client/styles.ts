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
  }

  .dsh-mobile-bar {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 4px 6px 4px 10px;
    border: 1px solid var(--dsw-alias-border-l1);
    border-radius: 14px;
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
    gap: 4px;
    flex: none;
  }

  .dsh-mobile-button {
    min-width: 40px;
    min-height: 36px;
    padding: 0 10px;
    border: none;
    border-radius: 10px;
    background: var(--dsw-alias-interactive-bg-hover);
    color: var(--dsw-alias-label-primary);
    font-size: 12px;
    font-weight: 500;
    line-height: 18px;
    cursor: pointer;
    touch-action: manipulation;
  }

  .dsh-mobile-button:disabled {
    opacity: .45;
    cursor: default;
  }

  .dsh-mobile-button[data-danger='true'] {
    background: var(--dsw-alias-interactive-bg-hover-danger);
    color: var(--dsw-alias-state-error-primary);
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
