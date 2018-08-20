export class Hello {
  x = ''.push();

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
}
