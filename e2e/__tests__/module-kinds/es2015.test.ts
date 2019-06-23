import { runTestForOptions } from './helpers'

const MODULE_KIND = 'es2015'

runTestForOptions({ module: MODULE_KIND })
runTestForOptions({ module: MODULE_KIND, allowSyntheticDefaultImports: false })
runTestForOptions({ module: MODULE_KIND, allowSyntheticDefaultImports: true })
runTestForOptions({ module: MODULE_KIND, esModuleInterop: true })
runTestForOptions({ module: MODULE_KIND, esModuleInterop: false })
