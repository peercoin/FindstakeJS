import axios, { AxiosResponse } from "axios";

export interface IBlockResponse {
  hash: string;
  confirmations: number;
  version: number;
  height: number;
  tx: Array<string>;
  time: number;
  modifier: string;
  size: number;
  bits: number;
  difficulty: number;
  flags: string;
  previousblockhash: string;
  nextblockhash: string;
}

export interface ITransactionInput {
  txid: string;
  vout: number;
  sequence: number;
}

export interface ITransactionOutput {
  value: number;
  n: number;
}

export interface IDecodeRawTransactionResponse {
  txid: string;
  time: number;
  version: number;
  size: number;
  vsize: number;
  vin: Array<ITransactionInput>;
  vout: Array<ITransactionOutput>;
}

export class JsonRPCClient {
  //private useProxy:boolean;
  private host: string;
  private user: string;
  private password: string;
  private port: number;
  constructor(
    host: string,
    user: string,
    password: string,
    port: number,
    useProxy: boolean = true
  ) {
    //this.useProxy=useProxy;
    this.host = host;
    this.user = user;
    this.password = password;
    this.port = port;
  }

  async getDifficulty(): Promise<number> {
    try {
      const response = await this.doExecute("getdifficulty", null);
      if (!!response && !!response.data && !!response.data.result) {
        return response.data.result["proof-of-stake"];
      }
    } catch (error) {
      console.warn(error);
    }
    return 0;
  }

  async getBlockCount(): Promise<number> {
    try {
      const response = await this.doExecute("getblockcount", null);
      if (!!response && !!response.data && !!response.data.result) {
        return response.data.result;
      }
    } catch (error) {
      console.warn(error);
    }
    return 0;
  }

  async getBlockHash(index: number): Promise<string> {
    try {
      const arr = [Number(index)];
      const response = await this.doExecute("getblockhash", arr);
      if (!!response && !!response.data && !!response.data.result) {
        return response.data.result;
      }
    } catch (error) {
      console.warn(error);
    }
    return "";
  }

  async getBlock(hash: string): Promise<IBlockResponse | null> {
    try {
      const response = await this.doExecute("getblock", [hash]);
      if (!!response && !!response.data && !!response.data.result) {
        return response.data.result;
      }
    } catch (error) {
      console.warn(error);
    }
    return null;
  }

  async getRawTransaction(
    hash: string,
    verbose: number
  ): Promise<string | null> {
    try {
      const response = await this.doExecute("getrawtransaction", [
        hash,
        verbose,
      ]);
      if (!!response && !!response.data && !!response.data.result) {
        return response.data.result;
      }
    } catch (error) {
      console.warn(error);
    }
    return null;
  }

  async decodeRawTransaction(
    transaction: string
  ): Promise<IDecodeRawTransactionResponse | null> {
    try {
      const response = await this.doExecute("decoderawtransaction", [
        transaction,
      ]);
      if (!!response && !!response.data && !!response.data.result) {
        return response.data.result;
      }
    } catch (error) {
      console.warn(error);
    }
    return null;
  }

  async createRawCoinstakeTransaction(
    inputs: { txid: string; vout: number; redeemScript: string }[],
    outputs: { Address: string; Vout: number }[],
    timestamp: number
  ): Promise<string | null> {
    const param1 = inputs;
    const param2 = [
      {
        coinstake: 0,
      },
    ] as any[];

    for (let index = 0; index < outputs.length; index++) {
      param2.push({
        [outputs[index].Address]: outputs[index].Vout,
      });
    }
    const params = [param1, param2, 0, timestamp];
    console.log(params);
    try {
      const response = await this.doExecute("createrawtransaction", params);
      if (!!response && !!response.data && !!response.data.result) {
        return response.data.result;
      }
    } catch (error) {
      console.warn(error);
    }
    return null;
  }

  private async doExecute(
    method: string,
    params: null | any[]
  ): Promise<AxiosResponse<any, any>> {
    return await axios.post(
      "http://" + this.host + ":" + this.port,
      {
        jsonrpc: "2.0",
        id: +new Date(),
        method: method,
        params: !!params ? params : null,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        auth: {
          username: this.user,
          password: this.password,
        },
      }
    );
  }
}
