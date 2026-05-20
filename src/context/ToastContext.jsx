import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const id = useRef(0);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const key = ++id.current;
    setToasts(t => [...t, { key, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.key !== key)), duration);
  }, []);

  const dismiss = useCallback(key => setToasts(t => t.filter(x => x.key !== key)), []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Stack de toasts */}
      <div style={{
        position: 'fixed', bottom: 28, right: 28,
        display: 'flex', flexDirection: 'column', gap: 10,
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const colors = {
            success: { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  icon: '✓', color: '#4ade80' },
            error:   { bg: 'rgba(248,113,113,0.15)',border: 'rgba(248,113,113,0.4)',icon: '✕', color: '#f87171' },
            info:    { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.4)', icon: 'ℹ', color: '#60a5fa' },
          }[t.type] || {};
          return (
            <div
              key={t.key}
              onClick={() => dismiss(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                backdropFilter: 'blur(12px)',
                borderRadius: 12, padding: '11px 16px',
                color: 'var(--text)', fontSize: 13.5, fontWeight: 500,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                animation: 'fadeIn 0.25s ease',
                pointerEvents: 'auto', cursor: 'pointer',
                maxWidth: 340,
              }}
            >
              <span style={{ fontSize: 14, color: colors.color, fontWeight: 700, flexShrink: 0 }}>
                {colors.icon}
              </span>
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
