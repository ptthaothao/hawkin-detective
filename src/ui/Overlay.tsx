import { useEffect, type ReactNode } from 'react';

/** A close-up over the scene. The scene behind leans back and blurs (see `.stage.leaning`).
 *  No chrome: click outside or press Escape to step back. Omit onClose to hold the player here. */
export function Overlay({
  label,
  onClose,
  className = '',
  children,
}: {
  label: string;
  onClose?: () => void;
  className?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={`overlay ${className}`} role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
      <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
      {onClose && (
        <button className="step-back" onClick={onClose}>
          ← lùi lại
        </button>
      )}
    </div>
  );
}
