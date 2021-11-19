import type { testing } from 'bs-logger'

import { rootLogger } from '../utils'

export const logTargetMock = (): testing.LogTargetMock => (rootLogger as testing.LoggerMock).target

export const mockObject = <T, M>(obj: T, newProps: M): T & M & { mockRestore: () => T } => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const backup: Record<string, any> = Object.create(null)

  Object.keys(newProps).forEach((key) => {
    const desc = (backup[key] = Object.getOwnPropertyDescriptor(obj, key))
    const newDesc: Record<string, unknown> = { ...desc }
    if (newDesc.get) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newDesc.get = () => (newProps as any)[key]
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newDesc.value = (newProps as any)[key]
    }
    Object.defineProperty(obj, key, newDesc)
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((obj as any).mockRestore) backup.mockRestore = Object.getOwnPropertyDescriptor(obj, 'mockRestore')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.defineProperty(obj as any, 'mockRestore', {
    value() {
      Object.keys(backup).forEach((key) => {
        Object.defineProperty(obj, key, backup[key])
      })

      return obj
    },
    configurable: true,
  })
}

interface MockWriteStream {
  written: string[]
  write(text: string): void
  clear(): void
}

export const mockWriteStream = (): MockWriteStream => ({
  written: [] as string[],
  write(text: string): void {
    this.written.push(text)
  },
  clear(): void {
    this.written = []
  },
})
