// @ts-expect-error testing purpose
import babelFooCfg from './babel-foo.config'
import { getFoo, getFooBar } from './thing1'
import { getBar } from './thing2'

getFoo('foo')
getBar('bar')
getFooBar('foobar')
getFoo(JSON.stringify(babelFooCfg.presets))
