import { createContext, useContext } from 'react'

export const InstallContext = createContext({ canInstall: false, promptInstall: async () => {} })

export function useInstall() {
  return useContext(InstallContext)
}
