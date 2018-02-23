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

  @CollectMetadata public functionProp: () => void;

  @CollectMetadata public classProp: OtherClass;
}
