import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DataTexture,
  FloatType,
  NearestFilter,
  RGBAFormat,
  ShaderMaterial,
  type Points as PointsObject,
} from 'three'
import { LAYOUTS } from './layouts'
import { fragmentShader, vertexShader } from './shaders'
import { prefersReducedMotion, scroll } from '../scroll'

const COUNT = prefersReducedMotion ? 14000 : 48000

export function ParticleField() {
  const points = useRef<PointsObject>(null)
  const material = useRef<ShaderMaterial>(null)
  const morph = useRef(0)

  const { geometry, layoutTexture } = useMemo(() => {
    const rows = LAYOUTS.length
    const data = new Float32Array(COUNT * rows * 4)

    LAYOUTS.forEach((layout, row) => {
      const positions = layout(COUNT)
      for (let i = 0; i < COUNT; i++) {
        const src = i * 3
        const dst = (row * COUNT + i) * 4
        data[dst] = positions[src]
        data[dst + 1] = positions[src + 1]
        data[dst + 2] = positions[src + 2]
        data[dst + 3] = 1
      }
    })

    const texture = new DataTexture(data, COUNT, rows, RGBAFormat, FloatType)
    texture.minFilter = NearestFilter
    texture.magFilter = NearestFilter
    texture.needsUpdate = true

    const us = new Float32Array(COUNT)
    const seeds = new Float32Array(COUNT)
    // positions are decided entirely in the shader, but three still needs one to build the draw
    const placeholder = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      us[i] = (i + 0.5) / COUNT
      seeds[i] = Math.random()
    }

    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(placeholder, 3))
    geo.setAttribute('aU', new BufferAttribute(us, 1))
    geo.setAttribute('aSeed', new BufferAttribute(seeds, 1))

    return { geometry: geo, layoutTexture: texture }
  }, [])

  const uniforms = useMemo(
    () => ({
      uLayouts: { value: layoutTexture },
      uLayoutRows: { value: LAYOUTS.length },
      uMorph: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: 2.6 },
      uTurbulence: { value: prefersReducedMotion ? 0 : 0.9 },
      uColorA: { value: new Color('#67e8f9') },
      uColorB: { value: new Color('#a78bfa') },
    }),
    [layoutTexture],
  )

  useEffect(
    () => () => {
      geometry.dispose()
      layoutTexture.dispose()
    },
    [geometry, layoutTexture],
  )

  useFrame((_, delta) => {
    if (!material.current) return

    // lenis already smooths scroll; this only takes the edge off wheel-step jumps
    const ease = prefersReducedMotion ? 1 : 1 - Math.pow(0.001, delta)
    morph.current += (scroll.morph - morph.current) * ease

    material.current.uniforms.uMorph.value = morph.current
    if (!prefersReducedMotion) material.current.uniforms.uTime.value += delta

    if (points.current) points.current.rotation.y += delta * 0.02
  })

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}
