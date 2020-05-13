import createHash from "create-hash";

export class CryptoUtils {
  static SHA256(message: number[]): number[] {
    let buf = createHash("sha256")
      .update(message as any)
      .digest();
    return [...buf];
  }
  // Convert a hex string to a byte array
  static hexToBytes(hex: string): number[] {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
      bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
  }
}
