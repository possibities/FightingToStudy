export function seqRng(values) {
  let i = 0;
  return () => (i < values.length ? values[i++] : values[values.length - 1]);
}
