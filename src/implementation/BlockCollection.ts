import axios from "axios";

const Coin = 1000000; //	1 PPC = 1.000 mPPC
export interface IBlock {
  hash: string;
  confirmations: number;
  version: number;
  height: number;
  tx: Array<string>;
  time: number;
  modifier: string;
}

export class Block {
  hash: string;
  height: number;
  time: number;

  Transactions: Array<Transaction>;

  constructor(block: IBlock) {
    this.hash = block.hash;
    this.height = block.height;
    this.time = block.time;

    this.Transactions = [];
  }

  addTransaction(transaction: Transaction) {
    if (!this.Transactions.find((t) => t.txid === transaction.txid)) {
      this.Transactions.push(transaction);
    }
  }

  getTransaction(txid: string): null | Transaction {
    const transaction = this.Transactions.find((t) => t.txid === txid);
    return transaction || null;
  }
}

// export interface IRawTransaction {
//   hex: string;

//   blocktime: number;
//   blockhash: string;
// }

export interface Output {
  value: number;
  n: number;
}
export class UTXO {
  Id: string;
  n: number;
  units: number;
  constructor(txid: string, n: number, txoutvalue: number) {
    this.Id = "to" + txid + "_" + n;
    this.n = n;
    this.units = parseInt("" + Math.round(txoutvalue * Coin), 10);
  }
}
export interface ITransaction {
  txid: string;

  version: number;
  time: number | null; //as of version 3 this is omitted
  vout: Array<Output>;
}

export class Transaction {
  txid: string;
  positionInBlock: number;
  time: number; // this is either blocktime or the old txtime is provided
  offset: number;
  blockheight: number;
  vout: Array<UTXO>;

  constructor(
    blockheight: number,
    txid: string,
    positionInBlock: number,
    time: number,
    offset: number,
    vout: Array<Output>
  ) {
    //this.Id = "to" + txid + "_" + vout;
    this.txid = txid;
    this.positionInBlock = positionInBlock;
    this.time = time;
    this.offset = offset;
    this.blockheight = blockheight;
    this.vout = vout.map((v) => new UTXO(txid, v.n, v.value));
  }
}

export class BlockCollection {
  url: string;
  BlockHeaderSize = 80;

  Blocks: Array<Block> = [];

  constructor(url: string) {
    this.url = url;
  }

  async getBlock(hash: string): Promise<Block> {
    let block = this.Blocks.find((b) => b.hash === hash) || null;

    if (!block) {
      block = await this.getAndParseBlock(hash);
      if (!!block) {
        this.Blocks.push(block);
        return block!;
      }
    }

    return block!;
  }

  getTransaction(txid: string): Transaction | null {
    for (let index = 0; index < this.Blocks.length; index++) {
      const block = this.Blocks[index];
      const transaction = block.Transactions.find((t) => t.txid === txid);
      if (!!transaction) return transaction;
    }
    return null;
  }

  //   getTransactionUTXO(txid: string, vout: number): UTXO | null {
  //     for (let index = 0; index < this.Blocks.length; index++) {
  //       const block = this.Blocks[index];
  //       const transaction = block.getTransactionUTXO(txid, vout);
  //       if (!!transaction) return transaction;
  //     }
  //     return null;
  //   }

  async getAndParseBlock(hash: string): Promise<Block | null> {
    let blck = await this.getBlockByHash(hash);
    if (!blck) return null;

    let block = new Block(blck);
    var sizeVarintTx = this.getSizeVarInt(blck.tx.length);
    let offset = this.BlockHeaderSize + sizeVarintTx;

    for (let index = 0; index < blck.tx.length; index++) {
      const transactionid = blck.tx[index];
      const hex = await this.getRawTransaction(transactionid);

      if (!hex)
        throw (
          "unable to get raw transaction " +
          transactionid +
          " of height " +
          block.height
        );
      const txraw = await this.getDecodedTransaction(hex);
      if (!txraw) throw "unable to get getDecodedTransaction " + hex;

      if (!this.isEven(hex.length)) throw hex + " is not even";

      const rawsize = hex.length / 2; //1 byte is 2 char
      let time = !!txraw.time ? txraw.time : block.time; // use blocktime if txtime is nt available
      block.addTransaction(
        new Transaction(
          block.height,
          transactionid,
          index,
          time,
          offset,
          txraw.vout
        )
      );

      offset += rawsize;
    }

    return block;
  }

  isEven(n: number): boolean {
    return n % 2 == 0;
  }

  private async getBlockByHash(hash: string): Promise<IBlock | null> {
    try {
      if (!hash) return null;
      return (
        await axios.get(this.url + "/block/hash/" + hash, null || undefined)
      ).data;
    } catch (error) {
      console.error(error);
    }
    return null;
  }

  private async getRawTransaction(txId: string): Promise<string | null> {
    try {
      if (!txId) return null;
      return (
        await axios.get(
          this.url + "/transaction/raw/" + txId,
          null || undefined
        )
      ).data;
    } catch (error) {
      console.error(error);
    }
    return null;
  }

  private async getDecodedTransaction(
    rawtransaction: string
  ): Promise<ITransaction | null> {
    try {
      if (!rawtransaction) return null;
      return (
        await axios.post(this.url + "/transaction/raw/decode", {
          rawtransaction: rawtransaction,
        })
      ).data;
    } catch (error) {
      console.error(error);
    }
    return null;
  }

  private getSizeVarInt(n: number): number {
    if (n < 253) return 1;
    else if (n <= 65535) return 3;
    else if (n <= 4294967295) return 5;
    else return 9;
  }
}
