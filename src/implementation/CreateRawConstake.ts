import axios from "axios";

export class CreateRawCoinStake {
   private url: string;

  constructor(url: string) {
    this.url = url;
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
      return (
        
        await axios.post(this.url + "/transaction/raw/coinstake", {
          txid: txid,
          vout: vout,
          redeemScript: redeemScript,
          address: address,
          futureOutput: futureOutput,
          futureTimestamp: futureTimestamp,
          minterPubkey: 'pubkey:' + minterPubkey,  //pubkey: is appended otherwise it thinks it is a address
          minterReward: minterReward
        })
      ).data;
    } catch (error) {   
      console.error(error);
    }
    return null;
  }
}
