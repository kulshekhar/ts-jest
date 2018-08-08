import { echo } from '../src/echo';

describe('echo', () => {
  it('echoes', () => {
    console.log('WITHIN TEST');
    expect(echo('repeat')).toEqual('repeat');
  });
});
