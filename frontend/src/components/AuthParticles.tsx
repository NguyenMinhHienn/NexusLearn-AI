import { useMemo, useState } from 'react'
import Particles, { ParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { Engine } from '@tsparticles/engine'

export default function AuthParticles() {
  const init = async (engine: Engine) => {
    await loadSlim(engine)
  }

  const options = useMemo(() => ({
    fpsLimit: 60,
    fullScreen: false,
    background: { color: '#0a0a1a' },
    particles: {
      color: { value: ['#6366f1', '#8b5cf6', '#06b6d4'] },
      links: {
        color: '#6366f1',
        distance: 140,
        enable: true,
        opacity: 0.08,
        width: 0.8,
      },
      move: {
        enable: true,
        speed: 0.3,
        direction: 'none' as const,
        outModes: { default: 'bounce' as const },
      },
      number: {
        density: { enable: true },
        value: 45,
      },
      opacity: {
        value: { min: 0.05, max: 0.25 },
      },
      shape: { type: 'circle' },
      size: { value: { min: 0.5, max: 2 } },
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
          distance: 140,
          links: { opacity: 0.2 },
        },
      },
    },
    detectRetina: true,
    responsive: [
      {
        maxWidth: 768,
        options: {
          particles: {
            number: { value: 25 },
          },
        },
      },
    ],
  }), [])

  return (
    <div className="absolute inset-0 z-0">
      <ParticlesProvider init={init}>
        <Particles
          id="auth-particles"
          options={options}
          className="w-full h-full"
        />
      </ParticlesProvider>
    </div>
  )
}
