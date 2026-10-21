import { useCallback, useEffect, useState } from 'react'

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : (JSON.parse(v) as T)
  } catch {
    return fallback
  }
}

/** useState backed by localStorage; re-reads when `key` changes. */
export function useLocal<T>(key: string, init: T): [T, (v: T | ((p: T) => T)) => void] {
  const [v, setV] = useState<T>(() => load(key, init))
  useEffect(() => { setV(load(key, init)) }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = useCallback((n: T | ((p: T) => T)) => {
    setV((p) => {
      const x = typeof n === 'function' ? (n as (p: T) => T)(p) : n
      try { localStorage.setItem(key, JSON.stringify(x)) } catch { /* storage unavailable */ }
      return x
    })
  }, [key])
  return [v, set]
}
