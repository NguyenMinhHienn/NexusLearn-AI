import { useMemo, useState, useEffect } from 'react'
import Particles, { ParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { Engine } from '@tsparticles/engine'

export default function DashboardParticles() {
  const [isDark, setIsDark] = useState(false)

  // Listen for dark class changes on the root element
  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    checkDark()
    
    // Create an observer to watch for class changes on html tag
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    
    return () => observer.disconnect()
  }, [])

  const init = async (engine: Engine) => {
    await loadSlim(engine)
  }

  const options = useMemo(() => {
    const particleColor = isDark ? ['#818cf8', '#c084fc', '#2dd4bf'] : ['#4f46e5', '#9333ea', '#0891b2']
    const linkColor = isDark ? '#818cf8' : '#4f46e5'
    
    return {
      fpsLimit: 60,
      fullScreen: false,
      background: { color: 'transparent' },
      particles: {
        color: { value: particleColor },
        links: {
          color: linkColor,
          distance: 150,
          enable: true,
          opacity: isDark ? 0.15 : 0.15,
          width: 1,
        },
        move: {
          enable: true,
          speed: 0.5,
          direction: 'none' as const,
          outModes: { default: 'bounce' as const },
        },
        number: {
          density: { enable: true },
          value: 30, // Fewer particles so it doesn't distract from dashboard content
        },
        opacity: {
          value: { min: 0.1, max: 0.3 },
        },
        shape: { type: 'circle' },
        size: { value: { min: 1, max: 2.5 } },
      },
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: 'grab',
          },
        },
        modes: {
          grab: {
            distance: 180,
            links: { opacity: 0.3 },
          },
        },
      },
      detectRetina: true,
    }
  }, [isDark])

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <ParticlesProvider init={init}>
        <Particles
          id="dashboard-particles"
          options={options}
          className="w-full h-full"
        />
      </ParticlesProvider>
    </div>
  )
}
