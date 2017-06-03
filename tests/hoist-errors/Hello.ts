interface FooInterface {
  foo: string,
  bar: number, //This interface should be stripped and the line numbers should still fit.
}

export const foo = () => {
  console.log('foo');
};

export class Hello {
  constructor() {
    const greeting = `
      this
      is
      a
      multiline
      greeting
    `;

    this.unexcuted(() => { });

    throw new Error('Hello error!');
  }

  public unexcuted(action: () => void = () => { }): void {
    if (action) {
      action();
    } else {
      console.log('unexcuted');
    }
  }
}
