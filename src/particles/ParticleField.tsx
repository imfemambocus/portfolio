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
import {
  THEME_FADE_MS,
  onRenderThemeChange,
  onThemeChange,
  renderTheme,
  type Theme,
} from '../theme'
import { LAYOUTS, LAYOUT_STYLES } from './layouts'
import { rng } from './rng'
import { fragmentShader, vertexShader } from './shaders'
import { prefersReducedMotion, scroll } from '../scroll'

const COUNT = prefersReducedMotion ? 22000 : 160000

/*
 * a row per layout would make the texture COUNT texels wide. 160000 is past the 16384
 * MAX_TEXTURE_SIZE most GPUs report: the upload fails silently and every particle
 * collapses onto the origin. tile it into a narrow grid instead.
 */
const TEX_W = 256
const TILE_H = Math.ceil(COUNT / TEX_W)

/*
 * light mode is not a palette swap. additive blending only ever brightens and does
 * nothing at all on an off-white page: light needs normal blending, and Scene turns
 * bloom off for the same reason.
 *
 * the dark tones are pure greys, b being a at 80% brightness. additive blending clips
 * dense cores to white while the sparse fringe keeps the point colour, and whichever
 * channel leads becomes a coloured glow around every cluster. depth comes from
 * brightness here, never from hue.
 */
const PALETTE: Record<Theme, { a: string; b: string; blending: Blending }> = {
  dark: { a: '#f6f6f6', b: '#c5c5c5', blending: AdditiveBlending },
  light: { a: '#17171c', b: '#2f3a40', blending: NormalBlending },
}

/* not zero: a full blink is more noticeable than the swap it hides */
const THEME_DIP = 0.08

/*
 * gl_PointSize is in device pixels. a fixed value thins the field out as the drawing
 * buffer grows: ink coverage over the hero measured 27.9% on 2520x1575 against 6.3% on
 * 5760x3240. sizing against the reference height holds a point at a constant fraction
 * of the frame.
 */
const BASE_POINT_SIZE = 3.2
const REFERENCE_BUFFER_H = 1575

/*
 * the world width the forms were art-directed against (1440x900 at fov 52, z 9). the fov
 * is fixed, so a wider viewport shows more world and a form sized in world units shrinks
 * against the screen: the hero plume measured 50% of the width there against 45% at 16:9.
 *
 * the gain only ever grows. below the reference the forms already overfill the viewport,
 * and shrinking would turn a full-bleed background into a small motif on a phone.
 */
const REFERENCE_WORLD_WIDTH = 14.05
const MAX_VIEWPORT_GAIN = 1.5

/* bounded, never accumulated: a form built to run off the edges swings its ends into frame */
const SWAY_ANGLE = 0.1
const SWAY_SPEED = 0.2

function themeDip(start: { current: number }) {
  if (start.current < 0) return 1

  const progress = (performance.now() - start.current) / THEME_FADE_MS
  if (progress >= 2) {
    start.current = -1
    return 1
  }

  const distance = Math.abs(progress - 1)
  const eased = distance * distance * (3 - 2 * distance)
  return THEME_DIP + (1 - THEME_DIP) * eased
}

export function ParticleField() {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const dpr = useThree((state) => state.viewport.dpr)
  const points = useRef<PointsObject>(null)
  const material = useRef<ShaderMaterial>(null)
  const morph = useRef(0)
  const sway = useRef(0)
  const dipStart = useRef(-1)
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
      uSize: { value: BASE_POINT_SIZE },
      uTurbulence: { value: prefersReducedMotion ? 0 : 0.9 },
      uOpacity: { value: LAYOUT_STYLES[0].opacity },
      uPointer: { value: new Vector3(999, 999, 0) },
      uPointerStrength: { value: 0 },
      uLightMode: { value: renderTheme.current === 'light' ? 1 : 0 },
      uColorA: { value: new Color(PALETTE[renderTheme.current].a) },
      uColorB: { value: new Color(PALETTE[renderTheme.current].b) },
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

    apply(renderTheme.current)

    // the dip runs off the toggle; the swap runs off renderTheme, at the bottom of it
    const stopDip = onThemeChange(() => {
      if (!prefersReducedMotion) dipStart.current = performance.now()
    })
    const stopSwap = onRenderThemeChange(apply)

    return () => {
      stopDip()
      stopSwap()
    }
  }, [])

  useEffect(() => {
    if (!material.current) return
    material.current.uniforms.uSize.value =
      BASE_POINT_SIZE * ((size.height * dpr) / REFERENCE_BUFFER_H)
  }, [size, dpr])

  useEffect(
    () => () => {
      geometry.dispose()
      layoutTexture.dispose()
    },
    [geometry, layoutTexture],
  )

  useFrame((state, delta) => {
    if (!material.current) return

    // lenis already smooths scroll; this only takes the edge off wheel-step jumps
    const ease = prefersReducedMotion ? 1 : 1 - Math.pow(0.001, delta)
    morph.current += (scroll.morph - morph.current) * ease

    material.current.uniforms.uMorph.value = morph.current
    if (!prefersReducedMotion) material.current.uniforms.uTime.value += delta

    // art direction interpolates on the same morph value as the positions; it must not lag the form
    const i0 = Math.floor(morph.current)
    const i1 = Math.min(i0 + 1, LAYOUT_STYLES.length - 1)
    const t = morph.current - i0
    const from = LAYOUT_STYLES[i0]
    const to = LAYOUT_STYLES[i1]

    // renderTheme, not theme: the swap has to land inside the dip like the palette does
    const light = renderTheme.current === 'light'
    const fromOpacity = light ? from.opacityLight : from.opacity
    const toOpacity = light ? to.opacityLight : to.opacity

    material.current.uniforms.uOpacity.value =
      (fromOpacity + (toOpacity - fromOpacity) * t) * themeDip(dipStart)
    /*
     * offsetX rides the gain with the scale. it is a world-unit displacement, and leaving
     * it fixed while the form grows slides the form off the copy it sits beside. offsetY
     * does not: the visible world height does not change with aspect.
     */
    const gain = Math.min(
      Math.max(state.viewport.width / REFERENCE_WORLD_WIDTH, 1),
      MAX_VIEWPORT_GAIN,
    )
    const offsetX = (from.offsetX + (to.offsetX - from.offsetX) * t) * gain
    const offsetY = from.offsetY + (to.offsetY - from.offsetY) * t
    const scale = (from.scale + (to.scale - from.scale) * t) * gain

    if (points.current) {
      points.current.position.x = offsetX
      points.current.position.y = offsetY
      points.current.scale.setScalar(scale)

      if (prefersReducedMotion) {
        points.current.rotation.y = 0
      } else {
        sway.current += delta
        points.current.rotation.y = Math.sin(sway.current * SWAY_SPEED) * SWAY_ANGLE
      }
    }

    if (prefersReducedMotion) return

    /*
     * where the cursor crosses z=0, in the field's own space. the layout style moves and
     * scales the field, and both have to come back off before the shader sees it, or the
     * repulsion drifts away from the actual cursor.
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
