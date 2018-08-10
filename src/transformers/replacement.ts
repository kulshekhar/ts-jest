// see tslint: https://github.com/palantir/tslint/blob/master/src/language/rule/rule.ts

export default class Replacement {
  constructor(
    readonly start: number,
    readonly length: number,
    readonly text: string,
  ) {}

  get end() {
    return this.start + this.length;
  }

  apply(content: string) {
    return (
      content.substring(0, this.start) +
      this.text +
      content.substring(this.start + this.length)
    );
  }
}
