// 通知权限与发送:仅在页面不可见(锁屏/切后台)时弹通知,避免打扰前台用户

export function requestNotify() {
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  } catch { /* 不支持则忽略 */ }
}

export function notify(title, body) {
  try {
    if ('Notification' in window
      && Notification.permission === 'granted'
      && document.visibilityState === 'hidden') {
      new Notification(title, { body, icon: '/icon.svg' });
    }
  } catch { /* 静默 */ }
}
