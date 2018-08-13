import { importJson5 } from './imports';

let parse: typeof JSON.parse;

export default function parseJson5(data: string) {
  if (!parse) {
    // try with the built-in JSON.parse but fall back to JSON5 parser
    // this avoids requiring the `json5` module for simple content
    try {
      return JSON.parse(data);
    } catch (err) {}
    parse = importJson5().parse;
  }
  return parse(data);
}
