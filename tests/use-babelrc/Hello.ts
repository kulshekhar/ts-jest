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

  unexcuted(action: () => void = () => {}): void {
    if (action) {
      action();
    } else {
      console.log('unexcuted');
    }
  }
}
