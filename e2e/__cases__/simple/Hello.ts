export class Hello {
  constructor(readonly msg: string) {}

  get upper() {
    return this.msg.toUpperCase()
  }
}
