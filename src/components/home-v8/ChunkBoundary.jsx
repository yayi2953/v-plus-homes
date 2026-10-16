import { Component } from 'react'

/* v8 懒加载分包的错误边界：
   弱网/部署间隙动态 chunk 可能加载失败（旧 HTML 引用已删除的 hash 文件），
   不处理会整页白屏。策略：首次失败自动刷新一次（拿到新 HTML），
   同一会话再次失败则降级渲染备用内容（经典首页），杜绝打不开。 */

const RETRY_KEY = 'viva-v8-chunk-retry'

export default class ChunkBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidMount() {
    // 正常挂载说明本次分包加载成功，清掉历史重试标记
    sessionStorage.removeItem(RETRY_KEY)
  }

  componentDidCatch() {
    if (!sessionStorage.getItem(RETRY_KEY)) {
      sessionStorage.setItem(RETRY_KEY, '1')
      window.location.reload()
      return
    }
    sessionStorage.removeItem(RETRY_KEY)
    // 重载后仍失败：保留 failed，渲染 fallback（调用方传入经典版）
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}
