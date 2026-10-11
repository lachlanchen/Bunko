import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function Sheet({ title, onClose, closeLabel, children }: {
  title: string; onClose: () => void; closeLabel: string; children: ReactNode
}) {
  const close = useRef<HTMLButtonElement>(null)
  const pressedBackdrop = useRef(false)
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    close.current?.focus({ preventScroll: true })
    return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }) }
  }, [])
  return <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label={title}
    onPointerDown={event => { pressedBackdrop.current = event.target === event.currentTarget }}
    onClick={event => { if (pressedBackdrop.current && event.target === event.currentTarget) onClose() }}>
    <div className="sheet">
      <header>
        <strong>{title}</strong>
        <button ref={close} type="button" onClick={onClose} aria-label={closeLabel}>
          <span>{closeLabel}</span><X size={18} />
        </button>
      </header>
      <div className="sheet-body">{children}</div>
    </div>
  </div>
}
