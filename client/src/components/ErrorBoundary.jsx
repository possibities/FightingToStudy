import { Component } from 'react';

// 渲染期异常兜底:避免整页白屏,给一个可恢复的友好界面
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="splash error-boundary">
          <div className="card" style={{ textAlign: 'center', maxWidth: 360 }}>
            <h3>⛈️ 营地遇到了一阵风暴</h3>
            <p className="dim">页面出了点小状况,刷新一下就好。</p>
            <button className="btn" onClick={() => window.location.reload()}>重新点火</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
