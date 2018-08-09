export default function(path: string): string {
  const dotIndex = path.lastIndexOf('.');
  return path.substr(dotIndex + 1);
}
