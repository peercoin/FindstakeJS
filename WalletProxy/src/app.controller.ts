import {
  Controller,
  Get,
  Res,
  HttpStatus,
  Param,
  NotFoundException,
  Body,
  Put,
  Query,
  Delete,
  Post,
} from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get("difficulty")
  async getDifficulty(): Promise<number> {
    return await this.appService.getDifficulty();
  }
  @Get("block/count")
  async getBlockCount(): Promise<number> {
    return await this.appService.getBlockCount();
  }

  @Get("block/:height")
  async getHash(@Param("height") height: number): Promise<string> {
    return await this.appService.getBlockHashFromHeight(height);
  }

  @Get("block/hash/:hash")
  async getBlockByHash(@Param("hash") hash: string): Promise<any> {
    return await this.appService.getBlockByHash(hash);
  }

  @Get("transaction/raw/:txId")
  async getRawTransaction(@Param("txId") txId: string): Promise<any> {
    console.log('getRawTransaction')
    return await this.appService.getRawTransaction(txId, 0);
  }

  @Get("transaction/decode/:transaction ")
  async getaRawTransaction(
    @Param("transaction") transaction: string
  ): Promise<any> {
    return await this.appService.decodeRawTransaction(transaction);
  }

  @Post("transaction/raw/coinstake")
  async createMessage(
    @Res() response,
    @Body()
    message: {
      txid: string;
      vout: number;
      redeemScript: string;
      address: string;
      futureOutput: number;
      futureTimestamp: number;
      minterPubkey: string;
    }
  ) {
    try {
      console.log(message);
      return await this.appService.createRawCoinstakeTransaction(
        message.txid,
        Number(message.vout),
        message.redeemScript,
        message.address,
        Number(message.futureOutput),
        Number(message.futureTimestamp),
        message.minterPubkey
      );
  
    } catch (error) {
      console.warn(error);
      return response.status(400);
    }
  }
}
