import { useMemo, useState } from 'react'
import Particles, { ParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { Engine } from '@tsparticles/engine'

export default function ParticleBackground() {
  const init = async (engine: Engine) => {
    await loadSlim(engine)
  }

  const options = useMemo(() => ({
    fpsLimit: 60,
    fullScreen: false,
    background: { color: 'transparent' },
    particles: {
      color: { value: ['#818cf8', '#06b6d4', '#a78bfa'] },
      links: {
        color: '#818cf8',
        distance: 160,
        enable: true,
        opacity: 0.15,
        width: 1,
      },
      move: {
        enable: true,
        speed: 0.6,
        direction: 'none' as const,
        outModes: { default: 'bounce' as const },
      },
      number: {
        density: { enable: true },
        value: 70,
      },
      opacity: {
        value: { min: 0.1, max: 0.4 },
      },
      shape: { type: 'circle' },
      size: { value: { min: 1, max: 3 } },
    },
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: 'repulse',
        },
      },
      modes: {
        repulse: {
          distance: 120,
          duration: 0.4,
        },
      },
    },
    detectRetina: true,
    responsive: [
      {
        maxWidth: 768,
        options: {
          particles: {
            number: { value: 35 },
            links: { distance: 120 },
          },
        },
      },
    ],
  }), [])

  return (
    <div className="fixed inset-0 z-0">
      <ParticlesProvider init={init}>
        <Particles
          id="nexus-particles"
          options={options}
          className="w-full h-full"
        />
      </ParticlesProvider>
    </div>
  )
}
