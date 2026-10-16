import { useEffect, useRef, useState } from 'react'

// 3D 室内剖面沙盘：
// - 真实 PBR 材质（程序化木纹/织物/金属/玻璃，带法线与粗糙度贴图）
// - 四种户型面积差异：豪华(5室3厅) > 普通(3室2厅) > 城市(2房1厅) > 学生(1房1厅)
// - 家具可交互：悬停发光高亮，点击切换状态（灯开关、柜门开合、抽屉拉出等）

const VIEW_ANGLES = [-0.5, -0.3, 0.1, 0.35]
const SWITCH_MS = 450

export default function TypeHouse({ activeIndex }) {
  const mountRef = useRef(null)
  const activeRef = useRef(activeIndex)
  const [failed, setFailed] = useState(false)
  activeRef.current = activeIndex

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined
    let disposed = false
    let raf = 0
    let io
    let started = false
    let teardown = () => {}

    const reduce = typeof matchMedia !== 'undefined'
      && matchMedia('(prefers-reduced-motion: reduce)').matches

    const boot = async () => {
      if (started || disposed) return
      started = true
      let THREE
      try { THREE = await import('three') } catch { if (!disposed) setFailed(true); return }
      if (disposed) return
      if (!window.WebGLRenderingContext) { setFailed(true); return }

      const w = Math.max(1, mount.clientWidth)
      const h = Math.max(1, mount.clientHeight)

      let renderer
      try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }) }
      catch { setFailed(true); return }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(w, h)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.2
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab'
      mount.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x0a0a0c)
      const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100)

      // ---- 光照 ----
      scene.add(new THREE.HemisphereLight(0x3a3d48, 0x141416, 0.3))
      const sun = new THREE.DirectionalLight(0xffd9a8, 2.6)
      sun.position.set(-7, 9, 5)
      sun.castShadow = true
      sun.shadow.mapSize.set(2048, 2048)
      sun.shadow.camera.left = -8; sun.shadow.camera.right = 8
      sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -8
      sun.shadow.camera.near = 1; sun.shadow.camera.far = 35
      sun.shadow.bias = -0.0003; sun.shadow.radius = 4
      scene.add(sun)
      const bounce = new THREE.DirectionalLight(0x8a92b0, 0.4)
      bounce.position.set(5, 3, -6); scene.add(bounce)

      // ---- 程序化纹理工厂 ----
      const textures = []
      const rnd32 = (seed) => {
        let s = seed >>> 0
        return () => {
          s = (s + 0x6D2B79F5) | 0
          let t = Math.imul(s ^ (s >>> 15), 1 | s)
          t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296
        }
      }
      const toTex = (canvas, srgb) => {
        const t = new THREE.CanvasTexture(canvas)
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        if (srgb) t.colorSpace = THREE.SRGBColorSpace
        t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
        textures.push(t)
        return t
      }
      const noisy = (ctx, size, amp, rnd) => {
        const img = ctx.getImageData(0, 0, size, size)
        const d = img.data
        for (let i = 0; i < d.length; i += 4) {
          const n = (rnd() - 0.5) * amp
          d[i] += n; d[i + 1] += n; d[i + 2] += n
        }
        ctx.putImageData(img, 0, 0)
      }

      // 生成法线贴图（从高度图）
      const heightToNormal = (heightCanvas, strength = 2) => {
        const size = heightCanvas.width
        const hctx = heightCanvas.getContext('2d')
        const hdata = hctx.getImageData(0, 0, size, size).data
        const out = document.createElement('canvas')
        out.width = out.height = size
        const octx = out.getContext('2d')
        const odata = octx.createImageData(size, size)
        const getH = (x, y) => hdata[((y + size) % size * size + (x + size) % size) * 4] / 255
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const dx = (getH(x + 1, y) - getH(x - 1, y)) * strength
            const dy = (getH(x, y + 1) - getH(x, y - 1)) * strength
            const nx = -dx, ny = -dy, nz = 1
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
            const i = (y * size + x) * 4
            odata.data[i] = ((nx / len) * 0.5 + 0.5) * 255
            odata.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255
            odata.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255
            odata.data[i + 3] = 255
          }
        }
        octx.putImageData(odata, 0, 0)
        const t = new THREE.CanvasTexture(out)
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        textures.push(t)
        return t
      }

      // 真实木地板：板条 + 木纹 + 节疤 + 法线
      const makeWoodFloor = (seed, baseColor) => {
        const size = 512
        const c = document.createElement('canvas'); c.width = c.height = size
        const ctx = c.getContext('2d')
        const rnd = rnd32(seed)
        const base = parseInt(baseColor.slice(1), 16)
        const br = (base >> 16) & 255, bg = (base >> 8) & 255, bb = base & 255
        const plankH = size / 8
        for (let i = 0; i < 8; i++) {
          const y = i * plankH
          const shade = 0.82 + rnd() * 0.36
          ctx.fillStyle = `rgb(${(br*shade)|0},${(bg*shade)|0},${(bb*shade)|0})`
          ctx.fillRect(0, y, size, plankH)
          for (let k = 0; k < 40; k++) {
            const yy = y + rnd() * plankH
            ctx.strokeStyle = `rgba(40,20,5,${0.015 + rnd() * 0.07})`
            ctx.lineWidth = 0.4 + rnd() * 1.2
            ctx.beginPath()
            ctx.moveTo(0, yy)
            ctx.bezierCurveTo(size * 0.3, yy + (rnd() - 0.5) * 5, size * 0.7, yy + (rnd() - 0.5) * 5, size, yy)
            ctx.stroke()
          }
          if (rnd() > 0.35) {
            const kx = rnd() * size, ky = y + plankH * (0.2 + rnd() * 0.6)
            const kr = 3 + rnd() * 10
            const kg = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr)
            kg.addColorStop(0, `rgba(50,25,8,${0.4 + rnd() * 0.3})`)
            kg.addColorStop(0.6, `rgba(70,35,12,${0.2})`)
            kg.addColorStop(1, 'rgba(70,35,12,0)')
            ctx.fillStyle = kg
            ctx.beginPath(); ctx.arc(kx, ky, kr, 0, Math.PI * 2); ctx.fill()
          }
        }
        for (let i = 1; i < 8; i++) {
          ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(0, i * plankH - 1, size, 2)
        }
        for (let i = 0; i < 8; i++) {
          if (rnd() > 0.3) {
            const x = size * (0.15 + rnd() * 0.7)
            ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 0.5, i * plankH, 1, plankH)
          }
        }
        noisy(ctx, size, 5, rnd)
        const map = toTex(c, true)
        const normal = heightToNormal(c, 1.5)
        return { map, normal }
      }

      const floorData = [
        makeWoodFloor(11, '#8a5a2e'),
        makeWoodFloor(22, '#a06b3e'),
        makeWoodFloor(33, '#7a6248'),
        makeWoodFloor(44, '#b08a4e'),
      ]

      // 墙面（带细微肌理法线）
      const makeWall = (seed, base, dark = false) => {
        const size = 256
        const c = document.createElement('canvas'); c.width = c.height = size
        const ctx = c.getContext('2d')
        const rnd = rnd32(seed)
        ctx.fillStyle = base; ctx.fillRect(0, 0, size, size)
        // 石膏板纹理
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = dark ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)'
          ctx.lineWidth = 0.5
          ctx.beginPath(); ctx.moveTo(0, rnd() * size); ctx.lineTo(size, rnd() * size); ctx.stroke()
        }
        noisy(ctx, size, dark ? 4 : 6, rnd)
        const map = toTex(c, true)
        const normal = heightToNormal(c, 0.8)
        return { map, normal }
      }
      const wallData = makeWall(77, '#e8e4dc')
      const wallDarkData = makeWall(88, '#3a3530', true)

      // 织物纹理（沙发/床品）
      const makeFabric = (seed, base) => {
        const size = 256
        const c = document.createElement('canvas'); c.width = c.height = size
        const ctx = c.getContext('2d')
        const rnd = rnd32(seed)
        ctx.fillStyle = base; ctx.fillRect(0, 0, size, size)
        // 编织纹理
        for (let y = 0; y < size; y += 2) {
          for (let x = 0; x < size; x += 2) {
            const v = (rnd() - 0.5) * 16
            ctx.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 80})`
            ctx.fillRect(x, y, 1, 1)
          }
        }
        noisy(ctx, size, 8, rnd)
        const map = toTex(c, true)
        const normal = heightToNormal(c, 1.2)
        return { map, normal }
      }
      const fabricBlue = makeFabric(101, '#5a6b82')
      const fabricWarm = makeFabric(102, '#a8704a')
      const fabricGreen = makeFabric(103, '#6b7a5a')
      const fabricGray = makeFabric(104, '#8a8a8a')

      // ---- 材质库（PBR）----
      const mats = {
        floor: (i) => new THREE.MeshStandardMaterial({
          map: floorData[i].map, normalMap: floorData[i].normal,
          roughness: 0.6, metalness: 0.05, envMapIntensity: 0.35
        }),
        wall: new THREE.MeshStandardMaterial({
          map: wallData.map, normalMap: wallData.normal,
          color: 0xefeae0, roughness: 0.92, metalness: 0, envMapIntensity: 0.2
        }),
        wallDark: new THREE.MeshStandardMaterial({
          map: wallDarkData.map, normalMap: wallDarkData.normal,
          color: 0x4a4238, roughness: 0.88, metalness: 0.02, envMapIntensity: 0.2
        }),
        wood: new THREE.MeshStandardMaterial({
          map: floorData[0].map, color: 0x7a5a32, roughness: 0.5, metalness: 0.05, envMapIntensity: 0.5
        }),
        woodDark: new THREE.MeshStandardMaterial({
          map: floorData[2].map, color: 0x5a3e22, roughness: 0.55, metalness: 0.05, envMapIntensity: 0.5
        }),
        fabric: (f) => new THREE.MeshStandardMaterial({
          map: f.map, normalMap: f.normal, roughness: 0.95, metalness: 0, envMapIntensity: 0.15
        }),
        white: new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.7, metalness: 0 }),
        metal: new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.22, metalness: 0.92, envMapIntensity: 1.2 }),
        metalBrass: new THREE.MeshStandardMaterial({ color: 0xb8924a, roughness: 0.3, metalness: 0.85, envMapIntensity: 1 }),
        glass: new THREE.MeshPhysicalMaterial({
          color: 0xc8d8e8, roughness: 0.05, metalness: 0, transmission: 0.7,
          thickness: 0.2, ior: 1.45, envMapIntensity: 0.8
        }),
        ceramic: new THREE.MeshStandardMaterial({ color: 0xf5f3ee, roughness: 0.3, metalness: 0, envMapIntensity: 0.3 }),
        plant: new THREE.MeshStandardMaterial({ color: 0x4a6741, roughness: 0.9, metalness: 0 }),
        plantPot: new THREE.MeshStandardMaterial({ color: 0xc4a882, roughness: 0.7, metalness: 0.05 }),
      }

      // 环境贴图（玻璃/金属反射）
      const envCanvas = document.createElement('canvas')
      envCanvas.width = 512; envCanvas.height = 256
      {
        const ectx = envCanvas.getContext('2d')
        const eg = ectx.createLinearGradient(0, 0, 0, 256)
        eg.addColorStop(0, '#f7f9fc'); eg.addColorStop(0.32, '#eef2f8')
        eg.addColorStop(0.48, '#d9dfea'); eg.addColorStop(0.53, '#c3c9d4')
        eg.addColorStop(1, '#8b919c')
        ectx.fillStyle = eg; ectx.fillRect(0, 0, 512, 256)
      }
      const envTex = new THREE.CanvasTexture(envCanvas)
      envTex.mapping = THREE.EquirectangularReflectionMapping
      envTex.colorSpace = THREE.SRGBColorSpace
      textures.push(envTex)
      const pmrem = new THREE.PMREMGenerator(renderer)
      const envRT = pmrem.fromEquirectangular(envTex)
      scene.environment = envRT.texture
      pmrem.dispose()

      // ---- 几何缓存 ----
      const boxCache = new Map()
      const boxGeo = (w2, h2, d2) => {
        const key = `${w2}x${h2}x${d2}`
        let g = boxCache.get(key)
        if (!g) { g = new THREE.BoxGeometry(w2, h2, d2); boxCache.set(key, g) }
        return g
      }
      const cylCache = new Map()
      const cylGeo = (rT, rB, h, seg = 16) => {
        const key = `${rT}x${rB}x${h}x${seg}`
        let g = cylCache.get(key)
        if (!g) { g = new THREE.CylinderGeometry(rT, rB, h, seg); cylCache.set(key, g) }
        return g
      }

      // ---- 交互系统 ----
      const interactives = [] // { mesh, onHover, onClick, state }
      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()

      const addBox = (group, w2, h2, d2, x, y, z, mat, rx = 0, ry = 0, rz = 0) => {
        const m = new THREE.Mesh(boxGeo(w2, h2, d2), mat)
        m.position.set(x, y, z)
        m.rotation.set(rx, ry, rz)
        m.castShadow = true; m.receiveShadow = true
        group.add(m)
        return m
      }
      const addCyl = (group, rT, rB, h, x, y, z, mat, seg = 16) => {
        const m = new THREE.Mesh(cylGeo(rT, rB, h, seg), mat)
        m.position.set(x, y, z)
        m.castShadow = true; m.receiveShadow = true
        group.add(m)
        return m
      }

      // 注册可交互物体
      const registerInteractive = (mesh, opts = {}) => {
        const item = {
          mesh,
          state: opts.initialState || {},
          baseEmissive: mesh.material.emissive ? mesh.material.emissive.clone() : null,
          onHover: opts.onHover || null,
          onClick: opts.onClick || null,
          hovered: false,
        }
        interactives.push(item)
        return item
      }

      // 家具：床（可点击切换被子掀开/盖好）
      const makeBed = (group, x, y, z, rot = 0, fabricData = fabricBlue) => {
        const g = new THREE.Group()
        g.position.set(x, y, z)
        g.rotation.y = rot
        addBox(g, 1.5, 0.3, 2.1, 0, 0.15, 0, mats.woodDark)
        addBox(g, 1.42, 0.22, 2.0, 0, 0.41, 0, mats.white)
        const blanket = addBox(g, 1.42, 0.12, 1.1, 0, 0.52, -0.45, mats.fabric(fabricData))
        addBox(g, 0.6, 0.14, 0.4, -0.34, 0.6, 0.7, mats.white)
        addBox(g, 0.6, 0.14, 0.4, 0.34, 0.6, 0.7, mats.white)
        registerInteractive(blanket, {
          initialState: { on: false },
          onHover: (it, hover) => {
            it.mesh.material.emissive.setHex(hover ? 0x221100 : 0x000000)
          },
          onClick: (it) => {
            it.state.on = !it.state.on
            it.mesh.position.z = it.state.on ? -0.7 : -0.45
            it.mesh.scale.y = it.state.on ? 0.3 : 1
          },
        })
        group.add(g)
      }

      // 沙发（可点击切换靠枕位置）
      const makeSofa = (group, x, y, z, rot = 0, fabricData = fabricBlue) => {
        const g = new THREE.Group()
        g.position.set(x, y, z)
        g.rotation.y = rot
        addBox(g, 1.9, 0.32, 0.9, 0, 0.2, 0, mats.fabric(fabricData))
        addBox(g, 1.9, 0.5, 0.2, 0, 0.58, -0.35, mats.fabric(fabricData))
        addBox(g, 0.2, 0.42, 0.9, -0.85, 0.48, 0, mats.fabric(fabricData))
        addBox(g, 0.2, 0.42, 0.9, 0.85, 0.48, 0, mats.fabric(fabricData))
        const cushion1 = addBox(g, 0.52, 0.32, 0.18, -0.42, 0.6, -0.22, mats.white)
        const cushion2 = addBox(g, 0.52, 0.32, 0.18, 0.42, 0.6, -0.22, mats.white)
        ;[cushion1, cushion2].forEach((c, i) => {
          registerInteractive(c, {
            initialState: { tilt: 0 },
            onHover: (it, hover) => it.mesh.material.emissive.setHex(hover ? 0x1a1a1a : 0x000000),
            onClick: (it) => {
              it.state.tilt = it.state.tilt === 0 ? (i === 0 ? 0.15 : -0.15) : 0
              it.mesh.rotation.z = it.state.tilt
            },
          })
        })
        group.add(g)
      }

      // 餐桌椅
      const makeDining = (group, x, y, z, rot = 0) => {
        const g = new THREE.Group()
        g.position.set(x, y, z)
        g.rotation.y = rot
        addBox(g, 1.3, 0.06, 0.85, 0, 0.74, 0, mats.wood)
        for (const [lx, lz] of [[-0.55, -0.34], [0.55, -0.34], [-0.55, 0.34], [0.55, 0.34]]) {
          addBox(g, 0.06, 0.72, 0.06, lx, 0.36, lz, mats.woodDark)
        }
        const chairMesh = []
        const makeChair = (cx, cz, ry) => {
          const cg = new THREE.Group()
          cg.position.set(cx, 0, cz); cg.rotation.y = ry
          const seat = addBox(cg, 0.42, 0.05, 0.42, 0, 0.44, 0, mats.wood)
          addBox(cg, 0.42, 0.42, 0.05, 0, 0.64, -0.19, mats.woodDark)
          for (const [llx, llz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) {
            addBox(cg, 0.04, 0.42, 0.04, llx, 0.21, llz, mats.woodDark)
          }
          chairMesh.push(seat)
          g.add(cg)
        }
        makeChair(-0.78, 0, Math.PI / 2)
        makeChair(0.78, 0, -Math.PI / 2)
        makeChair(0, -0.58, 0)
        makeChair(0, 0.58, Math.PI)
        chairMesh.forEach((m) => {
          registerInteractive(m, {
            onHover: (it, hover) => it.mesh.material.emissive.setHex(hover ? 0x1a0f00 : 0x000000),
            onClick: (it) => {
              it.state.rot = (it.state.rot || 0) + Math.PI / 4
              it.mesh.parent.rotation.y = it.state.rot
            },
          })
        })
        group.add(g)
      }

      // 厨房（橱柜门可开合）
      const makeKitchen = (group, x, y, z, rot = 0) => {
        const g = new THREE.Group()
        g.position.set(x, y, z)
        g.rotation.y = rot
        addBox(g, 2.6, 0.06, 0.68, 0, 0.9, 0, mats.white)
        addBox(g, 2.6, 0.86, 0.62, 0, 0.45, 0, mats.wood)
        const doorL = addBox(g, 1.2, 0.78, 0.04, -0.66, 0.47, 0.32, mats.woodDark)
        const doorR = addBox(g, 1.2, 0.78, 0.04, 0.66, 0.47, 0.32, mats.woodDark)
        ;[doorL, doorR].forEach((d, i) => {
          registerInteractive(d, {
            initialState: { open: false },
            onHover: (it, hover) => it.mesh.material.emissive.setHex(hover ? 0x110800 : 0x000000),
            onClick: (it) => {
              it.state.open = !it.state.open
              it.mesh.rotation.y = it.state.open ? (i === 0 ? 1.2 : -1.2) : 0
            },
          })
        })
        // 水槽
        addBox(g, 0.5, 0.04, 0.4, -0.7, 0.94, 0, mats.metal)
        addBox(g, 0.46, 0.14, 0.36, -0.7, 0.87, 0, mats.metal)
        addCyl(g, 0.02, 0.02, 0.28, -0.7, 1.08, 0.1, mats.metal, 8)
        // 灶台
        addBox(g, 0.65, 0.04, 0.42, 0.7, 0.94, 0, mats.metal)
        group.add(g)
      }

      // 冰箱（门可开）
      const makeFridge = (group, x, y, z) => {
        const g = new THREE.Group()
        g.position.set(x, y, z)
        addBox(g, 0.72, 1.75, 0.72, 0, 0.88, 0, mats.white)
        const door = addBox(g, 0.04, 1.7, 0.68, 0.34, 0.88, 0, mats.white)
        registerInteractive(door, {
          initialState: { open: false },
          onHover: (it, hover) => it.mesh.material.emissive.setHex(hover ? 0x222222 : 0x000000),
          onClick: (it) => {
            it.state.open = !it.state.open
            it.mesh.rotation.y = it.state.open ? -1.4 : 0
            it.mesh.position.x = it.state.open ? 0.02 : 0.34
          },
        })
        group.add(g)
      }

      // 盆栽
      const makePlant = (group, x, y, z, scale = 1) => {
        const g = new THREE.Group()
        g.position.set(x, y, z); g.scale.setScalar(scale)
        addCyl(g, 0.15, 0.12, 0.32, 0, 0.16, 0, mats.plantPot)
        const leaves = addBox(g, 0.55, 0.65, 0.55, 0, 0.64, 0, mats.plant)
        registerInteractive(leaves, {
          initialState: { sway: 0 },
          onHover: (it, hover) => it.mesh.material.emissive.setHex(hover ? 0x0a1a05 : 0x000000),
          onClick: (it) => {
            it.state.sway = it.state.sway === 0 ? 0.12 : 0
            it.mesh.rotation.z = it.state.sway
          },
        })
        group.add(g)
      }

      // 落地灯（可开关）
      const makeFloorLamp = (group, x, y, z) => {
        const g = new THREE.Group()
        g.position.set(x, y, z)
        addCyl(g, 0.02, 0.02, 1.55, 0, 0.78, 0, mats.metal, 8)
        addCyl(g, 0.18, 0.22, 0.32, 0, 1.7, 0, mats.white, 16)
        const bulb = new THREE.PointLight(0xffd9a8, 0, 5, 2)
        bulb.position.set(0, 1.65, 0)
        g.add(bulb)
        const shade = g.children.find((c) => c.geometry?.type === 'CylinderGeometry' && c.position.y > 1)
        registerInteractive(shade, {
          initialState: { on: false },
          onHover: (it, hover) => {
            if (!it.state.on) it.mesh.material.emissive.setHex(hover ? 0x332200 : 0x000000)
          },
          onClick: (it) => {
            it.state.on = !it.state.on
            bulb.intensity = it.state.on ? 1.2 : 0
            it.mesh.material.emissive.setHex(it.state.on ? 0x664400 : 0x000000)
          },
        })
        group.add(g)
      }

      // 卫生间
      const makeBathroom = (group, x, y, z, rot = 0) => {
        const g = new THREE.Group()
        g.position.set(x, y, z); g.rotation.y = rot
        addBox(g, 0.85, 0.55, 1.7, 0, 0.28, 0, mats.ceramic)
        addBox(g, 0.74, 0.16, 1.6, 0, 0.5, 0, mats.white)
        const toilet = addBox(g, 0.42, 0.42, 0.55, 0.85, 0.21, 0, mats.ceramic)
        registerInteractive(toilet, {
          onHover: (it, hover) => it.mesh.material.emissive.setHex(hover ? 0x222222 : 0x000000),
          onClick: (it) => { it.mesh.position.y = it.state.up ? 0.21 : 0.3; it.state.up = !it.state.up },
        })
        addBox(g, 0.65, 0.85, 0.48, -0.85, 0.43, 0.3, mats.white)
        addBox(g, 0.55, 0.05, 0.4, -0.85, 0.88, 0.3, mats.metal)
        group.add(g)
      }

      // 书桌（抽屉可拉）
      const makeDesk = (group, x, y, z, rot = 0) => {
        const g = new THREE.Group()
        g.position.set(x, y, z); g.rotation.y = rot
        addBox(g, 1.1, 0.06, 0.6, 0, 0.76, 0, mats.wood)
        addBox(g, 0.05, 0.72, 0.55, -0.52, 0.38, 0, mats.woodDark)
        addBox(g, 0.05, 0.72, 0.55, 0.52, 0.38, 0, mats.woodDark)
        const drawer = addBox(g, 0.9, 0.18, 0.04, 0, 0.5, 0.3, mats.woodDark)
        registerInteractive(drawer, {
          initialState: { open: false },
          onHover: (it, hover) => it.mesh.material.emissive.setHex(hover ? 0x110800 : 0x000000),
          onClick: (it) => {
            it.state.open = !it.state.open
            it.mesh.position.z = it.state.open ? 0.5 : 0.3
          },
        })
        group.add(g)
      }

      // ---- 四种户型（面积递增）----
      // 豪华(5室3厅): 7.5 x 6
      const buildLuxury = () => {
        const group = new THREE.Group()
        addBox(group, 7.5, 0.08, 6, 0, 0.04, 0, mats.floor(0))
        addBox(group, 0.12, 2.8, 6, -3.75, 1.4, 0, mats.wall)
        addBox(group, 0.12, 2.8, 6, 3.75, 1.4, 0, mats.wallDark)
        addBox(group, 7.5, 2.8, 0.12, 0, 1.4, -3, mats.wall)
        // 隔墙
        addBox(group, 0.08, 2.8, 2.2, -1.2, 1.4, 1.9, mats.wall)
        addBox(group, 0.08, 2.8, 2.0, 1.5, 1.4, -1.0, mats.wall)
        addBox(group, 0.08, 2.8, 1.8, 2.8, 1.4, 1.5, mats.wall)
        // 主卧
        makeBed(group, -2.4, 0, 1.0, 0, fabricWarm)
        // 次卧1
        makeBed(group, -2.4, 0, -1.6, 0, fabricBlue)
        // 次卧2
        makeBed(group, 0.4, 0, -1.8, 0, fabricGreen)
        // 次卧3
        makeBed(group, 0.4, 0, 0.5, 0, fabricGray)
        // 次卧4
        makeBed(group, -2.4, 0, -2.5, Math.PI / 2, fabricBlue)
        // 客厅
        makeSofa(group, 0.5, 0, 0.8, 0, fabricWarm)
        makeDining(group, 2.0, 0, 1.8, 0)
        // 厨房
        makeKitchen(group, 3.2, 0, 0.5, Math.PI / 2)
        makeFridge(group, 3.3, 0, -2.0)
        // 卫生间
        makeBathroom(group, 3.2, 0, 2.5, Math.PI / 2)
        // 植物
        makePlant(group, -3.4, 0, 2.2, 0.9)
        makePlant(group, 3.4, 0, -2.5, 0.7)
        makeFloorLamp(group, 1.5, 0, -0.3)
        return group
      }

      // 普通(3室2厅): 5.5 x 4.5
      const buildStandard = () => {
        const group = new THREE.Group()
        addBox(group, 5.5, 0.08, 4.5, 0, 0.04, 0, mats.floor(1))
        addBox(group, 0.12, 2.8, 4.5, -2.75, 1.4, 0, mats.wall)
        addBox(group, 0.12, 2.8, 4.5, 2.75, 1.4, 0, mats.wall)
        addBox(group, 5.5, 2.8, 0.12, 0, 1.4, -2.25, mats.wall)
        addBox(group, 0.08, 2.8, 2.2, 0, 1.4, 1.1, mats.wall)
        addBox(group, 0.08, 2.8, 1.8, -1.5, 1.4, -0.5, mats.wall)
        // 主卧
        makeBed(group, -1.4, 0, 1.0, 0, fabricBlue)
        // 次卧
        makeBed(group, -1.4, 0, -1.3, 0, fabricWarm)
        // 儿童房
        makeBed(group, 1.0, 0, -1.5, 0, fabricGreen)
        // 客厅
        makeSofa(group, 1.2, 0, 0.3, 0, fabricGray)
        makeDining(group, 1.3, 0, 1.8, 0)
        makeKitchen(group, 2.2, 0, -1.5, Math.PI / 2)
        makePlant(group, -2.5, 0, -1.8, 0.7)
        makeFloorLamp(group, 0.3, 0, 2.0)
        return group
      }

      // 城市(2房1厅): 4.5 x 3.8
      const buildCity = () => {
        const group = new THREE.Group()
        addBox(group, 4.5, 0.08, 3.8, 0, 0.04, 0, mats.floor(3))
        addBox(group, 0.12, 2.8, 3.8, -2.25, 1.4, 0, mats.wallDark)
        addBox(group, 0.12, 2.8, 3.8, 2.25, 1.4, 0, mats.wall)
        addBox(group, 4.5, 2.8, 0.12, 0, 1.4, -1.9, mats.wall)
        addBox(group, 0.08, 2.8, 1.8, -0.5, 1.4, 1.0, mats.wall)
        // 主卧
        makeBed(group, -1.2, 0, 0.3, 0, fabricWarm)
        // 次卧
        makeBed(group, -1.2, 0, -1.3, 0, fabricBlue)
        // 客餐厅
        makeSofa(group, 1.0, 0, -0.5, 0, fabricGreen)
        addBox(group, 0.85, 0.06, 0.85, 1.0, 0.62, 1.0, mats.wood)
        for (const [lx, lz] of [[-0.34, -0.34], [0.34, -0.34], [-0.34, 0.34], [0.34, 0.34]]) {
          addBox(group, 0.05, 0.6, 0.05, lx, 0.3, lz, mats.woodDark)
        }
        makeKitchen(group, 1.9, 0, -1.2, Math.PI / 2)
        makeFridge(group, 1.9, 0, 0.8)
        makePlant(group, -2.0, 0, -1.5, 0.8)
        makeFloorLamp(group, 0.2, 0, -1.6)
        return group
      }

      // 学生(1房1厅): 3.5 x 3
      const buildStudent = () => {
        const group = new THREE.Group()
        addBox(group, 3.5, 0.08, 3, 0, 0.04, 0, mats.floor(2))
        addBox(group, 0.12, 2.8, 3, -1.75, 1.4, 0, mats.wall)
        addBox(group, 0.12, 2.8, 3, 1.75, 1.4, 0, mats.wallDark)
        addBox(group, 3.5, 2.8, 0.12, 0, 1.4, -1.5, mats.wall)
        // 卧室区
        makeBed(group, -0.9, 0, 0.3, 0, fabricGray)
        // 书桌
        makeDesk(group, 0.9, 0, -1.0, 0)
        // 椅子
        addBox(group, 0.4, 0.05, 0.4, 0.9, 0.42, -0.5, mats.fabric(fabricBlue))
        for (const [lx, lz] of [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]]) {
          addBox(group, 0.04, 0.4, 0.04, lx, 0.2, lz, mats.woodDark)
        }
        // 小厨房
        makeKitchen(group, 1.3, 0, 1.0, Math.PI)
        makePlant(group, 1.5, 0, 0.2, 0.6)
        makeFloorLamp(group, -0.5, 0, 1.2)
        return group
      }

      const builders = [buildLuxury, buildStandard, buildStudent, buildCity]

      // 清理交互列表辅助
      const clearInteractives = () => { interactives.length = 0 }

      const world = new THREE.Group()
      scene.add(world)
      let currentIdx = 0
      let model = builders[0]()
      world.add(model)

      let morph = null
      const startMorph = (idx) => {
        if (idx === currentIdx) return
        if (morph) { morph.queued = idx; return }
        morph = { t: 0, to: idx, queued: null }
      }

      // 轨道控制
      const R = 9.5
      let az = VIEW_ANGLES[0]
      let polar = 1.15
      let target = az
      let dragging = false
      let dragMoved = false
      let lastX = 0
      let lastY = 0
      let hovered = activeRef.current
      let visible = true
      let hoveredItem = null

      const snapFor = (idx) => {
        const base = VIEW_ANGLES[idx]
        return base + Math.round((az - base) / (Math.PI * 2)) * Math.PI * 2
      }
      const gotoType = (idx) => {
        if (idx == null || dragging) return
        target = snapFor(idx)
        if (reduce) {
          world.remove(model)
          clearInteractives()
          currentIdx = idx
          model = builders[idx]()
          world.add(model)
          az = target
        } else {
          startMorph(idx)
        }
      }

      const dom = renderer.domElement
      const onDown = (e) => {
        dragging = true
        dragMoved = false
        lastX = e.clientX
        lastY = e.clientY
        dom.style.cursor = 'grabbing'
        dom.setPointerCapture?.(e.pointerId)
      }
      const onMove = (e) => {
        if (dragging) {
          if (Math.abs(e.clientX - lastX) > 3 || Math.abs(e.clientY - lastY) > 3) dragMoved = true
          az -= (e.clientX - lastX) * 0.006
          polar = Math.min(1.35, Math.max(0.55, polar + (e.clientY - lastY) * 0.004))
          target = az
          lastX = e.clientX
          lastY = e.clientY
          return
        }
        // hover 检测
        const rect = dom.getBoundingClientRect()
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        const meshes = interactives.map((i) => i.mesh)
        const hits = raycaster.intersectObjects(meshes, false)
        if (hoveredItem && (!hits.length || hits[0].object !== hoveredItem.mesh)) {
          hoveredItem.hovered = false
          hoveredItem.onHover?.(hoveredItem, false)
          hoveredItem = null
        }
        if (hits.length) {
          const item = interactives.find((i) => i.mesh === hits[0].object)
          if (item && item !== hoveredItem) {
            hoveredItem = item
            item.hovered = true
            item.onHover?.(item, true)
            dom.style.cursor = 'pointer'
          }
        } else if (!hoveredItem) {
          dom.style.cursor = 'grab'
        }
      }
      const onUp = (e) => {
        if (dragging && !dragMoved) {
          // 点击：检测交互
          const rect = dom.getBoundingClientRect()
          pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
          pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
          raycaster.setFromCamera(pointer, camera)
          const meshes = interactives.map((i) => i.mesh)
          const hits = raycaster.intersectObjects(meshes, false)
          if (hits.length) {
            const item = interactives.find((i) => i.mesh === hits[0].object)
            item?.onClick?.(item)
          }
        }
        dragging = false
        dom.style.cursor = hoveredItem ? 'pointer' : 'grab'
        target = az
      }
      dom.addEventListener('pointerdown', onDown)
      dom.addEventListener('pointermove', onMove)
      dom.addEventListener('pointerup', onUp)
      dom.addEventListener('pointercancel', onUp)
      const onLost = (e) => { e.preventDefault(); visible = false; cancelAnimationFrame(raf) }
      dom.addEventListener('webglcontextlost', onLost)

      const ro = new ResizeObserver(() => {
        const nw = mount.clientWidth
        const nh = mount.clientHeight
        if (!nw || !nh) return
        renderer.setSize(nw, nh)
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
      })
      ro.observe(mount)
      const onVis = () => {
        if (document.hidden) {
          visible = false
          cancelAnimationFrame(raf)
        } else if (!disposed) {
          visible = true
          last = performance.now()
          raf = requestAnimationFrame(frame)
        }
      }
      document.addEventListener('visibilitychange', onVis)
      const vio = new IntersectionObserver((es) => { visible = es[0].isIntersecting }, { threshold: 0 })
      vio.observe(mount)

      let last = performance.now()
      const frame = (now) => {
        if (disposed) return
        raf = requestAnimationFrame(frame)
        if (!visible) { last = now; return }
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now

        const cur = activeRef.current
        if (cur !== hovered) {
          hovered = cur
          gotoType(cur)
        }

        if (morph) {
          morph.t += dt * 1000
          const half = SWITCH_MS / 2
          const k = Math.min(1, morph.t / half)
          if (k < 1) {
            world.scale.setScalar(1 - k * 0.3)
            world.rotation.y = k * 0.3
            world.position.y = -k * 0.25
          } else {
            world.remove(model)
            clearInteractives()
            currentIdx = morph.to
            model = builders[currentIdx]()
            world.add(model)
            const k2 = Math.min(1, (morph.t - half) / half)
            world.scale.setScalar(0.7 + k2 * 0.3)
            world.rotation.y = (1 - k2) * 0.3
            world.position.y = -(1 - k2) * 0.25
            if (k2 >= 1) {
              world.scale.setScalar(1)
              world.rotation.y = 0
              world.position.y = 0
              const next = morph.queued
              morph = null
              if (next != null && next !== currentIdx) startMorph(next)
            }
          }
        }

        if (!dragging) {
          if (hovered == null && !morph && !reduce) target += dt * 0.15
          az += (target - az) * (1 - Math.exp(-dt * 4.5))
        }
        camera.position.set(
          R * Math.sin(polar) * Math.sin(az),
          R * Math.cos(polar),
          R * Math.sin(polar) * Math.cos(az)
        )
        camera.lookAt(0, 0.6, 0)
        renderer.render(scene, camera)
      }
      raf = requestAnimationFrame(frame)

      teardown = () => {
        cancelAnimationFrame(raf)
        ro.disconnect(); vio.disconnect()
        document.removeEventListener('visibilitychange', onVis)
        dom.removeEventListener('pointerdown', onDown)
        dom.removeEventListener('pointermove', onMove)
        dom.removeEventListener('pointerup', onUp)
        dom.removeEventListener('pointercancel', onUp)
        dom.removeEventListener('webglcontextlost', onLost)
        const geos = new Set(boxCache.values())
        cylCache.forEach((g) => geos.add(g))
        geos.forEach((g) => g.dispose())
        Object.values(mats).forEach((m) => {
          if (typeof m === 'function') return
          m.dispose?.()
        })
        textures.forEach((t) => t.dispose())
        envRT.dispose()
        renderer.dispose()
        if (dom.parentNode === mount) mount.removeChild(dom)
      }
    }

    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) { boot(); io.disconnect() }
      }, { rootMargin: '300px 0px' })
      io.observe(mount)
    } else { boot() }

    return () => { disposed = true; io?.disconnect(); teardown() }
  }, [])

  return (
    <div className="v8-type-house" ref={mountRef}>
      {failed && <div style={{ color: '#666', textAlign: 'center', padding: 40 }}>3D 不可用</div>}
    </div>
  )
}
