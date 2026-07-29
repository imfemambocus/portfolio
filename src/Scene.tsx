import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { ParticleField } from './particles/ParticleField'
import { prefersReducedMotion } from './scroll'

const pointer = { x: 0, y: 0 }

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    (event) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1
    },
    { passive: true },
  )
}

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
      className="!fixed inset-0"
      camera={{ position: [0, 0, 9], fov: 52 }}
      dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <ParticleField />
      {!prefersReducedMotion && <CameraDrift />}
      <EffectComposer>
        <Bloom intensity={1.15} luminanceThreshold={0.1} luminanceSmoothing={0.5} mipmapBlur />
      </EffectComposer>
    </Canvas>
  )
}
