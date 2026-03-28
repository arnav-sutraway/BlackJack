/**
 * Python backend (server.py), default port 8000.
 * Set VITE_API_BASE if the browser cannot use 127.0.0.1 (e.g. phone on LAN testing UI on PC).
 */
const env = import.meta.env.VITE_API_BASE?.trim()

export const API_BASE =
  env !== undefined && env !== ''
    ? env.replace(/\/$/, '')
    : 'http://127.0.0.1:8000'

export const API_HINT = `${API_BASE} (run python server.py in Hacklanta folder)`
