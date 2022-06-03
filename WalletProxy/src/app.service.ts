import { Injectable } from "@nestjs/common";
import { PeercoinRPC, PPCRPC } from "src/utils/rpc";

@Injectable()
export class AppService {
  private readonly rpc: PeercoinRPC;

  constructor() {
    this.rpc = PPCRPC();
  }

  getHello(): string {
    return "Hello World!";
  }
  async getDifficulty(): Promise<number> {
    return await this.rpc.getDifficulty();
  }

  async getBlockCount(): Promise<number> {
    return await this.rpc.getBlockCount();
  }

  async getBlockHashFromHeight(height: number): Promise<string> {
    return await this.rpc.getBlockHash(height);
  }

  async getBlockByHash(hash: string): Promise<object | null> {
    return await this.rpc.getBlock(hash);
  }

  async getRawTransaction(
    hash: string,
    verbose: number
  ): Promise<object | null> {
    return await this.rpc.getRawTransaction(hash, verbose);
  }

  async decodeRawTransaction(transaction: string): Promise<object | null> {
    return await this.rpc.decodeRawTransaction(transaction);
  }

  async createRawCoinstakeTransaction(
    txid: string, //unspent transaction
    vout: number, //index of unspent transaction
    redeemScript: string,
    address: string, // the P2SH addresses, usually a multi-signature addresses
    futureOutput: number, // orginal input + stake reward
    futureTimestamp: number, //unix time
    minterPubkey: string //pubkey of the minter
  ): Promise<string | null> {
    return await this.rpc.createRawCoinstakeTransaction(
      [{ txid: txid, vout: vout, redeemScript: redeemScript }],
      [
        { Address: minterPubkey, Vout: 0 },
        { Address: address, Vout: futureOutput },
      ],
      futureTimestamp
    );
  }
}
