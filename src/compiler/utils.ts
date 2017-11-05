import * as path from 'path';
import * as ts from 'typescript';
import * as fs from 'fs';

// from here: https://github.com/s-panferov/awesome-typescript-loader/blob/master/src/helpers.ts

export interface OutputFile {
  text: string;
  sourceMap?: string;
  declaration?: ts.OutputFile;
}

function statSyncNoException(path: string) {
  try {
    return fs.statSync(path);
  } catch (e) {
    return undefined;
  }
}

function withoutExt(fileName: string): string {
  return path.basename(fileName).split('.')[0];
}

let caseInsensitiveFs: boolean | undefined;

export function isCaseInsensitive() {
  if (typeof caseInsensitiveFs !== 'undefined') {
    return caseInsensitiveFs;
  }

  const lowerCaseStat = statSyncNoException(process.execPath.toLowerCase());
  const upperCaseStat = statSyncNoException(process.execPath.toUpperCase());

  if (lowerCaseStat && upperCaseStat) {
    caseInsensitiveFs =
      lowerCaseStat.dev === upperCaseStat.dev &&
      lowerCaseStat.ino === upperCaseStat.ino;
  } else {
    caseInsensitiveFs = false;
  }

  return caseInsensitiveFs;
}

function compareFileName(first: string, second: string) {
  if (isCaseInsensitive()) {
    return first.toLowerCase() === second.toLowerCase();
  } else {
    return first === second;
  }
}

function isFileEmit(
  fileName: string,
  outputFileName: string,
  sourceFileName: string,
) {
  return (
    compareFileName(sourceFileName, fileName) &&
    // typescript now emits .jsx files for .tsx files.
    (outputFileName.substr(-3).toLowerCase() === '.js' ||
      outputFileName.substr(-4).toLowerCase() === '.jsx')
  );
}

function isSourceMapEmit(
  fileName: string,
  outputFileName: string,
  sourceFileName: string,
) {
  return (
    compareFileName(sourceFileName, fileName) &&
    // typescript now emits .jsx files for .tsx files.
    (outputFileName.substr(-7).toLowerCase() === '.js.map' ||
      outputFileName.substr(-8).toLowerCase() === '.jsx.map')
  );
}

function isDeclarationEmit(
  fileName: string,
  outputFileName: string,
  sourceFileName: string,
) {
  return (
    compareFileName(sourceFileName, fileName) &&
    outputFileName.substr(-5).toLowerCase() === '.d.ts'
  );
}

export function findResultFor(
  fileName: string,
  output: ts.EmitOutput,
): OutputFile {
  let text: string | undefined;
  let sourceMap: string | undefined;
  let declaration: ts.OutputFile | undefined;
  fileName = withoutExt(fileName);

  for (let i = 0; i < output.outputFiles.length; i++) {
    let o = output.outputFiles[i];
    let outputFileName = o.name;
    let sourceFileName = withoutExt(o.name);
    if (isFileEmit(fileName, outputFileName, sourceFileName)) {
      text = o.text;
    }
    if (isSourceMapEmit(fileName, outputFileName, sourceFileName)) {
      sourceMap = o.text;
    }
    if (isDeclarationEmit(fileName, outputFileName, sourceFileName)) {
      declaration = o;
    }
  }
  if (text === undefined) {
    // console.log(text)
    throw new Error('text is undefined');
  }
  return {
    text,
    sourceMap,
    declaration,
  };
}
