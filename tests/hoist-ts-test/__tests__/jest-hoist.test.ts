import * as path from 'path';
import {
  SomeClass,
  SomeFunctionDeclaredAsConst,
  SomeFunction,
} from '../src/things-to-mock';

jest.mock('../src/things-to-mock');
jest.mock('path');

describe('Global mocks', () => {
  it('A global var should be mocked when the jest.mock call is underneath', () => {
    expect((path.basename as any).mock).toBeDefined();
  });
});

describe('Local mocks', () => {
  it('Jest should be able to mock a local class', () => {
    expect((SomeClass as any).mockReturnValue).toBeDefined();
  });

  it('Jest should be able to mock a local class', () => {
    expect((SomeFunction as any).mockReturnValueOnce).toBeDefined();
  });

  it('Jest should be able to mock a local class', () => {
    expect(
      (SomeFunctionDeclaredAsConst as any).mockImplementation,
    ).toBeDefined();
  });
});
