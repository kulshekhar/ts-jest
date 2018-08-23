export interface OnExitHandlerOptions {
  cleanExit: boolean
  exitCode?: number
  signal?: string
  error?: Error
}

interface InternalExitHandlerOptions {
  exitCode?: number
  cleanExit?: boolean
  signal?: string
  error?: Error
  exitWithCode?: number
}

let installed: boolean = false
/**
 * @see https://stackoverflow.com/a/14032965/1603618
 * @param callback Called when the program exists
 */
export function install(callback: (opt: OnExitHandlerOptions) => void) {
  if (installed) throw new Error(`On exit already installed.`)
  installed = true

  function exitHandler({
    exitCode,
    error,
    signal,
    cleanExit = false,
    exitWithCode,
  }: InternalExitHandlerOptions = {}) {
    try {
      callback({ error, exitCode, cleanExit, signal })
    } catch (err) {}
    if (exitWithCode) {
      process.exit(exitCode)
    }
  }

  // do something when app is closing
  process.on('exit', exitCode => exitHandler({ exitCode, cleanExit: true }))
  // catches ctrl+c event
  process.on('SIGINT', () => exitHandler({ signal: 'SIGINT', exitWithCode: 1 }))
  //  catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', () =>
    exitHandler({ signal: 'SIGUSR1', exitWithCode: 1 }),
  )
  process.on('SIGUSR2', () =>
    exitHandler({ signal: 'SIGUSR2', exitWithCode: 1 }),
  )
  // catches uncaught exceptions
  process.on('uncaughtException', error => exitHandler({ error }))
}
