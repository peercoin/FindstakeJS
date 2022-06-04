import axios from "axios";

export interface IUnspent {
  index: number;
  tx: string;
  blockheight: number;
}

interface IUtxo {
  txid: string;
  vout: number;
  satoshis: number;
  height: number;
  confirmations: number;
}

export class UnspentTransactions {
  address: string;
  unspents: IUnspent[];

  constructor(address: string) {
    this.address = address;
    this.unspents = [];
  }

  async collect(
    progress: (current: number) => void,
    addToastr: (text: string, toastrType: string) => void
  ) {
    const utxoList = await this.getUtxos();

    addToastr(
      `This address has ${utxoList!.length} unspent transactions.`,
      "success"
    );

    for (let index = 0; index < utxoList!.length; index++) {
      const utxo = utxoList![index];
      const length = utxoList!.length;

      const fraction = (index + 1.0) / (1.0 * length);
      let percentage = Math.max(0.0, 100 * fraction);
      percentage = Math.min(100.0, percentage);
      progress(percentage);

      //only mature ones:
      if (!!utxo!.txid && utxo!.height && utxo!.confirmations > 6 * 24 * 30) {
        this.unspents.push({
          index: utxo!.vout,
          tx: utxo!.txid,
          blockheight: utxo!.height,
        });
      }
      if (index % 125 === 0) {
        await this.delay(300);
      }
    }
    progress(100);
  }

  private async getUtxos(): Promise<Array<IUtxo> | null> {
    try {
      return (
        await axios.get<Array<IUtxo>>(
          "https://blockbook.peercoin.net/api/utxo/" +
            this.address +
            "?confirmed=true",
          null || undefined
        )
      ).data;
    } catch (error) {
      console.error(error);
      throw "could not GET utxo from blockbook.peercoin.net";
    }
    return null;
  }

  private delay(n: number): Promise<void> {
    return new Promise(function (resolve) {
      setTimeout(resolve, n);
    });
  }
}
