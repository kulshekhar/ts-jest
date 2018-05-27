interface FooInterface {
  foo: string;
  bar: number; //This interface should be stripped and the line numbers should NOT fit in this test.
}

export class Hello {
  constructor() {
    const greeting = `
      this
      is
      a
      multiline
      greeting
    `;

    this.unexcuted(() => {});

    throw new Error('Hello error!');
  }

  public unexcuted(action: () => void = () => {}): void {
    if (action) {
      action();
    } else {
      console.log('unexcuted');
    }
  }
}
