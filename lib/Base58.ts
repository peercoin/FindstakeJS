import bs58 from "bs58";

function toHexString(byteArray: number[]): string {
  return Array.prototype.map
    .call(byteArray, function(byte) {
      return ("0" + (byte & 0xff).toString(16)).slice(-2);
    })
    .join("");
}

export class Base58 {
  static encode(input: number[]): string {
    const bytes = Buffer.from(toHexString(input), "hex");
    return bs58.encode(bytes);
  }

  static decode(input: string): number[] {
    const buffer = bs58.decode(input);
    return [...buffer];
  }
}
