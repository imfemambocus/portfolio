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
import { LAYOUTS, LAYOUT_STYLES } from './layouts'
import { fragmentShader, vertexShader } from './shaders'
import { prefersReducedMotion, scroll } from '../scroll'

const COUNT = prefersReducedMotion ? 14000 : 48000

/*
 * layouts are tiled into a narrow grid instead of one row each: a row-per-layout
 * texture would be COUNT texels wide, and 48000 exceeds the 16384 MAX_TEXTURE_SIZE
 * most GPUs report, so the upload fails and every particle collapses to the origin.
 */
const TEX_W = 256
const TILE_H = Math.ceil(COUNT / TEX_W)

export function ParticleField() {
  const points = useRef<PointsObject>(null)
  const material = useRef<ShaderMaterial>(null)
  const morph = useRef(0)

  const { geometry, layoutTexture } = useMemo(() => {
    const rows = LAYOUTS.length
    const data = new Float32Array(TEX_W * TILE_H * rows * 4)

    LAYOUTS.forEach((layout, layer) => {
      const positions = layout(COUNT)
      for (let i = 0; i < COUNT; i++) {
        const src = i * 3
        const col = i % TEX_W
        const row = Math.floor(i / TEX_W)
        const dst = ((layer * TILE_H + row) * TEX_W + col) * 4
        data[dst] = positions[src]
        data[dst + 1] = positions[src + 1]
        data[dst + 2] = positions[src + 2]
        data[dst + 3] = 1
      }
    })

    const texture = new DataTexture(data, TEX_W, TILE_H * rows, RGBAFormat, FloatType)
    texture.minFilter = NearestFilter
    texture.magFilter = NearestFilter
    texture.needsUpdate = true

    const indices = new Float32Array(COUNT)
    const seeds = new Float32Array(COUNT)
    // positions are decided entirely in the shader, but three still needs one to build the draw
    const placeholder = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      indices[i] = i
      seeds[i] = Math.random()
    }

    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(placeholder, 3))
    geo.setAttribute('aIndex', new BufferAttribute(indices, 1))
    geo.setAttribute('aSeed', new BufferAttribute(seeds, 1))

    return { geometry: geo, layoutTexture: texture }
  }, [])

  const uniforms = useMemo(
    () => ({
      uLayouts: { value: layoutTexture },
      uLayoutRows: { value: LAYOUTS.length },
      uTexW: { value: TEX_W },
      uTileH: { value: TILE_H },
      uMorph: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: 3.2 },
      uTurbulence: { value: prefersReducedMotion ? 0 : 0.9 },
      uOpacity: { value: LAYOUT_STYLES[0].opacity },
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

    // art direction rides the same morph value as the positions, so it never lags the form
    const i0 = Math.floor(morph.current)
    const i1 = Math.min(i0 + 1, LAYOUT_STYLES.length - 1)
    const t = morph.current - i0
    const from = LAYOUT_STYLES[i0]
    const to = LAYOUT_STYLES[i1]

    material.current.uniforms.uOpacity.value = from.opacity + (to.opacity - from.opacity) * t

    if (points.current) {
      points.current.position.x = from.offsetX + (to.offsetX - from.offsetX) * t
      points.current.rotation.y += delta * 0.02
    }
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
