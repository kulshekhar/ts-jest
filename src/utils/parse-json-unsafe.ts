export default function parseJsonUnsafe<T>(input: string): T {
  return Function('input', `return ${input}\n;`)(input)
}
