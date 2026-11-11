// IV-MTR accepts the numeric IMb, including leading zeroes and optional routing.
export function parseScannedImb(value) {
  const imb = typeof value === "string" ? value.trim() : "";
  if (!/^(?:[0-9]{20}|[0-9]{25}|[0-9]{29}|[0-9]{31})$/.test(imb)) return null;
  const midLength = imb[5] === "9" ? 9 : 6;
  return { imb, mid: imb.slice(5, 5 + midLength) };
}
