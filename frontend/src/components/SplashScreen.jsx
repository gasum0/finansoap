import { useEffect, useState } from 'react'

export default function SplashScreen({ onFinish }) {
  const [fase, setFase] = useState('entrada') // entrada | visible | salida

  useEffect(() => {
    // Fase 1: animación de entrada (0.6s)
    // Fase 2: visible (2s)
    // Fase 3: animación de salida (0.6s)
    const t1 = setTimeout(() => setFase('visible'), 600)
    const t2 = setTimeout(() => setFase('salida'), 2600)
    const t3 = setTimeout(() => onFinish(), 3200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0b1120',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'opacity 0.6s ease',
        opacity: fase === 'salida' ? 0 : 1,
      }}
    >
      {/* Logo animado */}
      <div
        style={{
          transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: fase === 'entrada' ? 'scale(0.5) translateY(30px)' : 'scale(1) translateY(0)',
          opacity: fase === 'entrada' ? 0 : 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        {/* Ícono */}
        <div style={{
          width: 96,
          height: 96,
          background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
          borderRadius: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 60px rgba(99,102,241,0.5)',
        }}>
          <i className="fas fa-spa" style={{ color: 'white', fontSize: 44 }} />
        </div>

        {/* Nombre */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 36,
            fontWeight: 700,
            color: 'white',
            margin: 0,
            letterSpacing: '-0.5px',
          }}>
            Rosas
          </h1>
          <p style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#a78bfa',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            margin: '4px 0 0',
          }}>
            Enjabonarte
          </p>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: 14,
          color: '#475569',
          margin: 0,
          transition: 'opacity 0.4s ease 0.3s',
          opacity: fase === 'visible' ? 1 : 0,
        }}>
          Sistema de gestión financiera
        </p>

        {/* Barra de progreso */}
        <div style={{
          width: 160,
          height: 2,
          background: '#1e293b',
          borderRadius: 99,
          overflow: 'hidden',
          transition: 'opacity 0.4s ease 0.3s',
          opacity: fase === 'visible' ? 1 : 0,
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #a855f7)',
            borderRadius: 99,
            animation: 'progreso 2s ease forwards',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes progreso {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  )
}