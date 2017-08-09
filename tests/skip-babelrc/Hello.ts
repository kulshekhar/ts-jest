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
  }

  public unexcuted(action: () => void = () => {}): void {
    if (action) {
      action();
    } else {
      console.log('unexcuted');
    }
  }
}
