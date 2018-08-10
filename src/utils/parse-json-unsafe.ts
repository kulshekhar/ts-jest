export default <T>(input: string): T =>
  Function('input', `return ${input}\n;`)(input);
