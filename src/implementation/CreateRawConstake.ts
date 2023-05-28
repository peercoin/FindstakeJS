import { JsonRPCClient } from "../implementation/JsonRPCClient";

export class CreateRawCoinStake {
  private client: JsonRPCClient;

  constructor(client: JsonRPCClient) {
    this.client = client;
  }

  async createRawCoinstakeTransaction(
    txid: string,
    vout: number,
    redeemScript: string,
    address: string,
    futureOutput: number,
    futureTimestamp: number,
    minterPubkey: string,
    minterReward: number = 0.0
  ): Promise<string | null> {
    try {
      const pkey = minterPubkey.startsWith("pubkey:")
        ? minterPubkey
        : "pubkey:" + minterPubkey;

      return await this.client.createRawCoinstakeTransaction(
        [{ txid: txid, vout: vout, redeemScript: redeemScript }],
        [
          { Address: pkey, Vout: minterReward },
          { Address: address, Vout: futureOutput },
        ],
        futureTimestamp
      );
    } catch (error) {
      console.error(error);
    }
    return null;
  }
}
