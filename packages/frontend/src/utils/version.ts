declare const __APP_VERSION__: string
declare const __APP_BUILD_DATE__: string

export const APP_VERSION = __APP_VERSION__
export const APP_BUILD_DATE = __APP_BUILD_DATE__

// VITE_GIT_COMMIT is set via Railway variable: VITE_GIT_COMMIT=${{RAILWAY_GIT_COMMIT_SHA}}
export const APP_COMMIT = (import.meta.env.VITE_GIT_COMMIT as string | undefined)?.slice(0, 7) ?? null
