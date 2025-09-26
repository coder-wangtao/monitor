1.react 项目调 sdk 的 init 方法，init 监控 sdk，走 sdk 的逻辑

2.如果在 React 项目中使用了 ErrorBoundary，要在 componentDidCatch 中将报错上报给服务器(sdk 提供一个 errorBoundary，拿到报错的信息，就是为了上报报错数据)

<!--
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };c
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    // 在componentDidCatch中将报错上报给服务器
    webSee.errorBoundary(err);
  }
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
-->

3.从 react16 开始，官方提供了 ErrorBoundary 错误边界的功能，被该组件包裹的子组件，render 函数报错时会触发离当前组件最近父组件的 ErrorBoundary 生产环境，一旦被 ErrorBoundary 捕获的错误，不会触发全局的 window.onerror 和 error 事件
