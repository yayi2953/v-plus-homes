import { useEffect, useRef } from 'react'

// 户型舞台：自动播放本地实拍视频（静音循环），每个户型对应不同室内视频。

const VIDEOS = [
  { src: '/videos/luxury.mp4' },
  { src: '/videos/standard.mp4' },
  { src: '/videos/student.mp4' },
  { src: '/videos/city.mp4' },
]

export default function TypeHouse({ activeIndex }) {
  const videoRef = useRef(null)
  const idx = activeIndex ?? 0

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.load()
    v.play().catch(() => {})
  }, [idx])

  const v = VIDEOS[idx] || VIDEOS[0]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 4, background: '#000' }}>
      <video
        ref={videoRef}
        key={idx}
        src={v.src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      >
        您的浏览器不支持视频播放。
      </video>
    </div>
  )
}
