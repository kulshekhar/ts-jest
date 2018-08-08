export function echo(shout: string) {
  console.log('WITHIN SOURCE');
  if (process.env.__FORCE_FAIL) {
    throw new Error('WITHIN SOURCE');
  }
  return shout;
}
