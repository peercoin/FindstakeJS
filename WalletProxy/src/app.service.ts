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
}
