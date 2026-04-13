// Simple dev log singleton — captures messages and notifies listeners
const listeners = []
const logs = []

export function devLog(msg, level = 'info') {
  const entry = {
    time: new Date().toLocaleTimeString(),
    msg: typeof msg === 'object' ? JSON.stringify(msg, null, 2) : String(msg),
    level, // 'info' | 'error' | 'warn'
  }
  logs.push(entry)
  if (logs.length > 100) logs.shift()
  listeners.forEach(fn => fn([...logs]))
}

export function devError(msg) { devLog(msg, 'error') }
export function devWarn(msg)  { devLog(msg, 'warn')  }

export function onDevLog(fn) {
  listeners.push(fn)
  fn([...logs])
  return () => {
    const i = listeners.indexOf(fn)
    if (i > -1) listeners.splice(i, 1)
  }
}
