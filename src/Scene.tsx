import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { ParticleField } from './particles/ParticleField'
import { pointer } from './pointer'
import { prefersReducedMotion } from './scroll'
import { useRenderTheme } from './theme'

function CameraDrift() {
  const camera = useThree((state) => state.camera)

  useFrame((_, delta) => {
    const ease = 1 - Math.pow(0.02, delta)
    camera.position.x += (pointer.x * 0.9 - camera.position.x) * ease
    camera.position.y += (-pointer.y * 0.55 - camera.position.y) * ease
    camera.lookAt(0, 0, 0)
  })

  return null
}

export function Scene() {
  const current = useRenderTheme()

  return (
    <Canvas
      className="field-mask fixed! inset-0"
      camera={{ position: [0, 0, 9], fov: 52 }}
      dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <ParticleField />
      {!prefersReducedMotion && <CameraDrift />}

      {/* bloom only brightens. on an off-white page it washes the field out instead of glowing */}
      {current === 'dark' && (
        <EffectComposer>
          {/* levels caps how far the mip chain spreads the glow. the default reaches most of
              the viewport, which lifts the background into a broad bright band instead of a
              halo, and on an OLED that reads as the page being unevenly lit */}
          <Bloom
            intensity={0.85}
            luminanceThreshold={0.45}
            luminanceSmoothing={0.4}
            levels={4}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </Canvas>
  )
}
