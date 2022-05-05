import { Injectable } from '@nestjs/common';
import { PeercoinRPC, PPCRPC } from 'src/utils/rpc';
 

@Injectable()
export class AppService {
  private readonly rpc: PeercoinRPC;
  
  constructor() { 
    this.rpc = PPCRPC();
  }


  getHello(): string {
    return 'Hello World!';
  }

  async getBlockHashFromHeight(height: number): Promise<string> {
    console.log('test getBlockHashFromHeight:')
    return await this.rpc.getBlockHash(height);
  }
}
