import { DiagnosticTypes, DiagnosticSets, diagnosticSets } from './types';

export const isDiagnosticType = (val: any): val is DiagnosticTypes => {
  return val && DiagnosticTypes[val] === val;
};

export const isDiagnosticSet = (val: any): val is DiagnosticSets => {
  return val && DiagnosticSets[val] === val;
};

export const normalizeDiagnosticTypes = (
  val?: DiagnosticTypes[] | DiagnosticTypes | DiagnosticSets | boolean,
): DiagnosticTypes[] => {
  let res!: DiagnosticTypes[];
  if (typeof val === 'string') {
    // string
    if (isDiagnosticType(val)) {
      res = [val];
    } else if (isDiagnosticSet(val)) {
      res = diagnosticSets[val];
    }
  } else if (Array.isArray(val)) {
    // array
    if (val.every(isDiagnosticType)) {
      res = val;
    }
  } else if (!val) {
    // undeifned or false
    res = [];
  } else if (val) {
    // true
    res = diagnosticSets.default;
  }
  if (!res) {
    throw new TypeError(`Invalid value for diagnostics: ${val}.`);
  }
  // ensure we have another instance of array with unique items
  return res.filter((item, index) => res.indexOf(item) === index);
};
