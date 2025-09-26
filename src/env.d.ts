/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
    readonly VITE_PC_BASE_URL: string
    readonly VITE_LHC_BASE_URL: string
    // 你可以继续定义其他变量
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
