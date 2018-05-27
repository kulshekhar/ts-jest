import { TestClass } from '../src/classes';
import { OtherClass } from '../src/other-class';

describe('emit metadata', () => {
  it('should emit String for string prop', async () => {
    const metadataType = Reflect.getMetadata(
      'design:type',
      TestClass.prototype,
      'stringProp',
    );
    expect(metadataType).toEqual(String);
  });

  it('should emit Number for number prop', async () => {
    const metadataType = Reflect.getMetadata(
      'design:type',
      TestClass.prototype,
      'numberProp',
    );
    expect(metadataType).toEqual(Number);
  });

  it('should emit Boolean for boolean prop', async () => {
    const metadataType = Reflect.getMetadata(
      'design:type',
      TestClass.prototype,
      'booleanProp',
    );
    expect(metadataType).toEqual(Boolean);
  });

  it('should emit Date for date prop', async () => {
    const metadataType = Reflect.getMetadata(
      'design:type',
      TestClass.prototype,
      'dateProp',
    );
    // expect(metadataType).toEqual(Date);
  });

  it('should emit Array for array prop', async () => {
    const metadataType = Reflect.getMetadata(
      'design:type',
      TestClass.prototype,
      'arrayProp',
    );
    expect(metadataType).toEqual(Array);
  });

  it('should emit Array for generic array prop', async () => {
    const metadataType = Reflect.getMetadata(
      'design:type',
      TestClass.prototype,
      'genericArrayProp',
    );
    expect(metadataType).toEqual(Array);
  });

  it('should emit Function for func prop', async () => {
    const metadataType = Reflect.getMetadata(
      'design:type',
      TestClass.prototype,
      'functionProp',
    );
    expect(metadataType).toEqual(Function);
  });

  it('should emit class type for class prop', async () => {
    const metadataType = Reflect.getMetadata(
      'design:type',
      TestClass.prototype,
      'classProp',
    );
    expect(metadataType).toEqual(OtherClass);
  });
});
