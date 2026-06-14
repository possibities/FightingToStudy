// 动效是否应被抑制的唯一来源:由 MotionProvider 维护 <html>.reduce-motion 类。
// JS 驱动的动效(星尘拖尾/结算天光/数字滚动)读这里,与 CSS 保持一致。
export function reduceMotion() {
  return document.documentElement.classList.contains('reduce-motion');
}
