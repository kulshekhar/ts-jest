export function getWelcomeMessage(username: string): string {
  return `yolo ${username}`
}

function getMessage(username: string): string {
  return getWelcomeMessage(username)
}

export interface Foo {
  bar: number
}

export default getMessage
