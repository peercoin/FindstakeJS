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
      // let param1 = [
      //   {
      //     txid: "bdcae66a3c0b9804eaa7b8a923d597f9726fb46cdece563996b6f81804a2b60e",
      //     vout: 0,
      //     redeemScript:
      //       "532102633a97eab667d165b28b19ad0848cc4f3f3e06e6b19b15cdc910d4b13f4e611f21027260ccc4dba64b04c2c07bd02da5257058ad464857919789ad9c983025fd2cba2102b813e6335216f3ae8547d283f3ab600d08c1c444f5d34fa38cfd941d939001422103131f4fb6fdc603ad3859c2c5b3f246f1ee3ba5391600e960b9be4c59f609b3dd2103b12c1b22ebbdf8e7b1c19db701484fd6fdfb63e4b117800a6838c6eb0f0e881b55ae",
      //   },
      // ];

      // let p2 = [
      //   {
      //     Address:
      //       "pubkey:04c17a7f16a7fdd275af270d24c08c5c1b7dd98e83742782f9b26ab43c9506dea33d396b8a9640d1ea5163dde2de50ffe9a9d2b43f2c2205731ab425d9b8cd4f10",
      //     Vout: 0,
      //   },
      //   { Address: "p92W3t7YkKfQEPDb7cG9jQ6iMh7cpKLvwK", Vout: 20325.068926 },
      // ];
      // let rrr = await this.createRawCoinstakeTransaction(
      //   param1,
      //   p2,
      //   1654153448
      // );
      // debugger;
      // console.log(rrr);
      // return !!rrr;
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
}
