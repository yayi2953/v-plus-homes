import { useEffect, useRef, useState } from 'react'

// 户型索引舞台的 3D 室内剖面沙盘：切去屋顶与前墙，露出室内布局、家具与木纹地板。
// 四种户型各自有不同的平面布局；模拟从左上方射入的暖阳光，环境暗化形成聚光沙盘观感。
// 悬停/聚焦户型行时切换模型；可拖拽环视。进视口才动态加载 three。

const VIEW_ANGLES = [-0.5, -0.3, 0.1, 0.35]
const SWITCH_MS = 420

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
      try {
        THREE = await import('three')
      } catch {
        if (!disposed) setFailed(true)
        return
      }
      if (disposed) return
      if (!window.WebGLRenderingContext) { setFailed(true); return }

      const w = Math.max(1, mount.clientWidth)
      const h = Math.max(1, mount.clientHeight)

      let renderer
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
      } catch {
        setFailed(true)
        return
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(w, h)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab'
      mount.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x0a0a0c)
      const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100)

      // ---- 光照：暖阳光主光 + 冷弱补光 ----
      scene.add(new THREE.HemisphereLight(0x3a3d48, 0x141416, 0.35))
      const sun = new THREE.DirectionalLight(0xffd9a8, 2.4)
      sun.position.set(-6, 8, 4)
      sun.castShadow = true
      sun.shadow.mapSize.set(2048, 2048)
      sun.shadow.camera.left = -6
      sun.shadow.camera.right = 6
      sun.shadow.camera.top = 6
      sun.shadow.camera.bottom = -6
      sun.shadow.camera.near = 1
      sun.shadow.camera.far = 30
      sun.shadow.bias = -0.0003
      sun.shadow.radius = 4
      scene.add(sun)
      // 室内补光（模拟漫反射）
      const bounce = new THREE.DirectionalLight(0x8a92b0, 0.4)
      bounce.position.set(4, 3, -5)
      scene.add(bounce)
      // 顶部弱面光，提亮天花板反射
      const top = new THREE.PointLight(0xfff0d4, 0.5, 12, 1.5)
      top.position.set(0, 3.2, 0)
      scene.add(top)

      // ---- 程序化纹理 ----
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

      // 木地板纹理：竖向木板 + 木纹 + 节疤
      const makeWoodFloor = (seed, baseHue) => {
        const size = 512
        const c = document.createElement('canvas')
        c.width = c.height = size
        const ctx = c.getContext('2d')
        const rnd = rnd32(seed)
        // 底色
        ctx.fillStyle = baseHue
        ctx.fillRect(0, 0, size, size)
        // 木板分割线
        const plankH = size / 8
        for (let i = 0; i < 8; i++) {
          const y = i * plankH
          // 每块木板颜色微变
          const shade = 0.85 + rnd() * 0.3
          const r = parseInt(baseHue.slice(1, 3), 16) * shade
          const g = parseInt(baseHue.slice(3, 5), 16) * shade
          const b = parseInt(baseHue.slice(5, 7), 16) * shade
          ctx.fillStyle = `rgb(${r|0},${g|0},${b|0})`
          ctx.fillRect(0, y, size, plankH)
          // 木纹（横向细线）
          for (let k = 0; k < 30; k++) {
            const yy = y + rnd() * plankH
            ctx.strokeStyle = `rgba(0,0,0,${0.02 + rnd() * 0.06})`
            ctx.lineWidth = 0.5 + rnd()
            ctx.beginPath()
            ctx.moveTo(0, yy)
            ctx.bezierCurveTo(size * 0.3, yy + (rnd() - 0.5) * 4, size * 0.7, yy + (rnd() - 0.5) * 4, size, yy)
            ctx.stroke()
          }
          // 节疤
          if (rnd() > 0.4) {
            const kx = rnd() * size
            const ky = y + plankH * (0.2 + rnd() * 0.6)
            const kr = 3 + rnd() * 8
            const kg = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr)
            kg.addColorStop(0, `rgba(60,30,10,${0.3 + rnd() * 0.3})`)
            kg.addColorStop(1, 'rgba(60,30,10,0)')
            ctx.fillStyle = kg
            ctx.beginPath(); ctx.arc(kx, ky, kr, 0, Math.PI * 2); ctx.fill()
          }
        }
        // 板缝
        for (let i = 1; i < 8; i++) {
          ctx.fillStyle = 'rgba(0,0,0,0.18)'
          ctx.fillRect(0, i * plankH - 1, size, 2)
        }
        // 纵向错缝
        for (let i = 0; i < 8; i++) {
          if (rnd() > 0.3) {
            const x = size * (0.2 + rnd() * 0.6)
            ctx.fillStyle = 'rgba(0,0,0,0.12)'
            ctx.fillRect(x - 0.5, i * plankH, 1, plankH)
          }
        }
        noisy(ctx, size, 6, rnd)
        return toTex(c, true)
      }
      const floorLuxury = makeWoodFloor(11, '#9a6b3e')
      const floorStandard = makeWoodFloor(22, '#b07d4e')
      const floorStudent = makeWoodFloor(33, '#8a7355')
      const floorCity = makeWoodFloor(44, '#c4a06a')
      const floors = [floorLuxury, floorStandard, floorStudent, floorCity]

      // 墙面材质
      const wallTex = (() => {
        const size = 256
        const c = document.createElement('canvas')
        c.width = c.height = size
        const ctx = c.getContext('2d')
        ctx.fillStyle = '#e8e4dc'
        ctx.fillRect(0, 0, size, size)
        noisy(ctx, size, 8, rnd32(77))
        return toTex(c, true)
      })()
      const darkWallTex = (() => {
        const size = 256
        const c = document.createElement('canvas')
        c.width = c.height = size
        const ctx = c.getContext('2d')
        ctx.fillStyle = '#3a3530'
        ctx.fillRect(0, 0, size, size)
        noisy(ctx, size, 6, rnd32(88))
        return toTex(c, true)
      })()

      const mats = {
        floor: (i) => new THREE.MeshStandardMaterial({ map: floors[i], roughness: 0.75, metalness: 0.02, envMapIntensity: 0.3 }),
        wall: new THREE.MeshStandardMaterial({ map: wallTex, color: 0xefeae0, roughness: 0.9, metalness: 0, envMapIntensity: 0.2 }),
        wallDark: new THREE.MeshStandardMaterial({ map: darkWallTex, color: 0x4a4238, roughness: 0.85, metalness: 0.02, envMapIntensity: 0.2 }),
        ceiling: new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.95, metalness: 0 }),
        wood: new THREE.MeshStandardMaterial({ color: 0x7a5a32, roughness: 0.55, metalness: 0.05, envMapIntensity: 0.4 }),
        woodDark: new THREE.MeshStandardMaterial({ color: 0x5a3e22, roughness: 0.6, metalness: 0.05, envMapIntensity: 0.4 }),
        fabric: new THREE.MeshStandardMaterial({ color: 0x6b7a8f, roughness: 0.9, metalness: 0, envMapIntensity: 0.15 }),
        fabricWarm: new THREE.MeshStandardMaterial({ color: 0xb8825a, roughness: 0.9, metalness: 0, envMapIntensity: 0.15 }),
        white: new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.8, metalness: 0 }),
        metal: new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.3, metalness: 0.85, envMapIntensity: 1 }),
        glass: new THREE.MeshPhysicalMaterial({ color: 0xc8d8e8, roughness: 0.08, metalness: 0, transmission: 0.6, thickness: 0.2, envMapIntensity: 0.8 }),
        bed: new THREE.MeshStandardMaterial({ color: 0xe8ddd0, roughness: 0.85, metalness: 0 }),
        pillow: new THREE.MeshStandardMaterial({ color: 0xfaf7f2, roughness: 0.85, metalness: 0 }),
        plant: new THREE.MeshStandardMaterial({ color: 0x4a6741, roughness: 1, metalness: 0 }),
        plantPot: new THREE.MeshStandardMaterial({ color: 0xc4a882, roughness: 0.7, metalness: 0.05 }),
      }

      // ---- 家具构建辅助 ----
      const boxCache = new Map()
      const boxGeo = (w2, h2, d2) => {
        const key = `${w2}x${h2}x${d2}`
        let g = boxCache.get(key)
        if (!g) { g = new THREE.BoxGeometry(w2, h2, d2); boxCache.set(key, g) }
        return g
      }
      const cylCache = new Map()
      const cylGeo = (rTop, rBot, h, seg = 16) => {
        const key = `${rTop}x${rBot}x${h}x${seg}`
        let g = cylCache.get(key)
        if (!g) { g = new THREE.CylinderGeometry(rTop, rBot, h, seg); cylCache.set(key, g) }
        return g
      }
      const sphCache = new Map()
      const sphGeo = (r, seg = 16) => {
        let g = sphCache.get(r)
        if (!g) { g = new THREE.SphereGeometry(r, seg, seg); sphCache.set(r, g) }
        return g
      }

      const addBox = (group, w2, h2, d2, x, y, z, mat, rx = 0, ry = 0, rz = 0) => {
        const m = new THREE.Mesh(boxGeo(w2, h2, d2), mat)
        m.position.set(x, y, z)
        m.rotation.set(rx, ry, rz)
        m.castShadow = true
        m.receiveShadow = true
        group.add(m)
        return m
      }
      const addCyl = (group, rT, rB, h, x, y, z, mat, seg = 16) => {
        const m = new THREE.Mesh(cylGeo(rT, rB, h, seg), mat)
        m.position.set(x, y, z)
        m.castShadow = true
        m.receiveShadow = true
        group.add(m)
        return m
      }

      // 床
      const makeBed = (group, x, y, z, rot = 0, fabric = mats.fabric) => {
        const g = new THREE.Group()
        g.position.set(x, y, z)
        g.rotation.y = rot
        // 床架
        addBox(g, 1.4, 0.3, 2.0, 0, 0.15, 0, mats.woodDark)
        // 床垫
        addBox(g, 1.32, 0.22, 1.92, 0, 0.41, 0, mats.bed)
        // 被子（半搭）
        addBox(g, 1.32, 0.1, 1.0, 0, 0.52, -0.45, fabric)
        // 枕头
        addBox(g, 0.55, 0.12, 0.38, -0.32, 0.58, 0.7, mats.pillow)
        addBox(g, 0.55, 0.12, 0.38, 0.32, 0.58, 0.7, mats.pillow)
        group.add(g)
      }

      // 沙发
      const makeSofa = (group, x, y, z, rot = 0, fabric = mats.fabric) => {
        const g = new THREE.Group()
        g.position.set(x, y, z)
        g.rotation.y = rot
        // 底座
        addBox(g, 1.8, 0.3, 0.85, 0, 0.2, 0, fabric)
        // 靠背
        addBox(g, 1.8, 0.45, 0.18, 0, 0.55, -0.34, fabric)
        // 扶手
        addBox(g, 0.18, 0.4, 0.85, -0.81, 0.45, 0, fabric)
        addBox(g, 0.18, 0.4, 0.85, 0.81, 0.45, 0, fabric)
        // 靠垫
        addBox(g, 0.5, 0.3, 0.16, -0.4, 0.58, -0.2, mats.white)
        addBox(g, 0.5, 0.3, 0.16, 0.4, 0.58, -0.2, mats.white)
        group.add(g)
      }

      // 餐桌 + 椅
      const makeDining = (group, x, y, z, rot = 0) => {
        const g = new THREE.Group()
        g.position.set(x, y, z)
        g.rotation.y = rot
        // 桌面
        addBox(g, 1.2, 0.06, 0.8, 0, 0.72, 0, mats.wood)
        // 桌腿
        for (const [lx, lz] of [[-0.5, -0.32], [0.5, -0.32], [-0.5, 0.32], [0.5, 0.32]]) {
          addBox(g, 0.06, 0.7, 0.06, lx, 0.35, lz, mats.woodDark)
        }
        // 椅子 x4
        const makeChair = (cx, cz, ry) => {
          const cg = new THREE.Group()
          cg.position.set(cx, 0, cz)
          cg.rotation.y = ry
          addBox(cg, 0.4, 0.05, 0.4, 0, 0.42, 0, mats.wood)
          addBox(cg, 0.4, 0.4, 0.05, 0, 0.62, -0.18, mats.woodDark)
          for (const [llx, llz] of [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]]) {
            addBox(cg, 0.04, 0.4, 0.04, llx, 0.2, llz, mats.woodDark)
          }
          g.add(cg)
        }
        makeChair(-0.7, 0, Math.PI / 2)
        makeChair(0.7, 0, -Math.PI / 2)
        makeChair(0, -0.55, 0)
        makeChair(0, 0.55, Math.PI)
        group.add(g)
      }

      // 厨房台面 + 橱柜
      const makeKitchen = (group, x, y, z, rot = 0) => {
        const g = new THREE.Group()
        g.position.set(x, y, z)
        g.rotation.y = rot
        // 台面
        addBox(g, 2.4, 0.06, 0.65, 0, 0.88, 0, mats.white)
        // 柜体
        addBox(g, 2.4, 0.85, 0.6, 0, 0.43, 0, mats.wood)
        // 柜门线
        addBox(g, 0.02, 0.75, 0.58, -0.6, 0.45, 0.02, mats.woodDark)
        addBox(g, 0.02, 0.75, 0.58, 0.6, 0.45, 0.02, mats.woodDark)
        // 水槽
        addBox(g, 0.5, 0.04, 0.38, -0.5, 0.92, 0, mats.metal)
        addBox(g, 0.46, 0.12, 0.34, -0.5, 0.86, 0, mats.metal)
        // 水龙头
        addCyl(g, 0.02, 0.02, 0.25, -0.5, 1.05, 0.1, mats.metal, 8)
        // 灶台
        addBox(g, 0.6, 0.04, 0.4, 0.6, 0.92, 0, mats.metal)
        group.add(g)
      }

      // 冰箱
      const makeFridge = (group, x, y, z) => {
        const g = new THREE.Group()
        g.position.set(x, y, z)
        addBox(g, 0.7, 1.7, 0.7, 0, 0.85, 0, mats.white)
        addBox(g, 0.66, 0.02, 0.68, 0, 1.1, 0.36, mats.metal)
        addBox(g, 0.06, 0.2, 0.04, 0.25, 1.3, 0.36, mats.metal)
        group.add(g)
      }

      // 盆栽
      const makePlant = (group, x, y, z, scale = 1) => {
        const g = new THREE.Group()
        g.position.set(x, y, z)
        g.scale.setScalar(scale)
        addCyl(g, 0.14, 0.11, 0.3, 0, 0.15, 0, mats.plantPot)
        addBox(g, 0.5, 0.6, 0.5, 0, 0.6, 0, mats.plant)
        addBox(g, 0.35, 0.4, 0.35, 0.1, 0.9, 0.1, mats.plant)
        addBox(g, 0.3, 0.35, 0.3, -0.12, 0.85, -0.08, mats.plant)
        group.add(g)
      }

      // 灯具（落地灯）
      const makeFloorLamp = (group, x, y, z) => {
        const g = new THREE.Group()
        g.position.set(x, y, z)
        addCyl(g, 0.02, 0.02, 1.5, 0, 0.75, 0, mats.metal, 8)
        addCyl(g, 0.2, 0.12, 0.3, 0, 1.65, 0, mats.white, 16)
        const bulb = new THREE.PointLight(0xffd9a8, 0.8, 4, 2)
        bulb.position.set(0, 1.6, 0)
        g.add(bulb)
        group.add(g)
      }

      // 卫生间
      const makeBathroom = (group, x, y, z, rot = 0) => {
        const g = new THREE.Group()
        g.position.set(x, y, z)
        g.rotation.y = rot
        // 浴缸
        addBox(g, 0.8, 0.5, 1.6, 0, 0.25, 0, mats.white)
        addBox(g, 0.7, 0.15, 1.5, 0, 0.45, 0, mats.metal)
        // 马桶
        addBox(g, 0.4, 0.4, 0.5, 0.8, 0.2, 0, mats.white)
        addBox(g, 0.38, 0.15, 0.48, 0.8, 0.48, 0, mats.white)
        // 洗手台
        addBox(g, 0.6, 0.8, 0.45, -0.8, 0.4, 0.3, mats.white)
        addBox(g, 0.5, 0.05, 0.38, -0.8, 0.83, 0.3, mats.metal)
        group.add(g)
      }

      // ---- 四种户型的室内剖面布局 ----
      // 坐标约定：地面 y=0，前墙 z 正方向为观察者方向（切掉前墙和屋顶）

      const buildLuxury = () => {
        const group = new THREE.Group()
        // 地板
        addBox(group, 5, 0.08, 4, 0, 0.04, 0, mats.floor(0))
        // 三面墙（左、右、后），前墙和天花板切掉
        addBox(group, 0.12, 2.6, 4, -2.5, 1.3, 0, mats.wall)       // 左墙
        addBox(group, 0.12, 2.6, 4, 2.5, 1.3, 0, mats.wallDark)   // 右墙（深色背景墙）
        addBox(group, 5, 2.6, 0.12, 0, 1.3, -2, mats.wall)        // 后墙
        // 分区隔墙
        addBox(group, 0.08, 2.6, 1.6, -0.8, 1.3, 1.2, mats.wall)   // 卧/客隔墙
        addBox(group, 0.08, 2.6, 1.2, 1.2, 1.3, -0.6, mats.wall)   // 厨/卫隔墙
        // 卧室区
        makeBed(group, -1.6, 0, 0.5, 0, mats.fabricWarm)
        makePlant(group, -2.2, 0, 1.5, 0.8)
        // 客厅区
        makeSofa(group, 0.3, 0, -0.8, 0, mats.fabric)
        makeDining(group, 0.3, 0, 0.6, 0)
        makeFloorLamp(group, 1.8, 0, -1.2)
        // 厨房
        makeKitchen(group, 1.8, 0, 0.5, Math.PI / 2)
        makeFridge(group, 2.0, 0, -1.3)
        // 卫生间
        makeBathroom(group, 1.8, 0, 1.5, Math.PI / 2)
        return group
      }

      const buildStandard = () => {
        const group = new THREE.Group()
        addBox(group, 5, 0.08, 4, 0, 0.04, 0, mats.floor(1))
        addBox(group, 0.12, 2.6, 4, -2.5, 1.3, 0, mats.wall)
        addBox(group, 0.12, 2.6, 4, 2.5, 1.3, 0, mats.wall)
        addBox(group, 5, 2.6, 0.12, 0, 1.3, -2, mats.wall)
        // 隔墙
        addBox(group, 0.08, 2.6, 2.0, 0, 1.3, 1, mats.wall)
        // 主卧
        makeBed(group, -1.3, 0, 0.5, 0, mats.fabric)
        // 次卧/儿童房
        makeBed(group, -1.3, 0, -1.2, 0, mats.fabricWarm)
        // 客厅餐厅
        makeSofa(group, 1.2, 0, -0.5, 0, mats.fabric)
        makeDining(group, 1.2, 0, 1.0, 0)
        makeKitchen(group, 2.0, 0, -1.2, Math.PI / 2)
        makePlant(group, -2.2, 0, -1.5, 0.7)
        makeFloorLamp(group, 0.2, 0, 1.6)
        return group
      }

      const buildStudent = () => {
        const group = new THREE.Group()
        addBox(group, 4, 0.08, 3.5, 0, 0.04, 0, mats.floor(2))
        addBox(group, 0.12, 2.6, 3.5, -2, 1.3, 0, mats.wall)
        addBox(group, 0.12, 2.6, 3.5, 2, 1.3, 0, mats.wallDark)
        addBox(group, 4, 2.6, 0.12, 0, 1.3, -1.75, mats.wall)
        // 单人床
        makeBed(group, -1.0, 0, 0.3, 0, mats.fabric)
        // 书桌
        addBox(group, 1.0, 0.06, 0.55, 1.0, 0.75, -1.0, mats.wood)
        addBox(group, 0.05, 0.7, 0.5, 0.52, 0.38, -1.0, mats.woodDark)
        addBox(group, 0.05, 0.7, 0.5, 1.48, 0.38, -1.0, mats.woodDark)
        // 书桌椅
        addBox(group, 0.4, 0.05, 0.4, 1.0, 0.42, -0.5, mats.fabricWarm)
        addBox(group, 0.04, 0.4, 0.04, 0.82, 0.2, -0.32, mats.woodDark)
        addBox(group, 0.04, 0.4, 0.04, 1.18, 0.2, -0.32, mats.woodDark)
        addBox(group, 0.04, 0.4, 0.04, 0.82, 0.2, -0.68, mats.woodDark)
        addBox(group, 0.04, 0.4, 0.04, 1.18, 0.2, -0.68, mats.woodDark)
        // 书架
        addBox(group, 0.8, 1.8, 0.3, -1.7, 0.9, -1.4, mats.woodDark)
        addBox(group, 0.76, 0.02, 0.28, -1.7, 0.5, -1.4, mats.wood)
        addBox(group, 0.76, 0.02, 0.28, -1.7, 1.0, -1.4, mats.wood)
        addBox(group, 0.76, 0.02, 0.28, -1.7, 1.5, -1.4, mats.wood)
        // 小厨房
        makeKitchen(group, 1.5, 0, 1.0, Math.PI)
        makePlant(group, 1.7, 0, 0.2, 0.6)
        return group
      }

      const buildCity = () => {
        const group = new THREE.Group()
        addBox(group, 4, 0.08, 3.5, 0, 0.04, 0, mats.floor(3))
        addBox(group, 0.12, 2.6, 3.5, -2, 1.3, 0, mats.wallDark)
        addBox(group, 0.12, 2.6, 3.5, 2, 1.3, 0, mats.wall)
        addBox(group, 4, 2.6, 0.12, 0, 1.3, -1.75, mats.wall)
        // LOFT 风格：大开间
        // 大床
        makeBed(group, -1.1, 0, 0.8, 0, mats.fabricWarm)
        // 沙发
        makeSofa(group, 0.8, 0, -0.6, 0, mats.fabric)
        // 小餐桌
        addBox(group, 0.8, 0.06, 0.8, 0.8, 0.6, 0.8, mats.wood)
        for (const [lx, lz] of [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32]]) {
          addBox(group, 0.05, 0.58, 0.05, lx, 0.3, lz, mats.woodDark)
        }
        // 开放式厨房
        makeKitchen(group, 1.5, 0, -0.8, Math.PI / 2)
        makeFridge(group, 1.6, 0, 0.8)
        makePlant(group, -1.7, 0, -1.2, 0.9)
        makeFloorLamp(group, 0, 0, -1.3)
        return group
      }

      const builders = [buildLuxury, buildStandard, buildStudent, buildCity]

      // 模型容器
      const world = new THREE.Group()
      scene.add(world)
      let currentIdx = 0
      let model = builders[0]()
      world.add(model)

      // 切换动画
      let morph = null
      const startMorph = (idx) => {
        if (idx === currentIdx) return
        if (morph) { morph.queued = idx; return }
        morph = { t: 0, to: idx, queued: null }
      }

      // 轨道控制
      const R = 8.2
      let az = VIEW_ANGLES[0]
      let polar = 1.15
      let target = az
      let dragging = false
      let lastX = 0
      let lastY = 0
      let hovered = activeRef.current
      let visible = true

      const snapFor = (idx) => {
        const base = VIEW_ANGLES[idx]
        return base + Math.round((az - base) / (Math.PI * 2)) * Math.PI * 2
      }
      const gotoType = (idx) => {
        if (idx == null || dragging) return
        target = snapFor(idx)
        if (reduce) {
          world.remove(model)
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
        lastX = e.clientX
        lastY = e.clientY
        dom.style.cursor = 'grabbing'
        dom.setPointerCapture?.(e.pointerId)
      }
      const onMove = (e) => {
        if (!dragging) return
        az -= (e.clientX - lastX) * 0.006
        polar = Math.min(1.35, Math.max(0.55, polar + (e.clientY - lastY) * 0.004))
        target = az
        lastX = e.clientX
        lastY = e.clientY
      }
      const onUp = () => {
        dragging = false
        dom.style.cursor = 'grab'
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

        // morph 推进：淡出 → 换模型 → 淡入
        if (morph) {
          morph.t += dt * 1000
          const k = Math.min(1, morph.t / (SWITCH_MS / 2))
          if (k < 1) {
            // 淡出 + 缩小
            const s = 1 - k * 0.3
            world.scale.setScalar(s)
            world.rotation.y = k * 0.3
            world.position.y = -k * 0.2
          } else {
            // 切换
            world.remove(model)
            currentIdx = morph.to
            model = builders[currentIdx]()
            world.add(model)
            const k2 = Math.min(1, (morph.t - SWITCH_MS / 2) / (SWITCH_MS / 2))
            const s = 0.7 + k2 * 0.3
            world.scale.setScalar(s)
            world.rotation.y = (1 - k2) * 0.3
            world.position.y = -(1 - k2) * 0.2
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
        ro.disconnect()
        vio.disconnect()
        document.removeEventListener('visibilitychange', onVis)
        dom.removeEventListener('pointerdown', onDown)
        dom.removeEventListener('pointermove', onMove)
        dom.removeEventListener('pointerup', onUp)
        dom.removeEventListener('pointercancel', onUp)
        dom.removeEventListener('webglcontextlost', onLost)
        const geos = new Set(boxCache.values())
        cylCache.forEach((g) => geos.add(g))
        sphCache.forEach((g) => geos.add(g))
        geos.forEach((g) => g.dispose())
        Object.values(mats).forEach((m) => {
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose())
          else m.dispose()
        })
        textures.forEach((t) => t.dispose())
        renderer.dispose()
        if (dom.parentNode === mount) mount.removeChild(dom)
      }
    }

    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          boot()
          io.disconnect()
        }
      }, { rootMargin: '300px 0px' })
      io.observe(mount)
    } else {
      boot()
    }

    return () => {
      disposed = true
      io?.disconnect()
      teardown()
    }
  }, [])

  return (
    <div className="v8-type-house" ref={mountRef}>
      {failed && (
        <div className="v8-type-house-fb" style={{ color: '#666', textAlign: 'center', padding: 40 }}>3D 不可用</div>
      )}
    </div>
  )
}
