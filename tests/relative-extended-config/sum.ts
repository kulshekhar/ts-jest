export function sum(...numbers: number[]) {
  return numbers.reduce((total, next) => total + next, 0);
}
