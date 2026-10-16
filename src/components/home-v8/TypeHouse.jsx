import { useEffect, useRef, useState } from 'react'

// 写实室内剖面沙盘：
// - PBR 写实材质：程序化木纹（清漆+法线+粗糙度）、抹灰墙面、织物（sheen）、瓷砖
// - 房间真正用墙+门洞隔开，踢脚线、不同房间不同地板/墙面颜色
// - 家具交互：悬停高亮，点击开关/开合

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
    let disposed = false, raf = 0, io, started = false, teardown = () => {}
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

    const boot = async () => {
      if (started || disposed) return
      started = true
      let THREE
      try { THREE = await import('three') } catch { if (!disposed) setFailed(true); return }
      if (disposed) return
      if (!window.WebGLRenderingContext) { setFailed(true); return }

      const w = Math.max(1, mount.clientWidth), h = Math.max(1, mount.clientHeight)
      let renderer
      try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }) }
      catch { setFailed(true); return }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(w, h)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab'
      mount.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x0c0c0e)
      const camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 120)

      // ---- 光照（写实：暖阳光 + 天空补光 + 环境遮蔽感）----
      scene.add(new THREE.HemisphereLight(0xc8d4e8, 0x2a2620, 0.35))
      const sun = new THREE.DirectionalLight(0xffe4b8, 3.0)
      sun.position.set(-8, 10, 6)
      sun.castShadow = true
      sun.shadow.mapSize.set(2048, 2048)
      sun.shadow.camera.left = -9; sun.shadow.camera.right = 9
      sun.shadow.camera.top = 9; sun.shadow.camera.bottom = -9
      sun.shadow.camera.near = 1; sun.shadow.camera.far = 40
      sun.shadow.bias = -0.0002; sun.shadow.radius = 5
      scene.add(sun)
      const fill = new THREE.DirectionalLight(0x8fa8c8, 0.35)
      fill.position.set(6, 4, -7); scene.add(fill)

      // 环境贴图
      const envCanvas = document.createElement('canvas'); envCanvas.width = 512; envCanvas.height = 256
      {
        const ectx = envCanvas.getContext('2d')
        const eg = ectx.createLinearGradient(0, 0, 0, 256)
        eg.addColorStop(0, '#f0f4fa'); eg.addColorStop(0.3, '#dde4f0')
        eg.addColorStop(0.5, '#c5cddb'); eg.addColorStop(0.52, '#aab2c0'); eg.addColorStop(1, '#7a8290')
        ectx.fillStyle = eg; ectx.fillRect(0, 0, 512, 256)
      }
      const envTex = new THREE.CanvasTexture(envCanvas)
      envTex.mapping = THREE.EquirectangularReflectionMapping
      envTex.colorSpace = THREE.SRGBColorSpace
      const pmrem = new THREE.PMREMGenerator(renderer)
      const envRT = pmrem.fromEquirectangular(envTex)
      scene.environment = envRT.texture
      pmrem.dispose()

      // ---- 纹理工具 ----
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
      const toTex = (c, srgb) => {
        const t = new THREE.CanvasTexture(c)
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        if (srgb) t.colorSpace = THREE.SRGBColorSpace
        t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
        textures.push(t)
        return t
      }
      // 值噪声
      const makeNoise = (rnd) => {
        const size = 256
        const grid = new Float32Array(size * size)
        for (let i = 0; i < grid.length; i++) grid[i] = rnd()
        const fade = (t) => t * t * (3 - 2 * t)
        return (x, y) => {
          const xi = Math.floor(x) % size, yi = Math.floor(y) % size
          const xf = x - Math.floor(x), yf = y - Math.floor(y)
          const xm = (xi + size) % size, ym = (yi + size) % size
          const a = grid[ym * size + xm]
          const b = grid[ym * size + (xm + 1) % size]
          const c = grid[(ym + 1) % size * size + xm]
          const d = grid[(ym + 1) % size * size + (xm + 1) % size]
          const u = fade(xf), v = fade(yf)
          return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v
        }
      }
      const fbm = (noise, x, y, oct = 5) => {
        let v = 0, a = 0.5, fx = x, fy = y
        for (let i = 0; i < oct; i++) { v += noise(fx, fy) * a; fx *= 2; fy *= 2; a *= 0.5 }
        return v
      }
      const heightToNormal = (hCanvas, strength = 1.5) => {
        const size = hCanvas.width
        const hd = hCanvas.getContext('2d').getImageData(0, 0, size, size).data
        const out = document.createElement('canvas'); out.width = out.height = size
        const octx = out.getContext('2d'); const od = octx.createImageData(size, size)
        const getH = (x, y) => hd[((y + size) % size * size + (x + size) % size) * 4] / 255
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
          const dx = (getH(x + 1, y) - getH(x - 1, y)) * strength
          const dy = (getH(x, y + 1) - getH(x, y - 1)) * strength
          const nz = 1, len = Math.sqrt(dx * dx + dy * dy + nz * nz)
          const i = (y * size + x) * 4
          od.data[i] = (-dx / len * 0.5 + 0.5) * 255
          od.data[i + 1] = (-dy / len * 0.5 + 0.5) * 255
          od.data[i + 2] = (nz / len * 0.5 + 0.5) * 255
          od.data[i + 3] = 255
        }
        octx.putImageData(od, 0, 0)
        const t = new THREE.CanvasTexture(out); t.wrapS = t.wrapT = THREE.RepeatWrapping
        textures.push(t); return t
      }
      const heightToRoughness = (hCanvas, base = 0.5, varAmt = 0.3) => {
        const size = hCanvas.width
        const hd = hCanvas.getContext('2d').getImageData(0, 0, size, size).data
        const out = document.createElement('canvas'); out.width = out.height = size
        const octx = out.getContext('2d'); const od = octx.createImageData(size, size)
        for (let i = 0; i < size * size; i++) {
          const h = hd[i * 4] / 255
          const r = Math.min(1, Math.max(0, base + (h - 0.5) * varAmt * 2))
          const v = r * 255
          od.data[i * 4] = v; od.data[i * 4 + 1] = v; od.data[i * 4 + 2] = v; od.data[i * 4 + 3] = 255
        }
        octx.putImageData(od, 0, 0)
        const t = new THREE.CanvasTexture(out); t.wrapS = t.wrapT = THREE.RepeatWrapping
        textures.push(t); return t
      }

      // === 写实木地板（板条+木纹+节疤+法线+粗糙度）===
      const makeWoodFloor = (seed, baseHex, plankCount = 8) => {
        const size = 512
        const c = document.createElement('canvas'); c.width = c.height = size
        const ctx = c.getContext('2d')
        const rnd = rnd32(seed)
        const noise = makeNoise(rnd32(seed + 999))
        const base = parseInt(baseHex.slice(1), 16)
        const br = (base >> 16) & 255, bg = (base >> 8) & 255, bb = base & 255
        const plankH = size / plankCount

        for (let i = 0; i < plankCount; i++) {
          const y = i * plankH
          // 板条基色（每块略有不同）
          const shade = 0.88 + rnd() * 0.24
          const r = Math.min(255, br * shade), g = Math.min(255, bg * shade), b = Math.min(255, bb * shade)
          ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`
          ctx.fillRect(0, y, size, plankH)

          // 木纹：多层正弦 + 噪声扰动
          for (let line = 0; line < 60; line++) {
            const ly = y + (line / 60) * plankH + rnd() * 2
            const amp = 1.5 + rnd() * 3
            ctx.strokeStyle = `rgba(${Math.max(0, r - 30) | 0},${Math.max(0, g - 25) | 0},${Math.max(0, b - 15) | 0},${0.04 + rnd() * 0.08})`
            ctx.lineWidth = 0.3 + rnd() * 0.8
            ctx.beginPath()
            ctx.moveTo(0, ly)
            for (let x = 0; x <= size; x += 8) {
              const n = fbm(noise, x * 0.02 + i, line * 0.5, 3) * amp
              ctx.lineTo(x, ly + Math.sin(x * 0.03 + line) * 0.8 + n - amp / 2)
            }
            ctx.stroke()
          }
          // 节疤
          if (rnd() > 0.35) {
            const kx = size * (0.1 + rnd() * 0.8), ky = y + plankH * (0.2 + rnd() * 0.6)
            const kr = 4 + rnd() * 12
            // 节疤周围木纹扭曲
            const kg = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr * 2.5)
            kg.addColorStop(0, `rgba(40,20,8,0.5)`)
            kg.addColorStop(0.4, `rgba(60,35,15,0.3)`)
            kg.addColorStop(1, `rgba(60,35,15,0)`)
            ctx.fillStyle = kg
            ctx.beginPath(); ctx.arc(kx, ky, kr * 2.5, 0, Math.PI * 2); ctx.fill()
            // 节疤中心
            ctx.fillStyle = `rgba(30,15,5,0.6)`
            ctx.beginPath(); ctx.arc(kx, ky, kr * 0.5, 0, Math.PI * 2); ctx.fill()
          }
        }
        // 板缝（深色凹槽）
        for (let i = 1; i < plankCount; i++) {
          const y = i * plankH
          ctx.fillStyle = 'rgba(20,10,5,0.35)'; ctx.fillRect(0, y - 1, size, 2)
          ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, y + 1, size, 1)
        }
        // 纵向错缝
        for (let i = 0; i < plankCount; i++) {
          if (rnd() > 0.25) {
            const x = size * (0.1 + rnd() * 0.8)
            ctx.fillStyle = 'rgba(20,10,5,0.25)'; ctx.fillRect(x - 0.5, i * plankH, 1, plankH)
          }
        }
        // 细微噪点
        const img = ctx.getImageData(0, 0, size, size)
        const d = img.data
        for (let i = 0; i < d.length; i += 4) {
          const n = (rnd() - 0.5) * 8
          d[i] += n; d[i + 1] += n; d[i + 2] += n
        }
        ctx.putImageData(img, 0, 0)

        const map = toTex(c, true)
        const normal = heightToNormal(c, 2.0)
        const rough = heightToRoughness(c, 0.45, 0.25)
        return { map, normal, rough }
      }

      // === 瓷砖地板（厨卫）===
      const makeTileFloor = (seed, baseHex, tileSize = 64) => {
        const size = 512
        const c = document.createElement('canvas'); c.width = c.height = size
        const ctx = c.getContext('2d')
        const rnd = rnd32(seed)
        const base = parseInt(baseHex.slice(1), 16)
        const br = (base >> 16) & 255, bg = (base >> 8) & 255, bb = base & 255
        for (let y = 0; y < size; y += tileSize) {
          for (let x = 0; x < size; x += tileSize) {
            const shade = 0.95 + rnd() * 0.1
            ctx.fillStyle = `rgb(${(br * shade) | 0},${(bg * shade) | 0},${(bb * shade) | 0})`
            ctx.fillRect(x, y, tileSize, tileSize)
            // 瓷砖内细微纹理
            for (let i = 0; i < 8; i++) {
              ctx.strokeStyle = `rgba(255,255,255,${0.02 + rnd() * 0.04})`
              ctx.beginPath()
              ctx.moveTo(x + rnd() * tileSize, y)
              ctx.lineTo(x + rnd() * tileSize, y + tileSize)
              ctx.stroke()
            }
          }
        }
        // 填缝
        ctx.fillStyle = 'rgba(180,170,150,0.5)'
        for (let x = 0; x <= size; x += tileSize) ctx.fillRect(x - 1.5, 0, 3, size)
        for (let y = 0; y <= size; y += tileSize) ctx.fillRect(0, y - 1.5, size, 3)
        const img = ctx.getImageData(0, 0, size, size)
        const d = img.data
        for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 4; d[i] += n; d[i + 1] += n; d[i + 2] += n }
        ctx.putImageData(img, 0, 0)
        const map = toTex(c, true)
        const normal = heightToNormal(c, 1.0)
        const rough = heightToRoughness(c, 0.35, 0.15)
        return { map, normal, rough }
      }

      // === 地毯（卧室）===
      const makeCarpet = (seed, baseHex) => {
        const size = 256
        const c = document.createElement('canvas'); c.width = c.height = size
        const ctx = c.getContext('2d')
        const rnd = rnd32(seed)
        const base = parseInt(baseHex.slice(1), 16)
        ctx.fillStyle = baseHex; ctx.fillRect(0, 0, size, size)
        for (let y = 0; y < size; y += 1) {
          for (let x = 0; x < size; x += 1) {
            const n = (rnd() - 0.5) * 30
            ctx.fillStyle = `rgba(${(base >> 16 & 255) + n | 0},${(base >> 8 & 255) + n | 0},${(base & 255) + n | 0},1)`
            ctx.fillRect(x, y, 1, 1)
          }
        }
        const map = toTex(c, true)
        const normal = heightToNormal(c, 0.8)
        return { map, normal }
      }

      // === 抹灰墙面 ===
      const makeWall = (seed, baseHex) => {
        const size = 256
        const c = document.createElement('canvas'); c.width = c.height = size
        const ctx = c.getContext('2d')
        const rnd = rnd32(seed)
        const noise = makeNoise(rnd32(seed + 500))
        ctx.fillStyle = baseHex; ctx.fillRect(0, 0, size, size)
        // 抹灰肌理
        const img = ctx.getImageData(0, 0, size, size)
        const d = img.data
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
          const n = fbm(noise, x * 0.05, y * 0.05, 4) - 0.5
          const v = n * 18
          const i = (y * size + x) * 4
          d[i] += v; d[i + 1] += v; d[i + 2] += v
        }
        ctx.putImageData(img, 0, 0)
        const map = toTex(c, true)
        const normal = heightToNormal(c, 0.6)
        return { map, normal }
      }

      // === 织物（沙发/床品）===
      const makeFabric = (seed, baseHex) => {
        const size = 256
        const c = document.createElement('canvas'); c.width = c.height = size
        const ctx = c.getContext('2d')
        const rnd = rnd32(seed)
        ctx.fillStyle = baseHex; ctx.fillRect(0, 0, size, size)
        // 编织纹理
        for (let y = 0; y < size; y += 2) {
          for (let x = 0; x < size; x += 2) {
            const v = (rnd() - 0.5) * 20
            const dark = v < 0
            ctx.fillStyle = `rgba(${dark ? 0 : 255},${dark ? 0 : 255},${dark ? 0 : 255},${Math.abs(v) / 60})`
            ctx.fillRect(x, y, 1, 1)
          }
        }
        const img = ctx.getImageData(0, 0, size, size)
        const d = img.data
        for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 6; d[i] += n; d[i + 1] += n; d[i + 2] += n }
        ctx.putImageData(img, 0, 0)
        const map = toTex(c, true)
        const normal = heightToNormal(c, 1.0)
        return { map, normal }
      }

      // 预生成材质数据
      const woodLuxury = makeWoodFloor(11, '#7a5230')
      const woodStandard = makeWoodFloor(22, '#9a6b40')
      const woodCity = makeWoodFloor(44, '#a87c4a')
      const woodStudent = makeWoodFloor(33, '#6e5a44')
      const tileKitchen = makeTileFloor(55, '#d8d2c4')
      const tileBath = makeTileFloor(66, '#e8e6e0')
      const carpetBedroom = makeCarpet(77, '#8a7e6f')
      const wallWhite = makeWall(101, '#e8e4dc')
      const wallBeige = makeWall(102, '#ddd2c2')
      const wallGray = makeWall(103, '#cfd0d4')
      const wallDark = makeWall(104, '#3e3933')
      const fabricBlue = makeFabric(201, '#4a5a72')
      const fabricWarm = makeFabric(202, '#a0704a')
      const fabricGreen = makeFabric(203, '#5e6e4e')
      const fabricGray = makeFabric(204, '#7a7670')

      // ---- 材质库 ----
      const mats = {
        woodFloor: (data) => new THREE.MeshPhysicalMaterial({
          map: data.map, normalMap: data.normal, roughnessMap: data.rough,
          roughness: 0.45, metalness: 0.02, clearcoat: 0.6, clearcoatRoughness: 0.3,
          envMapIntensity: 0.5
        }),
        tileFloor: (data) => new THREE.MeshPhysicalMaterial({
          map: data.map, normalMap: data.normal, roughnessMap: data.rough,
          roughness: 0.35, metalness: 0.0, clearcoat: 0.4, clearcoatRoughness: 0.2,
          envMapIntensity: 0.4
        }),
        carpet: (data) => new THREE.MeshStandardMaterial({
          map: data.map, normalMap: data.normal, roughness: 0.95, metalness: 0, envMapIntensity: 0.1
        }),
        wall: (data) => new THREE.MeshStandardMaterial({
          map: data.map, normalMap: data.normal, roughness: 0.92, metalness: 0, envMapIntensity: 0.15
        }),
        wood: new THREE.MeshPhysicalMaterial({
          map: woodLuxury.map, color: 0x8a6238, roughness: 0.5, metalness: 0.03,
          clearcoat: 0.3, clearcoatRoughness: 0.4, envMapIntensity: 0.4
        }),
        woodDark: new THREE.MeshPhysicalMaterial({
          map: woodStudent.map, color: 0x5a3e22, roughness: 0.55, metalness: 0.03,
          clearcoat: 0.3, clearcoatRoughness: 0.4, envMapIntensity: 0.4
        }),
        fabric: (f) => new THREE.MeshPhysicalMaterial({
          map: f.map, normalMap: f.normal, roughness: 0.85, metalness: 0,
          sheen: 0.5, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.5,
          envMapIntensity: 0.2
        }),
        white: new THREE.MeshStandardMaterial({ color: 0xf0ece4, roughness: 0.65, metalness: 0 }),
        metal: new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.2, metalness: 0.92, envMapIntensity: 1.2 }),
        brass: new THREE.MeshStandardMaterial({ color: 0xb8924a, roughness: 0.28, metalness: 0.88, envMapIntensity: 1.0 }),
        glass: new THREE.MeshPhysicalMaterial({
          color: 0xc8d8e8, roughness: 0.04, metalness: 0, transmission: 0.75,
          thickness: 0.15, ior: 1.45, envMapIntensity: 0.8
        }),
        ceramic: new THREE.MeshPhysicalMaterial({
          color: 0xf5f3ee, roughness: 0.2, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.1, envMapIntensity: 0.4
        }),
        plant: new THREE.MeshStandardMaterial({ color: 0x4a6741, roughness: 0.85, metalness: 0 }),
        plantPot: new THREE.MeshStandardMaterial({ color: 0xc4a882, roughness: 0.7, metalness: 0.05 }),
        baseboard: new THREE.MeshStandardMaterial({ color: 0xf0ece4, roughness: 0.5, metalness: 0 }),
      }

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

      // ---- 交互 ----
      const interactives = []
      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      const registerInteractive = (mesh, opts = {}) => {
        const item = { mesh, state: opts.initialState || {}, onHover: opts.onHover || null, onClick: opts.onClick || null, hovered: false }
        interactives.push(item); return item
      }

      const addBox = (group, w2, h2, d2, x, y, z, mat, rx = 0, ry = 0, rz = 0) => {
        const m = new THREE.Mesh(boxGeo(w2, h2, d2), mat)
        m.position.set(x, y, z); m.rotation.set(rx, ry, rz)
        m.castShadow = true; m.receiveShadow = true
        group.add(m); return m
      }
      const addCyl = (group, rT, rB, h, x, y, z, mat, seg = 16) => {
        const m = new THREE.Mesh(cylGeo(rT, rB, h, seg), mat)
        m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true
        group.add(m); return m
      }

      // 带门洞的墙：在指定位置留出门洞
      const addWallWithDoor = (group, x, y, z, w, h, d, doorX, doorW, doorH, mat) => {
        const halfW = w / 2
        const doorLeft = doorX - doorW / 2
        const doorRight = doorX + doorW / 2
        const leftW = doorLeft + halfW
        const rightW = halfW - doorRight
        const midW = w
        if (leftW > 0.01) addBox(group, leftW, h, d, x - (w - leftW) / 2, y, z, mat)
        if (rightW > 0.01) addBox(group, rightW, h, d, x + (w - rightW) / 2, y, z, mat)
        // 门上方过梁
        const beamH = h - doorH
        if (beamH > 0.01) addBox(group, doorW, beamH, d, x + doorX, y + doorH + beamH / 2, z, mat)
      }

      // 踢脚线
      const addBaseboard = (group, x, y, z, w, d) => {
        addBox(group, w, 0.1, d, x, 0.05, z, mats.baseboard)
      }

      // === 家具 ===
      const makeBed = (group, x, y, z, rot = 0, f = fabricBlue) => {
        const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot
        addBox(g, 1.5, 0.28, 2.1, 0, 0.14, 0, mats.woodDark)
        addBox(g, 1.42, 0.2, 2.0, 0, 0.38, 0, mats.white)
        const blanket = addBox(g, 1.42, 0.12, 1.1, 0, 0.5, -0.45, mats.fabric(f))
        addBox(g, 0.6, 0.14, 0.4, -0.34, 0.58, 0.7, mats.white)
        addBox(g, 0.6, 0.14, 0.4, 0.34, 0.58, 0.7, mats.white)
        registerInteractive(blanket, {
          initialState: { on: false },
          onHover: (it, h) => it.mesh.material.emissive.setHex(h ? 0x1a0f00 : 0x000000),
          onClick: (it) => { it.state.on = !it.state.on; it.mesh.position.z = it.state.on ? -0.72 : -0.45; it.mesh.scale.y = it.state.on ? 0.35 : 1 },
        })
        group.add(g)
      }

      const makeSofa = (group, x, y, z, rot = 0, f = fabricBlue) => {
        const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot
        addBox(g, 1.9, 0.32, 0.9, 0, 0.2, 0, mats.fabric(f))
        addBox(g, 1.9, 0.5, 0.2, 0, 0.58, -0.35, mats.fabric(f))
        addBox(g, 0.2, 0.42, 0.9, -0.85, 0.48, 0, mats.fabric(f))
        addBox(g, 0.2, 0.42, 0.9, 0.85, 0.48, 0, mats.fabric(f))
        const c1 = addBox(g, 0.52, 0.32, 0.18, -0.42, 0.6, -0.22, mats.white)
        const c2 = addBox(g, 0.52, 0.32, 0.18, 0.42, 0.6, -0.22, mats.white)
        ;[c1, c2].forEach((c, i) => registerInteractive(c, {
          onHover: (it, h) => it.mesh.material.emissive.setHex(h ? 0x1a1a1a : 0x000000),
          onClick: (it) => { it.state.t = it.state.t ? 0 : (i === 0 ? 0.15 : -0.15); it.mesh.rotation.z = it.state.t },
        }))
        group.add(g)
      }

      const makeDining = (group, x, y, z, rot = 0) => {
        const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot
        addBox(g, 1.3, 0.06, 0.85, 0, 0.74, 0, mats.wood)
        for (const [lx, lz] of [[-0.55, -0.34], [0.55, -0.34], [-0.55, 0.34], [0.55, 0.34]])
          addBox(g, 0.06, 0.72, 0.06, lx, 0.36, lz, mats.woodDark)
        const seats = []
        const chair = (cx, cz, ry) => {
          const cg = new THREE.Group(); cg.position.set(cx, 0, cz); cg.rotation.y = ry
          const s = addBox(cg, 0.42, 0.05, 0.42, 0, 0.44, 0, mats.wood)
          addBox(cg, 0.42, 0.42, 0.05, 0, 0.64, -0.19, mats.woodDark)
          for (const [lx, lz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]])
            addBox(cg, 0.04, 0.42, 0.04, lx, 0.21, lz, mats.woodDark)
          seats.push(s); g.add(cg)
        }
        chair(-0.78, 0, Math.PI / 2); chair(0.78, 0, -Math.PI / 2); chair(0, -0.58, 0); chair(0, 0.58, Math.PI)
        seats.forEach((m) => registerInteractive(m, {
          onHover: (it, h) => it.mesh.material.emissive.setHex(h ? 0x1a0f00 : 0x000000),
          onClick: (it) => { it.state.r = (it.state.r || 0) + Math.PI / 4; it.mesh.parent.rotation.y = it.state.r },
        }))
        group.add(g)
      }

      const makeKitchen = (group, x, y, z, rot = 0) => {
        const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot
        addBox(g, 2.6, 0.06, 0.68, 0, 0.9, 0, mats.white)
        addBox(g, 2.6, 0.86, 0.62, 0, 0.45, 0, mats.wood)
        const dL = addBox(g, 1.2, 0.78, 0.04, -0.66, 0.47, 0.32, mats.woodDark)
        const dR = addBox(g, 1.2, 0.78, 0.04, 0.66, 0.47, 0.32, mats.woodDark)
        ;[dL, dR].forEach((d, i) => registerInteractive(d, {
          initialState: { open: false },
          onHover: (it, h) => it.mesh.material.emissive.setHex(h ? 0x110800 : 0x000000),
          onClick: (it) => { it.state.open = !it.state.open; it.mesh.rotation.y = it.state.open ? (i === 0 ? 1.2 : -1.2) : 0 },
        }))
        addBox(g, 0.5, 0.04, 0.4, -0.7, 0.94, 0, mats.metal)
        addBox(g, 0.46, 0.14, 0.36, -0.7, 0.87, 0, mats.metal)
        addCyl(g, 0.02, 0.02, 0.28, -0.7, 1.08, 0.1, mats.metal, 8)
        addBox(g, 0.65, 0.04, 0.42, 0.7, 0.94, 0, mats.metal)
        group.add(g)
      }

      const makeFridge = (group, x, y, z) => {
        const g = new THREE.Group(); g.position.set(x, y, z)
        addBox(g, 0.72, 1.75, 0.72, 0, 0.88, 0, mats.white)
        const door = addBox(g, 0.04, 1.7, 0.68, 0.34, 0.88, 0, mats.white)
        registerInteractive(door, {
          initialState: { open: false },
          onHover: (it, h) => it.mesh.material.emissive.setHex(h ? 0x222222 : 0x000000),
          onClick: (it) => {
            it.state.open = !it.state.open
            it.mesh.rotation.y = it.state.open ? -1.4 : 0
            it.mesh.position.x = it.state.open ? 0.02 : 0.34
          },
        })
        group.add(g)
      }

      const makePlant = (group, x, y, z, scale = 1) => {
        const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(scale)
        addCyl(g, 0.15, 0.12, 0.32, 0, 0.16, 0, mats.plantPot)
        const leaves = addBox(g, 0.55, 0.65, 0.55, 0, 0.64, 0, mats.plant)
        registerInteractive(leaves, {
          onHover: (it, h) => it.mesh.material.emissive.setHex(h ? 0x0a1a05 : 0x000000),
          onClick: (it) => { it.state.s = it.state.s ? 0 : 0.12; it.mesh.rotation.z = it.state.s },
        })
        group.add(g)
      }

      const makeFloorLamp = (group, x, y, z) => {
        const g = new THREE.Group(); g.position.set(x, y, z)
        addCyl(g, 0.02, 0.02, 1.55, 0, 0.78, 0, mats.metal, 8)
        const shade = addCyl(g, 0.18, 0.22, 0.32, 0, 1.7, 0, mats.white, 16)
        const bulb = new THREE.PointLight(0xffd9a8, 0, 5, 2); bulb.position.set(0, 1.65, 0); g.add(bulb)
        registerInteractive(shade, {
          initialState: { on: false },
          onHover: (it, h) => { if (!it.state.on) it.mesh.material.emissive.setHex(h ? 0x332200 : 0x000000) },
          onClick: (it) => {
            it.state.on = !it.state.on
            bulb.intensity = it.state.on ? 1.2 : 0
            it.mesh.material.emissive.setHex(it.state.on ? 0x664400 : 0x000000)
          },
        })
        group.add(g)
      }

      const makeBathroom = (group, x, y, z, rot = 0) => {
        const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot
        addBox(g, 0.85, 0.55, 1.7, 0, 0.28, 0, mats.ceramic)
        addBox(g, 0.74, 0.16, 1.6, 0, 0.5, 0, mats.white)
        const toilet = addBox(g, 0.42, 0.42, 0.55, 0.85, 0.21, 0, mats.ceramic)
        registerInteractive(toilet, {
          onHover: (it, h) => it.mesh.material.emissive.setHex(h ? 0x222222 : 0x000000),
          onClick: (it) => { it.state.u = !it.state.u; it.mesh.position.y = it.state.u ? 0.3 : 0.21 },
        })
        addBox(g, 0.65, 0.85, 0.48, -0.85, 0.43, 0.3, mats.white)
        addBox(g, 0.55, 0.05, 0.4, -0.85, 0.88, 0.3, mats.metal)
        group.add(g)
      }

      const makeDesk = (group, x, y, z, rot = 0) => {
        const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot
        addBox(g, 1.1, 0.06, 0.6, 0, 0.76, 0, mats.wood)
        addBox(g, 0.05, 0.72, 0.55, -0.52, 0.38, 0, mats.woodDark)
        addBox(g, 0.05, 0.72, 0.55, 0.52, 0.38, 0, mats.woodDark)
        const drawer = addBox(g, 0.9, 0.18, 0.04, 0, 0.5, 0.3, mats.woodDark)
        registerInteractive(drawer, {
          initialState: { open: false },
          onHover: (it, h) => it.mesh.material.emissive.setHex(h ? 0x110800 : 0x000000),
          onClick: (it) => { it.state.open = !it.state.open; it.mesh.position.z = it.state.open ? 0.5 : 0.3 },
        })
        group.add(g)
      }

      // 窗户（带玻璃，透光）
      const makeWindow = (group, x, y, z, w, h, ry = 0) => {
        const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry
        addBox(g, w, 0.08, 0.06, 0, h / 2, 0, mats.wood)
        addBox(g, 0.06, h, 0.06, -w / 2, h / 2, 0, mats.wood)
        addBox(g, 0.06, h, 0.06, w / 2, h / 2, 0, mats.wood)
        addBox(g, 0.04, h, 0.04, 0, h / 2, 0, mats.wood)
        addBox(g, w, 0.04, 0.04, 0, h, 0, mats.wood)
        addBox(g, w - 0.06, h - 0.06, 0.02, 0, h / 2, 0.02, mats.glass)
        group.add(g)
      }

      // ---- 四种户型 ----
      const WALL_H = 2.8
      const DOOR_H = 2.1

      // 豪华住宅 5室3厅 7.5 x 6
      const buildLuxury = () => {
        const g = new THREE.Group()
        // 地板：客厅木地板，厨卫瓷砖，卧室地毯
        addBox(g, 7.5, 0.08, 6, 0, 0.04, 0, mats.woodFloor(woodLuxury))
        // 卧室地毯区
        addBox(g, 2.2, 0.02, 2.0, -2.4, 0.09, -1.0, mats.carpet(carpetBedroom))
        addBox(g, 2.2, 0.02, 1.8, 0.5, 0.09, -1.0, mats.carpet(carpetBedroom))
        // 厨卫瓷砖
        addBox(g, 1.5, 0.02, 2.0, 3.0, 0.09, 0.5, mats.tileFloor(tileKitchen))
        addBox(g, 1.5, 0.02, 1.0, 3.0, 0.09, 2.2, mats.tileFloor(tileBath))

        // 外墙
        addBox(g, 0.12, WALL_H, 6, -3.75, WALL_H / 2, 0, mats.wall(wallBeige))
        addBox(g, 0.12, WALL_H, 6, 3.75, WALL_H / 2, 0, mats.wall(wallDark))
        addBox(g, 7.5, WALL_H, 0.12, 0, WALL_H / 2, -3, mats.wall(wallBeige))
        // 踢脚线
        addBaseboard(g, -3.7, 0, 0, 0.06, 6)
        addBaseboard(g, 3.7, 0, 0, 0.06, 6)

        // 隔墙（带门洞）
        addWallWithDoor(g, -1.2, WALL_H / 2, 1.9, 0.12, WALL_H, 2.2, 0, 0.9, DOOR_H, mats.wall(wallWhite))
        addWallWithDoor(g, 1.5, WALL_H / 2, -1.0, 0.12, WALL_H, 2.0, 0, 0.9, DOOR_H, mats.wall(wallWhite))
        addWallWithDoor(g, 2.8, WALL_H / 2, 1.5, 0.12, WALL_H, 1.8, 0, 0.8, DOOR_H, mats.wall(wallGray))

        // 卧室
        makeBed(g, -2.4, 0, 0.5, 0, fabricWarm)
        makeBed(g, -2.4, 0, -1.8, 0, fabricBlue)
        makeBed(g, 0.5, 0, -1.6, 0, fabricGreen)
        makeBed(g, 0.5, 0, 0.8, 0, fabricGray)
        makeBed(g, -1.0, 0, -2.6, Math.PI / 2, fabricBlue)
        // 客厅
        makeSofa(g, 0.3, 0, 0.3, 0, fabricWarm)
        makeDining(g, 1.8, 0, 1.8, 0)
        // 厨房
        makeKitchen(g, 3.0, 0, 0.3, Math.PI / 2)
        makeFridge(g, 3.1, 0, -1.8)
        // 卫生间
        makeBathroom(g, 3.0, 0, 2.2, Math.PI / 2)
        // 植物
        makePlant(g, -3.4, 0, 2.2, 0.9)
        makePlant(g, 3.4, 0, -2.5, 0.7)
        makeFloorLamp(g, 1.5, 0, -0.3)
        // 窗户
        makeWindow(g, -3.74, 0, -1.5, 1.2, 1.2, Math.PI / 2)
        return g
      }

      // 普通住宅 3室2厅 5.5 x 4.5
      const buildStandard = () => {
        const g = new THREE.Group()
        addBox(g, 5.5, 0.08, 4.5, 0, 0.04, 0, mats.woodFloor(woodStandard))
        addBox(g, 2.0, 0.02, 1.8, -1.4, 0.09, 0, mats.carpet(carpetBedroom))
        addBox(g, 2.0, 0.02, 1.5, -1.4, 0.09, -1.6, mats.carpet(carpetBedroom))
        addBox(g, 1.2, 0.02, 1.0, 2.2, 0.09, -1.5, mats.tileFloor(tileKitchen))

        addBox(g, 0.12, WALL_H, 4.5, -2.75, WALL_H / 2, 0, mats.wall(wallWhite))
        addBox(g, 0.12, WALL_H, 4.5, 2.75, WALL_H / 2, 0, mats.wall(wallBeige))
        addBox(g, 5.5, WALL_H, 0.12, 0, WALL_H / 2, -2.25, mats.wall(wallWhite))

        addWallWithDoor(g, 0, WALL_H / 2, 1.1, 0.12, WALL_H, 2.2, 0, 0.9, DOOR_H, mats.wall(wallWhite))
        addWallWithDoor(g, -1.5, WALL_H / 2, -0.5, 0.12, WALL_H, 1.8, 0, 0.8, DOOR_H, mats.wall(wallWhite))

        makeBed(g, -1.4, 0, 0.8, 0, fabricBlue)
        makeBed(g, -1.4, 0, -1.3, 0, fabricWarm)
        makeBed(g, 1.0, 0, -1.5, 0, fabricGreen)
        makeSofa(g, 1.2, 0, 0.3, 0, fabricGray)
        makeDining(g, 1.3, 0, 1.8, 0)
        makeKitchen(g, 2.2, 0, -1.5, Math.PI / 2)
        makePlant(g, -2.5, 0, -1.8, 0.7)
        makeFloorLamp(g, 0.3, 0, 2.0)
        makeWindow(g, -2.74, 0, -1.0, 1.0, 1.1, Math.PI / 2)
        return g
      }

      // 城市公寓 2房1厅 4.5 x 3.8
      const buildCity = () => {
        const g = new THREE.Group()
        addBox(g, 4.5, 0.08, 3.8, 0, 0.04, 0, mats.woodFloor(woodCity))
        addBox(g, 1.8, 0.02, 1.5, -1.2, 0.09, 0, mats.carpet(carpetBedroom))
        addBox(g, 1.8, 0.02, 1.2, -1.2, 0.09, -1.3, mats.carpet(carpetBedroom))
        addBox(g, 1.2, 0.02, 1.2, 1.9, 0.09, -1.2, mats.tileFloor(tileKitchen))

        addBox(g, 0.12, WALL_H, 3.8, -2.25, WALL_H / 2, 0, mats.wall(wallDark))
        addBox(g, 0.12, WALL_H, 3.8, 2.25, WALL_H / 2, 0, mats.wall(wallBeige))
        addBox(g, 4.5, WALL_H, 0.12, 0, WALL_H / 2, -1.9, mats.wall(wallBeige))

        addWallWithDoor(g, -0.5, WALL_H / 2, 1.0, 0.12, WALL_H, 1.8, 0, 0.8, DOOR_H, mats.wall(wallWhite))

        makeBed(g, -1.2, 0, 0.3, 0, fabricWarm)
        makeBed(g, -1.2, 0, -1.3, 0, fabricBlue)
        makeSofa(g, 1.0, 0, -0.5, 0, fabricGreen)
        addBox(g, 0.85, 0.06, 0.85, 1.0, 0.62, 1.0, mats.wood)
        for (const [lx, lz] of [[-0.34, -0.34], [0.34, -0.34], [-0.34, 0.34], [0.34, 0.34]])
          addBox(g, 0.05, 0.6, 0.05, lx, 0.3, lz, mats.woodDark)
        makeKitchen(g, 1.9, 0, -1.2, Math.PI / 2)
        makeFridge(g, 1.9, 0, 0.8)
        makePlant(g, -2.0, 0, -1.5, 0.8)
        makeFloorLamp(g, 0.2, 0, -1.6)
        makeWindow(g, -2.24, 0, -0.8, 0.9, 1.1, Math.PI / 2)
        return g
      }

      // 学生公寓 1房1厅 3.5 x 3
      const buildStudent = () => {
        const g = new THREE.Group()
        addBox(g, 3.5, 0.08, 3, 0, 0.04, 0, mats.woodFloor(woodStudent))
        addBox(g, 1.5, 0.02, 1.2, -0.9, 0.09, 0.5, mats.carpet(carpetBedroom))
        addBox(g, 1.0, 0.02, 1.0, 1.3, 0.09, 1.0, mats.tileFloor(tileKitchen))

        addBox(g, 0.12, WALL_H, 3, -1.75, WALL_H / 2, 0, mats.wall(wallWhite))
        addBox(g, 0.12, WALL_H, 3, 1.75, WALL_H / 2, 0, mats.wall(wallGray))
        addBox(g, 3.5, WALL_H, 0.12, 0, WALL_H / 2, -1.5, mats.wall(wallWhite))

        makeBed(g, -0.9, 0, 0.6, 0, fabricGray)
        makeDesk(g, 0.9, 0, -1.0, 0)
        addBox(g, 0.4, 0.05, 0.4, 0.9, 0.42, -0.5, mats.fabric(fabricBlue))
        for (const [lx, lz] of [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]])
          addBox(g, 0.04, 0.4, 0.04, lx, 0.2, lz, mats.woodDark)
        makeKitchen(g, 1.3, 0, 1.0, Math.PI)
        makePlant(g, 1.5, 0, 0.2, 0.6)
        makeFloorLamp(g, -0.5, 0, 1.2)
        makeWindow(g, -1.74, 0, -0.8, 0.8, 1.0, Math.PI / 2)
        return g
      }

      const builders = [buildLuxury, buildStandard, buildStudent, buildCity]
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

      const R = 10
      let az = VIEW_ANGLES[0], polar = 1.15, target = az
      let dragging = false, dragMoved = false, lastX = 0, lastY = 0
      let hovered = activeRef.current, visible = true, hoveredItem = null

      const snapFor = (idx) => VIEW_ANGLES[idx] + Math.round((az - VIEW_ANGLES[idx]) / (Math.PI * 2)) * Math.PI * 2
      const gotoType = (idx) => {
        if (idx == null || dragging) return
        target = snapFor(idx)
        if (reduce) {
          world.remove(model); clearInteractives()
          currentIdx = idx; model = builders[idx](); world.add(model); az = target
        } else startMorph(idx)
      }

      const dom = renderer.domElement
      const onDown = (e) => { dragging = true; dragMoved = false; lastX = e.clientX; lastY = e.clientY; dom.style.cursor = 'grabbing'; dom.setPointerCapture?.(e.pointerId) }
      const onMove = (e) => {
        if (dragging) {
          if (Math.abs(e.clientX - lastX) > 3 || Math.abs(e.clientY - lastY) > 3) dragMoved = true
          az -= (e.clientX - lastX) * 0.006
          polar = Math.min(1.35, Math.max(0.55, polar + (e.clientY - lastY) * 0.004))
          target = az; lastX = e.clientX; lastY = e.clientY; return
        }
        const rect = dom.getBoundingClientRect()
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects(interactives.map(i => i.mesh), false)
        if (hoveredItem && (!hits.length || hits[0].object !== hoveredItem.mesh)) {
          hoveredItem.hovered = false; hoveredItem.onHover?.(hoveredItem, false); hoveredItem = null
        }
        if (hits.length) {
          const item = interactives.find(i => i.mesh === hits[0].object)
          if (item && item !== hoveredItem) { hoveredItem = item; item.hovered = true; item.onHover?.(item, true); dom.style.cursor = 'pointer' }
        } else if (!hoveredItem) dom.style.cursor = 'grab'
      }
      const onUp = (e) => {
        if (dragging && !dragMoved) {
          const rect = dom.getBoundingClientRect()
          pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
          pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
          raycaster.setFromCamera(pointer, camera)
          const hits = raycaster.intersectObjects(interactives.map(i => i.mesh), false)
          if (hits.length) interactives.find(i => i.mesh === hits[0].object)?.onClick?.(interactives.find(i => i.mesh === hits[0].object))
        }
        dragging = false; dom.style.cursor = hoveredItem ? 'pointer' : 'grab'; target = az
      }
      dom.addEventListener('pointerdown', onDown)
      dom.addEventListener('pointermove', onMove)
      dom.addEventListener('pointerup', onUp)
      dom.addEventListener('pointercancel', onUp)
      const onLost = (e) => { e.preventDefault(); visible = false; cancelAnimationFrame(raf) }
      dom.addEventListener('webglcontextlost', onLost)

      const ro = new ResizeObserver(() => {
        const nw = mount.clientWidth, nh = mount.clientHeight
        if (!nw || !nh) return
        renderer.setSize(nw, nh); camera.aspect = nw / nh; camera.updateProjectionMatrix()
      })
      ro.observe(mount)
      const onVis = () => {
        if (document.hidden) { visible = false; cancelAnimationFrame(raf) }
        else if (!disposed) { visible = true; last = performance.now(); raf = requestAnimationFrame(frame) }
      }
      document.addEventListener('visibilitychange', onVis)
      const vio = new IntersectionObserver(es => { visible = es[0].isIntersecting }, { threshold: 0 })
      vio.observe(mount)

      let last = performance.now()
      const frame = (now) => {
        if (disposed) return
        raf = requestAnimationFrame(frame)
        if (!visible) { last = now; return }
        const dt = Math.min(0.05, (now - last) / 1000); last = now

        const cur = activeRef.current
        if (cur !== hovered) { hovered = cur; gotoType(cur) }

        if (morph) {
          morph.t += dt * 1000
          const half = SWITCH_MS / 2
          const k = Math.min(1, morph.t / half)
          if (k < 1) { world.scale.setScalar(1 - k * 0.3); world.rotation.y = k * 0.3; world.position.y = -k * 0.25 }
          else {
            world.remove(model); clearInteractives()
            currentIdx = morph.to; model = builders[currentIdx](); world.add(model)
            const k2 = Math.min(1, (morph.t - half) / half)
            world.scale.setScalar(0.7 + k2 * 0.3); world.rotation.y = (1 - k2) * 0.3; world.position.y = -(1 - k2) * 0.25
            if (k2 >= 1) {
              world.scale.setScalar(1); world.rotation.y = 0; world.position.y = 0
              const next = morph.queued; morph = null
              if (next != null && next !== currentIdx) startMorph(next)
            }
          }
        }

        if (!dragging) {
          if (hovered == null && !morph && !reduce) target += dt * 0.15
          az += (target - az) * (1 - Math.exp(-dt * 4.5))
        }
        camera.position.set(R * Math.sin(polar) * Math.sin(az), R * Math.cos(polar), R * Math.sin(polar) * Math.cos(az))
        camera.lookAt(0, 0.6, 0)
        renderer.render(scene, camera)
      }
      raf = requestAnimationFrame(frame)

      teardown = () => {
        cancelAnimationFrame(raf)
        ro.disconnect(); vio.disconnect()
        document.removeEventListener('visibilitychange', onVis)
        dom.removeEventListener('pointerdown', onDown); dom.removeEventListener('pointermove', onMove)
        dom.removeEventListener('pointerup', onUp); dom.removeEventListener('pointercancel', onUp)
        dom.removeEventListener('webglcontextlost', onLost)
        const geos = new Set(boxCache.values()); cylCache.forEach(g => geos.add(g)); geos.forEach(g => g.dispose())
        Object.values(mats).forEach(m => { if (typeof m !== 'function') m.dispose?.() })
        textures.forEach(t => t.dispose()); envRT.dispose(); renderer.dispose()
        if (dom.parentNode === mount) mount.removeChild(dom)
      }
    }

    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(entries => { if (entries[0].isIntersecting) { boot(); io.disconnect() } }, { rootMargin: '300px 0px' })
      io.observe(mount)
    } else boot()

    return () => { disposed = true; io?.disconnect(); teardown() }
  }, [])

  return (
    <div className="v8-type-house" ref={mountRef}>
      {failed && <div style={{ color: '#666', textAlign: 'center', padding: 40 }}>3D 不可用</div>}
    </div>
  )
}
