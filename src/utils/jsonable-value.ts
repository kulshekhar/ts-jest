import { stringify } from './json'

/**
 * @internal
 */
export class JsonableValue<V = any> {
  private _serialized!: string
  private _value!: V

  constructor(value: V) {
    this.value = value
  }

  set value(value: V) {
    this._value = value
    this._serialized = stringify(value)
  }

  get value(): V {
    return this._value
  }

  get serialized(): string {
    return this._serialized
  }

  valueOf(): V {
    return this._value
  }

  toString(): string {
    return this._serialized
  }
}
