import { useEffect, useRef, useState } from 'react';

/**
 * Imagem com lazy-load via IntersectionObserver.
 * Mostra um placeholder roxo com shimmer enquanto não está visível / carregando.
 */
export default function LazyImg({ src, alt = '', style = {}, ...rest }) {
  const ref        = useRef(null);
  const [vis, setVis]     = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVis(true); obs.disconnect(); } },
      { rootMargin: '200px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {/* Placeholder shimmer */}
      {!loaded && (
        <div className="skeleton" style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(79,70,229,0.08) 100%)',
        }} />
      )}
      {vis && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', display: 'block',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            ...rest.imgStyle,
          }}
          {...rest}
        />
      )}
    </div>
  );
}
