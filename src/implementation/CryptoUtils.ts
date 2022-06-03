import baseX from "base-x";
import { bech32, Decoded } from "bech32";
import sha256 from "fast-sha256";
import BN from "bn.js";

const base58 = baseX(
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
);

function arraybufferEqual(buf1: Uint8Array, buf2: Uint8Array) {
  if (buf1 === buf2) {
    return true;
  }

  if (buf1.byteLength !== buf2.byteLength) {
    return false;
  }

  let i = buf1.byteLength;
  while (i--) {
    if (buf1[i] !== buf2[i]) {
      return false;
    }
  }

  return true;
}

var Network = {} as any;

(function (Network) {
  Network["mainnet"] = "mainnet";
  Network["testnet"] = "testnet";
  //Network["regtest"] = "regtest";
})(Network || (Network = {}));

var AddressType = {} as any;

(function (AddressType) {
  AddressType["p2pkh"] = "p2pkh";
  AddressType["p2sh"] = "p2sh";
  AddressType["p2wpkh"] = "p2wpkh";
  AddressType["p2wsh"] = "p2wsh";
})(AddressType || (AddressType = {}));

const addressTypes = {
  55: {
    type: AddressType.p2pkh,
    network: Network.mainnet,
  },
  111: {
    type: AddressType.p2pkh,
    network: Network.testnet,
  },
  117: {
    type: AddressType.p2sh,
    network: Network.mainnet,
  },
  196: {
    type: AddressType.p2sh,
    network: Network.testnet,
  },
};

const parseBech32 = (address: string) => {
  let decoded = null as Decoded | null;
  try {
    decoded = bech32.decode(address);
  } catch (error) {
    throw new Error("Invalid address");
  }
  const mapPrefixToNetwork = {
    pc: Network.mainnet,
    tpc: Network.testnet,
    //bcrt: Network.regtest,
  };
  let nw = decoded.prefix;
  const network = nw === "pc" ? mapPrefixToNetwork.pc : mapPrefixToNetwork.tpc;
  if (network === undefined) {
    throw new Error("Invalid address");
  }
  const witnessVersion = decoded.words[0];
  if (witnessVersion < 0 || witnessVersion > 16) {
    throw new Error("Invalid address");
  }
  const data = bech32.fromWords(decoded.words.slice(1));
  const type = data.length === 20 ? AddressType.p2wpkh : AddressType.p2wsh;
  return {
    bech32: true,
    network,
    address,
    type,
  };
};

const getAddressInfo = (address: string) => {
  let decoded = null as Uint8Array | null;

  const prefix = address.substring(0, 2).toLowerCase();
  if (prefix === "pc" || prefix === "tp") {
    return parseBech32(address);
  }
  try {
    decoded = base58.decode(address);
  } catch (error) {
    throw new Error("Invalid address");
  }
  const { length } = decoded;
  if (length !== 25) {
    throw new Error("Invalid address");
  }
  const version = decoded[0]; //.readUInt8(0);

  const checksum = decoded.slice(length - 4, length);
  const body = decoded.slice(0, length - 4);
  const expectedChecksum = sha256(sha256(body)).slice(0, 4);

  if (!arraybufferEqual(checksum, expectedChecksum)) {
    throw new Error("Invalid address");
  }
  const validVersions = Object.keys(addressTypes).map(Number);
  if (!validVersions.includes(version)) {
    throw new Error("Invalid address");
  }

  switch (version) {
    case 55:
      return Object.assign(Object.assign({}, addressTypes[55]), {
        address,
        bech32: false,
      });
      break;
    case 111:
      return Object.assign(Object.assign({}, addressTypes[111]), {
        address,
        bech32: false,
      });
      break;
    case 117:
      return Object.assign(Object.assign({}, addressTypes[117]), {
        address,
        bech32: false,
      });
      break;
    case 196:
      return Object.assign(Object.assign({}, addressTypes[196]), {
        address,
        bech32: false,
      });
      break;
  }
};

const validate = (address: string, network: string) => {
  try {
    const addressInfo = getAddressInfo(address) as any;
    if (network) {
      return network === addressInfo.network;
    }
    return true;
  } catch (error) {
    return false;
  }
};

export class CryptoUtils {
  static SHA256(message: Uint8Array): Uint8Array {
    return sha256(message);
  }

  static isValidAddress(address: string, networkType: string = "prod") {
    if (networkType === "prod") {
      return validate(address, Network["mainnet"]);
    }

    return (
      validate(address, Network["mainnet"]) ||
      validate(address, Network["testnet"])
    );
  }

  // Convert a hex string to a byte array
  static hexToBytes(hex: string): number[] {
    const bytes = [];
    for (let c = 0; c < hex.length; c += 2)
      bytes.push(parseInt(hex.substring(c, c + 2), 16));
    return bytes;
  }

  static toHexString(byteArray: number[] | Uint8Array): string {
    return Array.prototype.map
      .call(byteArray, (byte) => {
        return ("0" + (byte & 0xff).toString(16)).slice(-2);
      })
      .join("");
  }

  static fromByteArrayUnsigned(ba: number[] | Uint8Array): BN {
    if (!ba.length) {
      return new BN(0, 10);
    }
    return new BN(CryptoUtils.toHexString(ba), "hex");
  }
}
