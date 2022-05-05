import axios, { AxiosResponse } from 'axios';
const config = require('../config/index');

export const PPCRPC = () => {
  return new PeercoinRPC(
    'localhost',
    config.rpcs.user,
    config.rpcs.password,
    config.rpcs.port,
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
    params: string[] | null | number[],
  ): Promise<AxiosResponse<any, any>> {
    return await axios.post(
      'http://' + this.host + ':' + this.port,
      {
        jsonrpc: '2.0',
        id: +new Date(),
        method: method,
        params: !!params ? params : null,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        auth: {
          username: this.user,
          password: this.password,
        },
      },
    );
  }

  async isReady(): Promise<boolean> {
    let ready = false;
    try {
      const response = await this.doExecute('getblockcount', null);
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

  delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getBlockCount(): Promise<number> {
    let ready = false;

    do {
      try {
        const response = await this.doExecute('getblockcount', null);
        if (!!response && !!response.data && !!response.data.result) {
          ready = true;
          return response.data.result;
        }
      } catch (error) {
        ready = false;
      }
      await this.delay(500);
    } while (!ready);
  }

  async getBlockHash(index: number): Promise<string> {
    let ready = false;

    do {
      try {
        const arr = [Number(index)];
        const response = await this.doExecute('getblockhash', arr);
        if (!!response && !!response.data && !!response.data.result) {
          ready = true;
          return response.data.result;
        }
      } catch (error) {

        console.warn(error);
        ready = false;
      }
      console.log('again')
      await this.delay(500);
    } while (!ready);
  }

  async getBlock(hash: string): Promise<any> {
    let ready = false;

    do {
      try {
        const response = await this.doExecute('getblock', [hash]);
        if (!!response && !!response.data && !!response.data.result) {
          ready = true;
          return response.data.result;
        }
      } catch (error) {
        ready = false;
      }
      await this.delay(500);
    } while (!ready);
  }
}
