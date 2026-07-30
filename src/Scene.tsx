import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { ParticleField } from './particles/ParticleField'
import { pointer } from './pointer'
import { prefersReducedMotion } from './scroll'

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
  return (
    <Canvas
      className="fixed! inset-0"
      camera={{ position: [0, 0, 9], fov: 52 }}
      dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <ParticleField />
      {!prefersReducedMotion && <CameraDrift />}
      <EffectComposer>
        <Bloom intensity={0.85} luminanceThreshold={0.25} luminanceSmoothing={0.4} mipmapBlur />
      </EffectComposer>
    </Canvas>
  )
}
