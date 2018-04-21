import 'reflect-metadata';

import { OtherClass } from './other-class';

export const CollectMetadata: PropertyDecorator = () => {
  return;
};

export class TestClass {
  @CollectMetadata public stringProp: string;

  @CollectMetadata public numberProp: number;

  @CollectMetadata public booleanProp: boolean;

  @CollectMetadata public dateProp: Date;

  @CollectMetadata public arrayProp: any[];

  @CollectMetadata public genericArrayProp: Array<string | number>;

  @CollectMetadata public functionProp: () => void;

  @CollectMetadata public classProp: OtherClass;
}
