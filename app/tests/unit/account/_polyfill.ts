/*
  本地 polyfill：jsdom 无 ResizeObserver，radix Switch（useSize）在 layout effect 调用它。
  仅作用于 account 测试文件（不改共享 vitest.setup.ts）。
*/
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver =
    ResizeObserverStub as unknown as typeof ResizeObserver;
}
