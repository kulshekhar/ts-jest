export const getWelcomeMessage = (): string => 'Welcome to ts-jest!!!'

import { FileHandle, open } from 'fs/promises'

// @ts-expect-error testing
Symbol['asyncDispose'] ??= Symbol("Symbol.asyncDispose");

class DisposableFileHandle {
  private fileHandle: FileHandle

  private constructor(fileHandle: FileHandle) {
    this.fileHandle = fileHandle
  }

  static async open(filePath: string): Promise<DisposableFileHandle> {
    const fileHandle = await open(filePath, 'r')

    return new DisposableFileHandle(fileHandle)
  }

  async readFile(encoding: BufferEncoding): Promise<string> {
    return this.fileHandle.readFile({ encoding })
  }

  [Symbol.asyncDispose] = async () => {
    await this.fileHandle.close()
  }
}

export async function processFile(filePath: string) {
  // eslint-disable-next-line prettier/prettier
  await using fileHandle = await DisposableFileHandle.open(filePath)

  return await fileHandle.readFile('utf-8')
}
