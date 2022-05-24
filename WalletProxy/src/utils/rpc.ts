import axios, { AxiosResponse } from "axios";
const config = require("../config/index");

export const PPCRPC = () => {
  return new PeercoinRPC(
    "localhost",
    config.rpcs.user,
    config.rpcs.password,
    config.rpcs.port
  );
};

export class PeercoinRPC {
  host: string;
  user: string;
  password: string;
  port: number;

  constructor(host: string, user: string, password: string, port: number) {
    this.host = host;
    this.user = user;
    this.password = password;
    this.port = port;
  }

  async doExecute(
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

  async isReady(): Promise<boolean> {
    let ready = false;
    try {
      console.log(
        "get blockcount from " +
          "http://" +
          this.host +
          ":" +
          this.port +
          " username: " +
          this.user
      );
      const response = await this.doExecute("getblockcount", null);
      return (
        !!response &&
        !!response.data &&
        !!response.data.result &&
        response.data.result > 0
      );
    } catch (error) {
      ready = false;
    }

    return ready;
  }

  // delay(ms: number) {
  //   return new Promise((resolve) => setTimeout(resolve, ms));
  // }

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

  async getBlock(hash: string): Promise<any> {
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

  async getRawTransaction(hash: string, verbose: number): Promise<any> {
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

  async decodeRawTransaction(transaction: string): Promise<any> {
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
  ): Promise<any> {
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

    try {
      const response = await this.doExecute("createrawtransaction", [
        param1,
        param2,
        0,
        timestamp,
      ]);
      if (!!response && !!response.data && !!response.data.result) {
        return response.data.result;
      }
    } catch (error) {
      console.warn(error);
    }
    return null;
  }
}
