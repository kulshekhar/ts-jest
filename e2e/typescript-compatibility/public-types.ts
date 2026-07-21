import type ts from 'typescript'

import type { ConfigSet, TsCompiler, TsJestAstTransformer, TsJestTransformerOptions } from '../../dist'

declare const configSet: ConfigSet
declare const compiler: TsCompiler
declare const options: TsJestTransformerOptions
declare const transformer: TsJestAstTransformer
declare const sourceFile: ts.SourceFile

void configSet
void compiler
void options
void transformer
void sourceFile
