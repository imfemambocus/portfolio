import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DataTexture,
  FloatType,
  NearestFilter,
  NormalBlending,
  RGBAFormat,
  ShaderMaterial,
  Vector3,
  type Blending,
  type Points as PointsObject,
} from 'three'
import { pointer } from '../pointer'
import { onThemeChange, theme, type Theme } from '../theme'
import { LAYOUTS, LAYOUT_STYLES } from './layouts'
import { rng } from './rng'
import { fragmentShader, vertexShader } from './shaders'
import { prefersReducedMotion, scroll } from '../scroll'

const COUNT = prefersReducedMotion ? 22000 : 80000

/*
 * layouts are tiled into a narrow grid instead of one row each: a row-per-layout
 * texture would be COUNT texels wide, and 80000 exceeds the 16384 MAX_TEXTURE_SIZE
 * most GPUs report, so the upload fails and every particle collapses to the origin.
 */
const TEX_W = 256
const TILE_H = Math.ceil(COUNT / TEX_W)

/*
 * light mode is not just a palette swap. additive blending only ever brightens, so on
 * an off-white page it does nothing at all: dark particles need normal blending, and
 * bloom is switched off in Scene for the same reason.
 */
const PALETTE: Record<Theme, { a: string; b: string; blending: Blending }> = {
  dark: { a: '#f6f6f3', b: '#bfcbd2', blending: AdditiveBlending },
  light: { a: '#17171c', b: '#2f3a40', blending: NormalBlending },
}

export function ParticleField() {
  const camera = useThree((state) => state.camera)
  const points = useRef<PointsObject>(null)
  const material = useRef<ShaderMaterial>(null)
  const morph = useRef(0)
  const cursor = useMemo(() => new Vector3(), [])

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
    const random = rng(0x5eed)
    for (let i = 0; i < COUNT; i++) {
      indices[i] = i
      seeds[i] = random()
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
      uPointer: { value: new Vector3(999, 999, 0) },
      uPointerStrength: { value: 0 },
      uLightMode: { value: theme.current === 'light' ? 1 : 0 },
      uColorA: { value: new Color(PALETTE[theme.current].a) },
      uColorB: { value: new Color(PALETTE[theme.current].b) },
    }),
    [layoutTexture],
  )

  useEffect(() => {
    const apply = (next: Theme) => {
      const target = material.current
      if (!target) return

      const palette = PALETTE[next]
      target.uniforms.uColorA.value.set(palette.a)
      target.uniforms.uColorB.value.set(palette.b)
      target.uniforms.uLightMode.value = next === 'light' ? 1 : 0
      target.blending = palette.blending
      target.needsUpdate = true
    }

    apply(theme.current)
    return onThemeChange(apply)
  }, [])

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
    const offsetX = from.offsetX + (to.offsetX - from.offsetX) * t
    const offsetY = from.offsetY + (to.offsetY - from.offsetY) * t
    const scale = from.scale + (to.scale - from.scale) * t

    if (points.current) {
      points.current.position.x = offsetX
      points.current.position.y = offsetY
      points.current.scale.setScalar(scale)
      points.current.rotation.y += delta * 0.02
    }

    if (prefersReducedMotion) return

    /*
     * where the cursor crosses the z=0 plane, in the field's own space. the field is
     * moved and scaled by its layout style, so both have to come back off before the
     * shader sees it, or the repulsion drifts away from the actual cursor.
     */
    cursor.set(pointer.x, -pointer.y, 0.5).unproject(camera).sub(camera.position).normalize()
    const travel = -camera.position.z / cursor.z
    cursor.multiplyScalar(travel).add(camera.position)
    cursor.x = (cursor.x - offsetX) / scale
    cursor.y = (cursor.y - offsetY) / scale

    material.current.uniforms.uPointer.value.copy(cursor)
    material.current.uniforms.uPointerStrength.value =
      from.pointer + (to.pointer - from.pointer) * t
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
