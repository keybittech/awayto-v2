export function charCount(chars) {
  let count = 0;
  for (let i = 0; i < chars.length; i++) {
    count += chars.charCodeAt(i);
  }
  return count;
}