import _closestPackageJson from '../closest-package-json';
import { TPackageJson } from '../../types';

// tslint:disable-next-line:variable-name
export const __byPath: Record<string, TPackageJson> = {};
// tslint:disable-next-line:variable-name
export const __default: TPackageJson = { name: 'mock' };

const closestPackageJson: typeof _closestPackageJson = (
  fromPath: string,
  asString: boolean = false,
) => {
  const res = fromPath in __byPath ? __byPath[fromPath] : __default;
  return (asString ? JSON.stringify(res) : res) as any;
};

export default closestPackageJson;
