export const omitLeadingWhitespace = (text: string): string => {
  return text.replace(/^\s+/gm, '')
}

export const dedent = (strings: TemplateStringsArray, ...values: unknown[]) => {
  let joinedString = ''
  for (let i = 0; i < values.length; i++) {
    joinedString += `${strings[i]}${values[i]}`
  }
  joinedString += strings[strings.length - 1]

  return omitLeadingWhitespace(joinedString)
}
