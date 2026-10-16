import { useEffect, useRef } from 'react'

// 户型舞台：自动播放视频（静音循环），每个户型对应不同的室内实拍视频。
// 视频加载失败时回退到封面图。

const VIDEOS = [
  // 豪华住宅 — 豪宅/顶层公寓室内
  {
    src: 'https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_24fps.mp4',
    poster: '/images/listing-penthouse.jpg',
  },
  // 普通住宅 — 家庭住宅室内
  {
    src: 'https://videos.pexels.com/video-files/7562693/7562693-hd_1920_1080_25fps.mp4',
    poster: '/images/listing-family.jpg',
  },
  // 学生公寓 — 小户型
  {
    src: 'https://videos.pexels.com/video-files/4761427/4761427-uhd_2560_1440_25fps.mp4',
    poster: '/images/listing-student1.jpg',
  },
  // 城市公寓 — 现代公寓
  {
    src: 'https://videos.pexels.com/video-files/2784642/2784642-hd_1920_1080_24fps.mp4',
    poster: '/images/listing-urban1.jpg',
  },
]

export default function TypeHouse({ activeIndex }) {
  const videoRef = useRef(null)
  const idx = activeIndex ?? 0

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.load()
    v.play().catch(() => { /* 自动播放被阻止时静默处理 */ })
  }, [idx])

  const v = VIDEOS[idx] || VIDEOS[0]

  return (
    <div className="v8-type-house" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 12, background: '#000' }}>
      <video
        ref={videoRef}
        key={idx}
        src={v.src}
        poster={v.poster}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      >
        您的浏览器不支持视频播放。
      </video>
    </div>
  )
}
