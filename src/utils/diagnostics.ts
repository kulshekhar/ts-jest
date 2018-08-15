import { DiagnosticTypes, TsJestGlobalOptions, TsJestConfig } from '../types';
import { interpolate, Errors } from './messages';
import { inspect } from 'util';

export const isDiagnosticType = (val: any): val is DiagnosticTypes => {
  return val && DiagnosticTypes[val] === val;
};

export const normalizeDiagnosticTypes = (
  val?: DiagnosticTypes[] | DiagnosticTypes | boolean,
): DiagnosticTypes[] => {
  let res!: DiagnosticTypes[];
  if (typeof val === 'string') {
    // string
    if (isDiagnosticType(val)) {
      res = [val];
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
    res = [
      DiagnosticTypes.global,
      DiagnosticTypes.options,
      DiagnosticTypes.semantic,
      DiagnosticTypes.syntactic,
    ];
  }
  if (!res) {
    throw new TypeError(
      interpolate(Errors.InvalidDiagnosticsOption, { value: inspect(val) }),
    );
  }
  // ensure we have another instance of array with unique items
  return res.filter((item, index) => res.indexOf(item) === index);
};
