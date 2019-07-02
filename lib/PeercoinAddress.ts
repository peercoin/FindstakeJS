import { CryptoUtils } from "./CryptoUtils";
import { Base58 } from "./Base58";

export class PeercoinAddress {
  static networkVersion = 0x37; // Peercoin mainnet

  hash: number[];
  version: number;
  constructor(bytes:any) {
    if ("string" == typeof bytes) {
      bytes = this.decodeString(bytes);
    }
    this.hash = bytes;
    this.version = PeercoinAddress.networkVersion;
  }

  decodeString(str: string) {
    var bytes = Base58.decode(str);
    var hash = bytes.slice(0, 21);
    var checksum = CryptoUtils.SHA256(
      CryptoUtils.SHA256(hash)
    );

    if (
      checksum[0] != bytes[21] ||
      checksum[1] != bytes[22] ||
      checksum[2] != bytes[23] ||
      checksum[3] != bytes[24]
    ) {
      throw "Checksum validation failed!";
    }

    var version = hash.shift();

    if (version != PeercoinAddress.networkVersion) {
      throw "Version " + version + " not supported!";
    }

    return hash;
  }

 // getHashBase64() {
 //   return CryptoUtils.bytesToBase64(this.hash);
 // }

  toString(): string {
    // Get a copy of the hash
    let hash = this.hash.slice(0);

    // Version
    hash.unshift(this.version);
    let checksum = CryptoUtils.SHA256(
      CryptoUtils.SHA256(hash )    
    );
    let bytes = hash.concat(checksum.slice(0, 4));
    return Base58.encode(bytes);
  }
}
