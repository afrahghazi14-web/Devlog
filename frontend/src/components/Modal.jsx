import React, { useEffect, useRef } from "react";

/**
 * Reusable accessible modal dialog component.
 * Features:
 * - Backdrop overlay with click-to-close behavior
 * - Close on Escape keyboard event
 * - Automatic focus management (shifts focus into modal container on open, restores previous focus on close)
 * - Constrained max height with vertical scrolling for small screens
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}) {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Retain currently focused element to restore it on modal close
    previousActiveElement.current = document.activeElement;

    // Move focus into the modal container for keyboard accessibility
    if (modalRef.current) {
      modalRef.current.focus();
    }

    // Close on Escape key press
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Prevent body scrolling while modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;

      // Restore previously focused element
      if (
        previousActiveElement.current &&
        typeof previousActiveElement.current.focus === "function"
      ) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${maxWidth} bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 flex flex-col max-h-[90vh] overflow-hidden outline-none`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <h2
            id="modal-dialog-title"
            className="text-lg font-bold text-white tracking-tight"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg p-1.5 transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
