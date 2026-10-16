import { useEffect, useRef, useState } from 'react'

// 户型索引舞台的 3D 建筑沙盘：四个程序化建筑模型（豪华别墅 / 家庭公寓 / 学生宿舍 / 城市高层）。
// 悬停/聚焦户型行时，当前模型在原地拆解飞散，再错峰飞来组装成对应户型；无悬停时缓慢自转，可拖拽环视。
// 进视口才动态加载 three（独立 chunk），reduced-motion 静默化（瞬切不拆解），WebGL 不可用显 SVG 兜底。

// 每个模型的最佳取景方位角（小弧长切换，各自露出最有辨识度的立面）
const VIEW_ANGLES = [-0.65, -0.4, 0.12, 0.4]
const OUT_MS = 340 // 拆解时长
const IN_MS = 520 // 单部件组装时长
const DELAY_MAX = 200 // 部件错峰上限

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
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
      } catch {
        setFailed(true)
        return
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
      renderer.setSize(w, h)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      // ACES 电影级色调映射：高光不过曝、玻璃反射与暗部层次更接近真实观感
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.05
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab'
      mount.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100)

      // 冷调柔光：半球环境光 + 主向阴影光 + 冷色弱补光（环境贴图在下方纹理工厂中生成）
      scene.add(new THREE.HemisphereLight(0xffffff, 0xd8dae0, 0.9))
      const sun = new THREE.DirectionalLight(0xffffff, 1.9)
      sun.position.set(5, 9, 6)
      sun.castShadow = true
      sun.shadow.mapSize.set(1024, 1024)
      sun.shadow.camera.left = -4.5
      sun.shadow.camera.right = 4.5
      sun.shadow.camera.top = 4.5
      sun.shadow.camera.bottom = -4.5
      sun.shadow.camera.near = 1
      sun.shadow.camera.far = 26
      sun.shadow.bias = -0.0004
      sun.shadow.radius = 3 // PCFSoft 阴影边缘柔化，模拟漫射阳光
      scene.add(sun)
      const fill = new THREE.DirectionalLight(0xdfe4ee, 0.5)
      fill.position.set(-6, 4, -5)
      scene.add(fill)

      // ---- 程序化纹理工厂（Canvas2D 生成，零外部资源）----
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
        t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
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
      // 哑光建筑表面：基色 + 细颗粒 + 少量云斑，配套灰度粗糙度贴图（光照下有真实微差）
      const surface = (size, base, amp, seed, clouds = 7) => {
        const c = document.createElement('canvas')
        c.width = c.height = size
        const ctx = c.getContext('2d')
        const rnd = rnd32(seed)
        ctx.fillStyle = base
        ctx.fillRect(0, 0, size, size)
        noisy(ctx, size, amp, rnd)
        for (let k = 0; k < clouds; k++) {
          const x = rnd() * size, y = rnd() * size, r = size * (0.12 + rnd() * 0.25)
          const gg = ctx.createRadialGradient(x, y, 0, x, y, r)
          gg.addColorStop(0, `rgba(255,255,255,${0.04 + rnd() * 0.05})`)
          gg.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.fillStyle = gg
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
        }
        const rc = document.createElement('canvas')
        rc.width = rc.height = size
        const rctx = rc.getContext('2d')
        const rimg = rctx.createImageData(size, size)
        const r2 = rnd32(seed ^ 0x9e3779b9)
        for (let i = 0; i < rimg.data.length; i += 4) {
          const v = 226 + (r2() - 0.5) * 30
          rimg.data[i] = rimg.data[i + 1] = rimg.data[i + 2] = v
          rimg.data[i + 3] = 255
        }
        rctx.putImageData(rimg, 0, 0)
        return { map: toTex(c, true), rough: toTex(rc, false) }
      }
      const wallS = surface(256, '#eef0f4', 12, 11)
      const blockS = surface(256, '#d6d9e0', 14, 23)
      const slabS = surface(256, '#dadde3', 12, 37)
      const doorS = surface(256, '#3a3d44', 10, 41, 4)
      const leafS = surface(256, '#f2f3ef', 20, 53, 4)
      const trunkS = surface(128, '#f0ede4', 18, 59, 3)
      // 深色镜面玻璃：暗底渐变 + 斜向天空反射亮带 + 细噪，配合 clearcoat 出真实反射层次
      const glassCanvas = document.createElement('canvas')
      glassCanvas.width = glassCanvas.height = 256
      {
        const gctx = glassCanvas.getContext('2d')
        const rnd = rnd32(71)
        const grd = gctx.createLinearGradient(0, 0, 256, 256)
        grd.addColorStop(0, '#2b2f38'); grd.addColorStop(0.5, '#1d2027'); grd.addColorStop(1, '#15171d')
        gctx.fillStyle = grd
        gctx.fillRect(0, 0, 256, 256)
        gctx.save(); gctx.translate(128, 128); gctx.rotate(-0.42)
        const band = (x, w2, a) => {
          const bg = gctx.createLinearGradient(x - w2, 0, x + w2, 0)
          bg.addColorStop(0, 'rgba(255,255,255,0)')
          bg.addColorStop(0.5, `rgba(226,234,246,${a})`)
          bg.addColorStop(1, 'rgba(255,255,255,0)')
          gctx.fillStyle = bg
          gctx.fillRect(x - w2, -400, w2 * 2, 800)
        }
        band(-60, 46, 0.17); band(72, 30, 0.1)
        gctx.restore()
        noisy(gctx, 256, 7, rnd)
      }
      const glassMap = toTex(glassCanvas, true)
      // 展台：中心略深、边缘退浅的径向渐变（与舞台底色自然衔接）
      const plinth = document.createElement('canvas')
      plinth.width = plinth.height = 512
      {
        const pctx = plinth.getContext('2d')
        const pg = pctx.createRadialGradient(256, 256, 40, 256, 256, 252)
        pg.addColorStop(0, '#e1e4ea'); pg.addColorStop(0.72, '#e9ebef'); pg.addColorStop(1, '#f0f1f4')
        pctx.fillStyle = pg
        pctx.fillRect(0, 0, 512, 512)
        noisy(pctx, 512, 6, rnd32(83))
      }
      const groundMap = toTex(plinth, true)
      // 建筑脚下柔和接触阴影（假 AO，补充实时阴影的接地感）
      const contact = document.createElement('canvas')
      contact.width = contact.height = 256
      {
        const sctx = contact.getContext('2d')
        const sg = sctx.createRadialGradient(128, 128, 6, 128, 128, 126)
        sg.addColorStop(0, 'rgba(26,28,34,0.34)')
        sg.addColorStop(0.55, 'rgba(26,28,34,0.13)')
        sg.addColorStop(1, 'rgba(26,28,34,0)')
        sctx.fillStyle = sg
        sctx.fillRect(0, 0, 256, 256)
      }
      const contactMap = toTex(contact, false)
      // 渐变环境贴图：冷白天空 + 地平线微光 + 灰地面，玻璃与金属的反射由此获得方向层次
      const envCanvas = document.createElement('canvas')
      envCanvas.width = 512; envCanvas.height = 256
      {
        const ectx = envCanvas.getContext('2d')
        const eg = ectx.createLinearGradient(0, 0, 0, 256)
        eg.addColorStop(0, '#f7f9fc'); eg.addColorStop(0.32, '#eef2f8'); eg.addColorStop(0.48, '#d9dfea')
        eg.addColorStop(0.53, '#c3c9d4'); eg.addColorStop(0.62, '#abb1bc'); eg.addColorStop(1, '#8b919c')
        ectx.fillStyle = eg
        ectx.fillRect(0, 0, 512, 256)
        const glow = ectx.createRadialGradient(150, 72, 4, 150, 72, 130)
        glow.addColorStop(0, 'rgba(255,255,255,0.85)')
        glow.addColorStop(1, 'rgba(255,255,255,0)')
        ectx.fillStyle = glow
        ectx.fillRect(0, 0, 512, 256)
      }
      const envTex = new THREE.CanvasTexture(envCanvas)
      envTex.mapping = THREE.EquirectangularReflectionMapping
      envTex.colorSpace = THREE.SRGBColorSpace
      textures.push(envTex)
      let envRT
      {
        const pmrem = new THREE.PMREMGenerator(renderer)
        envRT = pmrem.fromEquirectangular(envTex)
        scene.environment = envRT.texture
        pmrem.dispose()
      }

      // 圆形展台（建筑沙盘底座，承接实时阴影，贴图径向渐隐到舞台底色）
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(2.0, 72),
        new THREE.MeshStandardMaterial({ map: groundMap, roughness: 0.96, metalness: 0, envMapIntensity: 0.15 })
      )
      ground.rotation.x = -Math.PI / 2
      ground.receiveShadow = true
      scene.add(ground)
      // 脚下椭圆软阴影：比 shadowMap 更贴地的环境闭塞感
      const contactShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(2.9, 2.1),
        new THREE.MeshBasicMaterial({ map: contactMap, transparent: true, depthWrite: false })
      )
      contactShadow.rotation.x = -Math.PI / 2
      contactShadow.position.y = 0.004
      contactShadow.renderOrder = 1
      scene.add(contactShadow)

      // ---- 共享材质：哑光混凝土墙面 + 清漆镜面玻璃（部分窗室内暖/冷光内透）+ 拉丝金属 ----
      const glassBase = {
        map: glassMap, color: 0xffffff, roughness: 0.09, metalness: 0.08,
        clearcoat: 1, clearcoatRoughness: 0.07, envMapIntensity: 1.6,
      }
      const mats = {
        wall: new THREE.MeshStandardMaterial({ map: wallS.map, roughnessMap: wallS.rough, roughness: 0.95, metalness: 0, envMapIntensity: 0.25 }),
        block: new THREE.MeshStandardMaterial({ map: blockS.map, roughnessMap: blockS.rough, roughness: 0.92, metalness: 0, envMapIntensity: 0.22 }),
        slab: new THREE.MeshStandardMaterial({ map: slabS.map, roughnessMap: slabS.rough, roughness: 0.88, metalness: 0, envMapIntensity: 0.22 }),
        glass: new THREE.MeshPhysicalMaterial(glassBase),
        glassWarm: new THREE.MeshPhysicalMaterial({ ...glassBase, emissive: 0xffe2bd, emissiveIntensity: 0.3 }),
        glassCool: new THREE.MeshPhysicalMaterial({ ...glassBase, emissive: 0xdce8ff, emissiveIntensity: 0.22 }),
        frame: new THREE.MeshStandardMaterial({ color: 0x33363d, roughness: 0.45, metalness: 0.3, envMapIntensity: 0.6 }),
        dark: new THREE.MeshStandardMaterial({ map: doorS.map, roughness: 0.62, metalness: 0.1, envMapIntensity: 0.3 }),
        metal: new THREE.MeshStandardMaterial({ color: 0xa8aab2, roughness: 0.28, metalness: 0.9, envMapIntensity: 1.2 }),
        trunk: new THREE.MeshStandardMaterial({ map: trunkS.map, roughness: 1, metalness: 0, envMapIntensity: 0.15 }),
        leaf: new THREE.MeshStandardMaterial({ map: leafS.map, color: 0x7c8a74, roughness: 1, metalness: 0, envMapIntensity: 0.18 }),
        leaf2: new THREE.MeshStandardMaterial({ map: leafS.map, color: 0x909b83, roughness: 1, metalness: 0, envMapIntensity: 0.18 }),
        bush: new THREE.MeshStandardMaterial({ map: leafS.map, color: 0x85907d, roughness: 1, metalness: 0, envMapIntensity: 0.18 }),
      }

      // ---- 共享几何库：四个模型反复使用的尺寸缓存，morph 换型只换 Mesh 不重建 Geometry ----
      const boxCache = new Map()
      const boxGeo = (w2, h2, d2) => {
        const key = `${w2}x${h2}x${d2}`
        let g = boxCache.get(key)
        if (!g) { g = new THREE.BoxGeometry(w2, h2, d2); boxCache.set(key, g) }
        return g
      }
      const icoCache = new Map()
      const icoGeo = (r) => {
        let g = icoCache.get(r)
        if (!g) { g = new THREE.IcosahedronGeometry(r, 1); icoCache.set(r, g) }
        return g
      }
      const trunkGeo = new THREE.CylinderGeometry(0.045, 0.06, 0.5, 10)

      // 部件注册：记录组装本位 + 拆解/组装两个飞散向量，供 morph 逐帧驱动
      const register = (group, parts, mesh) => {
        mesh.castShadow = true
        mesh.receiveShadow = true
        group.add(mesh)
        const base = mesh.position.clone()
        let rx = base.x
        let rz = base.z
        const hor = Math.hypot(rx, rz)
        if (hor < 0.02) { rx = 0; rz = 1 } else { rx /= hor; rz /= hor }
        const spread = 1.0 + Math.random() * 0.7
        const j = Math.random() * Math.PI * 2
        const out = new THREE.Vector3(
          rx * spread + Math.cos(j) * 0.18,
          0.45 + Math.random() * 0.45,
          rz * spread + Math.sin(j) * 0.18
        )
        const inn = new THREE.Vector3(
          rx * (0.5 + Math.random() * 0.55) + (Math.random() - 0.5) * 0.25,
          1.05 + Math.random() * 0.8,
          rz * (0.5 + Math.random() * 0.55) + (Math.random() - 0.5) * 0.25
        )
        mesh.userData = { base, out, inn, spin: (Math.random() - 0.5) * 0.6, delay: Math.random() * DELAY_MAX }
        parts.push(mesh)
        return mesh
      }

      // 亮窗选择器（确定性种子：同一模型每次 morph 重建，亮窗位置保持一致不闪烁）
      const glassPicker = (seed, litChance = 0.2) => {
        const rnd = rnd32(seed)
        return () => {
          const r = rnd()
          if (r < litChance * 0.62) return 'glassWarm'
          if (r < litChance) return 'glassCool'
          return 'glass'
        }
      }
      const makeBox = (group, parts, w2, h2, d2, x, y, z, mat) => {
        // 仅小块窗玻璃按模型种子随机换成室内暖光/冷光窗；整面玻璃带保持暗反射，避免亮成纸板
        const lit = mat === 'glass' && group.userData.pickGlass && Math.max(w2, h2, d2) < 0.62
        const key = lit ? group.userData.pickGlass() : mat
        const m = new THREE.Mesh(boxGeo(w2, h2, d2), mats[key])
        m.position.set(x, y, z)
        return register(group, parts, m)
      }
      const makeIco = (group, parts, r, x, y, z, mat) => {
        const m = new THREE.Mesh(icoGeo(r), mats[mat])
        m.position.set(x, y, z)
        return register(group, parts, m)
      }
      const makeTrunk = (group, parts, x, z) => {
        const m = new THREE.Mesh(trunkGeo, mats.trunk)
        m.position.set(x, 0.25, z)
        return register(group, parts, m)
      }

      // -------- 模型 0：豪华别墅（错层体块 + 近环绕玻璃 + 露台 + 小树）--------
      const buildVilla = () => {
        const group = new THREE.Group()
        const parts = []
        const b = (...a) => makeBox(group, parts, ...a)
        group.userData.pickGlass = glassPicker(101, 0.3)
        // 一层主体、二层错叠体块、挑檐板
        b(2.5, 0.95, 1.75, 0, 0.475, 0, 'wall')
        b(1.6, 0.82, 1.45, -0.3, 1.36, -0.08, 'block')
        b(2.62, 0.09, 1.88, 0, 0.99, 0, 'slab')
        b(1.86, 0.09, 1.68, -0.3, 1.81, -0.08, 'slab')
        // 玻璃带（细竖挺）/ 门 / 侧窗 / 台阶
        b(1.82, 0.56, 0.05, 0.33, 0.52, 0.895, 'glass')
        b(0.03, 0.58, 0.07, 0.33, 0.52, 0.91, 'frame')
        b(1.26, 0.52, 0.05, -0.13, 1.37, 0.665, 'glass')
        b(0.03, 0.54, 0.07, -0.13, 1.37, 0.68, 'frame')
        b(0.44, 0.7, 0.06, -0.86, 0.35, 0.9, 'dark')
        b(0.05, 0.5, 0.9, -1.27, 0.55, 0.05, 'glass')
        b(0.05, 0.44, 1.0, 0.525, 1.36, -0.05, 'glass')
        b(0.72, 0.07, 0.32, -0.86, 0.035, 1.04, 'slab')
        // 背面与右侧补窗：四个朝向都有可读的立面细节
        b(1.3, 0.5, 0.05, 0.15, 0.52, -0.895, 'glass')
        b(0.03, 0.52, 0.07, 0.15, 0.52, -0.915, 'frame')
        b(0.92, 0.46, 0.05, -0.3, 1.37, -0.83, 'glass')
        b(0.03, 0.48, 0.07, -0.3, 1.37, -0.85, 'frame')
        b(0.05, 0.5, 1.5, 1.275, 0.55, -0.05, 'glass')
        b(0.07, 0.52, 0.03, 1.29, 0.55, -0.05, 'frame')
        // 二层右侧露台：底板 + 细栏杆
        b(0.85, 0.08, 0.85, 0.82, 1.02, 0.28, 'slab')
        const railY = 1.34
        for (const [rx, rz] of [[0.5, 0.6], [1.14, 0.6], [0.5, -0.04], [1.14, -0.04]]) {
          b(0.035, 0.5, 0.035, rx, railY - 0.18, rz, 'metal')
        }
        b(0.7, 0.04, 0.04, 0.82, railY + 0.06, 0.6, 'metal')
        b(0.04, 0.04, 0.68, 0.5, railY + 0.06, 0.28, 'metal')
        // 一株小树 + 两丛灌木
        makeTrunk(group, parts, -1.5, 0.95)
        makeIco(group, parts, 0.3, -1.5, 0.64, 0.95, 'leaf')
        makeIco(group, parts, 0.2, -1.4, 0.82, 0.9, 'leaf2')
        makeIco(group, parts, 0.18, 1.3, 0.14, 0.78, 'bush')
        makeIco(group, parts, 0.16, 1.18, 0.13, -1.12, 'bush')
        return { group, parts }
      }

      // -------- 模型 1：普通家庭住宅（三层板式公寓，规整窗洞 + 朱丽叶阳台栏杆）--------
      const buildApartment = () => {
        const group = new THREE.Group()
        const parts = []
        const b = (...a) => makeBox(group, parts, ...a)
        group.userData.pickGlass = glassPicker(202, 0.22)
        b(2.02, 0.16, 1.36, 0, 0.08, 0, 'block')       // 基座
        b(1.9, 2.0, 1.25, 0, 1.08, 0, 'wall')          // 三层主体
        b(2.0, 0.09, 1.35, 0, 2.12, 0, 'slab')         // 顶板
        b(0.5, 0.32, 0.5, 0.48, 2.32, -0.18, 'block')  // 屋顶楼梯间
        // 正立面：三行两列窗 + 细阳台栏杆
        for (const fy of [0.62, 1.22, 1.82]) {
          for (const fx of [-0.5, 0.5]) {
            b(0.42, 0.55, 0.05, fx, fy, 0.645, 'glass')
            b(0.5, 0.04, 0.12, fx, fy - 0.3, 0.69, 'slab')
            b(0.46, 0.2, 0.025, fx, fy - 0.16, 0.71, 'metal')
          }
        }
        b(0.4, 0.66, 0.06, 0, 0.33, 0.69, 'dark')      // 单元门（略突出基座，避免共面 z-fighting）
        b(0.6, 0.06, 0.2, 0, 0.03, 0.74, 'slab')       // 台阶
        // 侧面与背面窗
        for (const fy of [0.62, 1.22, 1.82]) {
          b(0.05, 0.44, 0.5, -0.965, fy, 0.05, 'glass')
          b(0.05, 0.44, 0.5, 0.965, fy, 0.05, 'glass')
          b(0.5, 0.44, 0.05, -0.45, fy, -0.645, 'glass')
          b(0.5, 0.44, 0.05, 0.45, fy, -0.645, 'glass')
        }
        makeIco(group, parts, 0.16, 1.28, 0.13, 0.9, 'bush')
        makeIco(group, parts, 0.15, -1.3, 0.12, -0.85, 'bush')
        return { group, parts }
      }

      // -------- 模型 2：学生公寓（六层瘦高宿舍楼，密集小窗网格 + 屋顶女儿墙 + 天线）--------
      const buildDorm = () => {
        const group = new THREE.Group()
        const parts = []
        const b = (...a) => makeBox(group, parts, ...a)
        group.userData.pickGlass = glassPicker(103, 0.18)
        b(1.55, 0.16, 1.2, 0, 0.08, 0, 'block')
        b(1.4, 2.55, 1.05, 0, 1.355, 0, 'wall')
        b(1.5, 0.08, 1.15, 0, 2.67, 0, 'slab')
        // 女儿墙四沿
        b(1.5, 0.2, 0.05, 0, 2.82, 0.57, 'wall')
        b(1.5, 0.2, 0.05, 0, 2.82, -0.57, 'wall')
        b(0.05, 0.2, 1.15, -0.73, 2.82, 0, 'wall')
        b(0.05, 0.2, 1.15, 0.73, 2.82, 0, 'wall')
        b(0.38, 0.3, 0.38, -0.35, 2.97, -0.2, 'block') // 屋顶机房
        b(0.025, 0.5, 0.025, 0.35, 3.15, 0.2, 'metal')  // 天线
        // 正背立面 6×3 小窗网格
        for (let r2 = 0; r2 < 6; r2++) {
          const fy = 0.43 + r2 * 0.38
          for (const fx of [-0.42, 0, 0.42]) {
            b(0.28, 0.28, 0.05, fx, fy, 0.545, 'glass')
            b(0.28, 0.28, 0.05, fx, fy, -0.545, 'glass')
          }
          b(0.05, 0.28, 0.28, -0.715, fy, 0.18, 'glass')
          b(0.05, 0.28, 0.28, 0.715, fy, -0.18, 'glass')
        }
        b(0.36, 0.62, 0.06, 0, 0.31, 0.55, 'dark')
        b(0.54, 0.06, 0.18, 0, 0.03, 0.63, 'slab')
        makeIco(group, parts, 0.15, 1.05, 0.12, 0.92, 'bush')
        makeIco(group, parts, 0.15, -1.08, 0.12, 0.85, 'bush')
        return { group, parts }
      }

      // -------- 模型 3：城市公寓（冷灰高层塔楼，横向玻璃带 + 退台顶层）--------
      const buildTower = () => {
        const group = new THREE.Group()
        const parts = []
        const b = (...a) => makeBox(group, parts, ...a)
        group.userData.pickGlass = glassPicker(104, 0.25)
        b(1.62, 0.16, 1.4, 0, 0.08, 0, 'block')
        b(1.5, 2.4, 1.25, 0, 1.32, 0, 'block')         // 冷灰塔楼主体
        b(1.62, 0.09, 1.37, 0, 2.56, 0, 'slab')
        b(0.95, 0.42, 0.85, 0, 2.8, 0, 'wall')          // 退台顶层
        b(1.07, 0.08, 0.97, 0, 3.05, 0, 'slab')
        // 首层大堂玻璃 + 入口
        b(1.1, 0.75, 0.06, 0, 0.45, 0.65, 'glass')
        b(0.34, 0.7, 0.08, 0, 0.38, 0.68, 'dark')
        // 四层横向玻璃带 + 层间挑线 + 侧/背窗
        for (const fy of [1.05, 1.42, 1.79, 2.16]) {
          b(1.15, 0.26, 0.05, 0, fy, 0.645, 'glass')
          b(0.03, 0.28, 0.07, 0, fy, 0.67, 'frame')
          b(1.52, 0.04, 0.06, 0, fy - 0.22, 0.65, 'slab')
          b(1.0, 0.26, 0.05, 0, fy, -0.645, 'glass')
          b(0.05, 0.26, 0.8, -0.765, fy, 0.05, 'glass')
          b(0.05, 0.26, 0.8, 0.765, fy, 0.05, 'glass')
        }
        b(0.7, 0.24, 0.05, 0, 2.82, 0.445, 'glass')
        makeIco(group, parts, 0.16, 1.15, 0.13, 0.95, 'bush')
        makeIco(group, parts, 0.15, -1.2, 0.12, -0.9, 'bush')
        return { group, parts }
      }

      const builders = [buildVilla, buildApartment, buildDorm, buildTower]

      // 模型容器：入场缩放在 world 上，模型拆换在其内部
      const world = new THREE.Group()
      scene.add(world)
      let currentIdx = 0
      let model = builders[0]()
      world.add(model.group)

      const easeOutBack = (k) => {
        const c1 = 1.4
        const c3 = c1 + 1
        return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2)
      }
      const poseOut = (m2, k) => {
        const u = m2.userData
        const e = k * k
        m2.position.copy(u.base).addScaledVector(u.out, e)
        m2.scale.setScalar(Math.max(0.04, 1 - 0.96 * e))
        m2.rotation.y = u.spin * k
      }
      const poseIn = (m2, k) => {
        const u = m2.userData
        const settle = 1 - Math.pow(1 - k, 3)
        m2.position.copy(u.base).addScaledVector(u.inn, 1 - settle)
        m2.scale.setScalar(0.05 + 0.95 * easeOutBack(k))
        m2.rotation.y = u.spin * (1 - k)
      }

      // 拆解/组装状态机：out 全部飞散 → 换模型 → in 错峰飞来组装；快速划过行时用 queued 兜底到最后目标
      let morph = null
      const startMorph = (idx) => {
        if (idx === currentIdx) return
        if (morph) { morph.queued = idx; return }
        morph = { phase: 'out', t: 0, to: idx, queued: null }
      }

      // ---- 视角控制：自研最小轨道（azimuth/polar + 阻尼），不引 OrbitControls ----
      const R = 9.0
      let az = VIEW_ANGLES[0]
      let polar = 1.27
      let target = az
      let dragging = false
      let lastX = 0
      let lastY = 0
      let hovered = activeRef.current
      let visible = true
      let intro = reduce ? 1 : 0

      const snapFor = (idx) => {
        const base = VIEW_ANGLES[idx]
        return base + Math.round((az - base) / (Math.PI * 2)) * Math.PI * 2
      }
      const gotoType = (idx) => {
        if (idx == null || dragging) return
        target = snapFor(idx)
        if (reduce) {
          // 减弱动态：模型瞬切、视角瞬到
          world.remove(model.group)
          currentIdx = idx
          model = builders[idx]()
          world.add(model.group)
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
        az -= (e.clientX - lastX) * 0.007
        polar = Math.min(1.42, Math.max(0.6, polar + (e.clientY - lastY) * 0.005))
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

        // morph 推进
        if (morph) {
          morph.t += dt * 1000
          if (morph.phase === 'out') {
            const k = Math.min(1, morph.t / OUT_MS)
            for (const m2 of model.parts) poseOut(m2, k)
            if (k >= 1) {
              world.remove(model.group)
              currentIdx = morph.to
              model = builders[currentIdx]()
              world.add(model.group)
              for (const m2 of model.parts) poseIn(m2, 0)
              morph.phase = 'in'
              morph.t = 0
            }
          } else {
            for (const m2 of model.parts) {
              const k = Math.min(1, Math.max(0, (morph.t - m2.userData.delay) / IN_MS))
              poseIn(m2, k)
            }
            if (morph.t >= IN_MS + DELAY_MAX) {
              for (const m2 of model.parts) poseIn(m2, 1)
              const next = morph.queued
              morph = null
              if (next != null && next !== currentIdx) startMorph(next)
            }
          }
        }

        if (!dragging) {
          // 拆解/组装期间停住自转，相机仍阻尼转到该户型取景角
          if (hovered == null && !morph && !reduce) target += dt * 0.22
          az += (target - az) * (1 - Math.exp(-dt * 5))
        }
        camera.position.set(
          R * Math.sin(polar) * Math.sin(az),
          R * Math.cos(polar),
          R * Math.sin(polar) * Math.cos(az)
        )
        camera.lookAt(0, 0.85, 0)

        if (intro < 1) {
          // 入场轻抬升落定
          intro = Math.min(1, intro + dt / 0.9)
          const k = 1 - Math.pow(1 - intro, 3)
          world.scale.setScalar(0.92 + 0.08 * k)
          world.position.y = (1 - k) * 0.14
        }
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
        // 共享几何/材质去重后各释放一次
        const geos = new Set(boxCache.values())
        geos.add(trunkGeo)
        icoCache.forEach((g) => geos.add(g))
        geos.add(ground.geometry)
        geos.add(contactShadow.geometry)
        geos.forEach((g) => g.dispose())
        const matsAll = new Set(Object.values(mats))
        matsAll.add(ground.material)
        matsAll.add(contactShadow.material)
        matsAll.forEach((m2) => m2.dispose())
        textures.forEach((t) => t.dispose())
        envRT?.dispose()
        renderer.dispose()
        if (dom.parentNode === mount) mount.removeChild(dom)
      }
    }

    // 进视口前不加载 three（约 192KB gzip）
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
        <svg className="v8-type-house-fb" viewBox="0 0 120 120" aria-hidden="true">
          <ellipse cx="60" cy="94" rx="40" ry="9" fill="#e7e8ec" />
          <g fill="none" stroke="#b6b8c0" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
            <path d="M32 62h44v28H32z" fill="#eef0f3" />
            <path d="M52 48l26 14H46z" fill="#e2e4e9" />
            <path d="M76 58h14v32H76z" fill="#e6e8ed" />
            <path d="M50 90V78h10v12" />
            <path d="M38 70h8v8h-8zM80 66h6v8h-6z" />
          </g>
        </svg>
      )}
    </div>
  )
}
