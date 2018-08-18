import { Hello } from '../Hello-should-NOT-diagnose';
import { Hello as Hello2 } from './Hello-should-diagnose';

describe('Hello Class', () => {
  it('should throw an error', () => {
    const hello = new Hello();
    const hello2 = new Hello2();
  });
});
