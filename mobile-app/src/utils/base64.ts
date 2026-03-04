const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const decodeChar = (char: string) => BASE64_CHARS.indexOf(char);

export const decodeBase64ToBytes = (input: string): Uint8Array => {
  const normalized = input.replace(/\s/g, "");
  if (!normalized) {
    return new Uint8Array();
  }

  const bytes: number[] = [];

  for (let i = 0; i < normalized.length; i += 4) {
    const c1 = normalized[i] ?? "A";
    const c2 = normalized[i + 1] ?? "A";
    const c3 = normalized[i + 2] ?? "=";
    const c4 = normalized[i + 3] ?? "=";

    const b1 = decodeChar(c1);
    const b2 = decodeChar(c2);
    const b3 = c3 === "=" ? 0 : decodeChar(c3);
    const b4 = c4 === "=" ? 0 : decodeChar(c4);

    if (b1 < 0 || b2 < 0 || (c3 !== "=" && b3 < 0) || (c4 !== "=" && b4 < 0)) {
      return new Uint8Array();
    }

    const chunk = (b1 << 18) | (b2 << 12) | (b3 << 6) | b4;
    bytes.push((chunk >> 16) & 0xff);

    if (c3 !== "=") {
      bytes.push((chunk >> 8) & 0xff);
    }

    if (c4 !== "=") {
      bytes.push(chunk & 0xff);
    }
  }

  return new Uint8Array(bytes);
};
