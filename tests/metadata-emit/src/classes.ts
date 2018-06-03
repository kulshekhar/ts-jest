import 'reflect-metadata';

import { OtherClass } from './other-class';

export const CollectMetadata: PropertyDecorator = () => {
  return;
};

export class TestClass {
  @CollectMetadata stringProp: string;

  @CollectMetadata numberProp: number;

  @CollectMetadata booleanProp: boolean;

  @CollectMetadata dateProp: Date;

  @CollectMetadata arrayProp: any[];

  @CollectMetadata genericArrayProp: Array<string | number>;

  @CollectMetadata functionProp: () => void;

  @CollectMetadata classProp: OtherClass;
}
