import { useState, useEffect } from 'react'

export function useTheme() {
  const [tema, setTema] = useState(() => localStorage.getItem('fs_tema') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    localStorage.setItem('fs_tema', tema)
  }, [tema])

  const toggleTema = () => setTema(t => t === 'dark' ? 'light' : 'dark')

  return { tema, toggleTema }
}