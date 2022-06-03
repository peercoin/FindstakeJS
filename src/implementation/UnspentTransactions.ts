import axios from "axios";

export interface IUnspent {
  index: number;
  tx: string;
  blockhash: string;
  blockheight: number;
}

interface IVoutScriptPubKey {
  hex: string;
  addresses: string[];
}

interface IAddressTransactions {
  itemsOnPage: number;
  page: number;
  totalPages: number;
  transactions: string[];
}

interface ITransactionVout {
  value: number;
  n: number;
  spent: boolean;
  scriptPubKey: IVoutScriptPubKey;
}

interface ITransaction {
  txid: string;
  // version: number;
  blockhash: string;
  blockheight: number;
  // time: number;
  // blocktime: number;
  confirmations: number;
  // hex: string;
  vout: ITransactionVout[];
}

export class UnspentTransactions {
  address: string;
  transactions: string[];
  unspents: IUnspent[];
  constructor(address: string) {
    this.address = address;
    this.transactions = [];
    this.unspents = [];
  }

  async collect(
    progress: (current: number) => void,
    addToastr: (text: string, toastrType: string) => void
  ) {
    let page = 1;
    let pageTotal = 1;
    let stop = false;

    do {
      let addressTransactions = await this.getTransactions(page);
      if (!addressTransactions) console.error("No results from ", this.address);
      this.transactions = [
        ...this.transactions,
        ...addressTransactions!.transactions,
      ];
      const max = 500;
      if (this.transactions.length > max) {
        addToastr(
          `This address has more than ${max} transactions. Checking for unspents for the latest ${max} transactions only.`,
          "warn"
        );

        stop = true;
        this.transactions = this.transactions.slice(0, max);
      }

      page = addressTransactions!.page;
      pageTotal = addressTransactions!.totalPages;
    } while (page != pageTotal && !stop);

    //collect unspent vouts:
    for (let indexTx = 0; indexTx < this.transactions.length; indexTx++) {
      const length = this.transactions.length;

      let fraction =
        !!this.transactions && length > 0
          ? (indexTx + 1.0) / (1.0 * length)
          : 0.5;

      let percentage = Math.max(0.0, 100 * fraction);
      percentage = Math.min(100.0, percentage);
      progress(percentage);
      const tx = this.transactions[indexTx];

      const transaction = await this.getTransaction(tx);
      //roughly 30 days, todo get the mature confirmations somewhere...
      if (transaction!.confirmations > 6 * 24 * 30) {
        //find the vout if unspent:
        for (let index = 0; index < transaction!.vout.length; index++) {
          const vout = transaction!.vout[index];
          if (
            !!vout &&
            !vout.spent &&
            !!vout.scriptPubKey &&
            !!vout.scriptPubKey.addresses &&
            !!vout.scriptPubKey.addresses.find((a) => a === this.address)
          ) {
            this.unspents.push({
              index: vout.n,
              tx: tx,
              blockhash: transaction!.blockhash,
              blockheight: transaction!.blockheight,
            });
            break;
          }
        }
      }
    }
  }

  private async getTransaction(tx: string): Promise<ITransaction | null> {
    try {
      const url = "https://blockbook.peercoin.net/api/tx/" + tx;
      return (await axios.get<ITransaction>(url, null || undefined)).data;
    } catch (error) {
      console.error(error);
      throw "could not GET data from blockbook.peercoin.net";
    }
    return null;
  }

  private async getTransactions(
    page: number
  ): Promise<IAddressTransactions | null> {
    try {
      return (
        await axios.get<IAddressTransactions>(
          "https://blockbook.peercoin.net/api/address/" +
            this.address +
            "?page=" +
            page,
          null || undefined
        )
      ).data;
    } catch (error) {
      console.error(error);
      throw "could not GET data from blockbook.peercoin.net";
    }
    return null;
  }

  // isSpent(tx: string, voutIndex: number): Promise<boolean> {
  //   return new Promise((resolve, reject) => {
  //     const url =
  //       "https://blockbook.peercoin.net/spending/" + tx + "/" + voutIndex;

  //     fetch(url, {
  //       redirect: "manual",
  //     })
  //       .then((res) => {
  //         if (res.type === "opaqueredirect") {
  //           resolve(true);
  //           // spent!
  //           //window.location.href = response.url;
  //         } else {
  //           resolve(false);
  //           //unspent!
  //         }
  //       })
  //       .catch((reason) => {
  //         console.warn(reason);
  //         reject(reason);
  //       });
  //   });
  // }
}
