import BN from "bn.js";
function toHexString(byteArray: number[]): string {
  return Array.prototype.map
    .call(byteArray, function(byte) {
      return ("0" + (byte & 0xff).toString(16)).slice(-2);
    })
    .join("");
}
/*
function toByteArray(hexString): number[] {
  var result = [];
  for (var i = 0; i < hexString.length; i += 2) {
    result.push(parseInt(hexString.substr(i, 2), 16));
  }
  return result;
}*/

export class BNUtil {
  static fromByteArrayUnsigned(ba: number[]): BN {
    if (!ba.length) {
      return new BN(0, 10);
    }
    return new BN(toHexString(ba), 'hex');
  }
}
