import { JsonRPCClient } from "../implementation/JsonRPCClient";
import orderBy from "lodash/orderBy";
import { CryptoUtils } from "../implementation/CryptoUtils";

export interface IStakeModifier {
  blockheight: number;
  blocktime: number;
  modifier: string;
  modifierBytes: number[] | null;
}

export class StakeModifiers {
  client: JsonRPCClient;
  stakemodifiersAll: IStakeModifier[];
  stakemodifiers: IStakeModifier[];
  constructor(  client: JsonRPCClient) {
    this.client = client;
    this.stakemodifiersAll = [];
    this.stakemodifiers = [];
  }

  async collect(from: number, to: number, progress: (current: number) => void) {
    //skip if already collected
    if (this.stakemodifiersAll.length > 4400) return;
 
    let currentBlock = from;
    do {
      let blockCache = null;
      // debugger;
      if (typeof Storage !== "undefined") {
        // Code for localStorage/sessionStorage.
        blockCache = localStorage.getItem("stakemodifier_" + currentBlock);
        // if (!!blockCache)
        //   console.log(
        //     "found localstorage for " +
        //       "stakemodifier_" +
        //       currentBlock +
        //       " value: " +
        //       blockCache
        //   );
      }

      if (!blockCache) {
   
        const hash = await this.getHash(currentBlock);

        const block = await this.getBlockByHash(hash);

        if (!!block) {
          blockCache = block.time + "~" + block.modifier;
          if (typeof Storage !== "undefined") {
            try {
              localStorage.setItem(
                "stakemodifier_" + currentBlock,
                block.time + "~" + block.modifier
              );
            } catch (error) {
              //QuotaExceededError
            }
          }
        }
      }

      if (
        !!blockCache &&
        !this.stakemodifiersAll.find((sm) => sm.blockheight === currentBlock)
      ) {
        const time = parseInt(blockCache.split("~")[0], 10);
        const modifier = blockCache.split("~")[1];
        this.stakemodifiersAll.push({
          blockheight: currentBlock,
          blocktime: time,
          modifier: modifier,
          modifierBytes: null,
        });
        //add first modifier when changed:
        if (!this.stakemodifiers.find((sm) => sm.modifier === modifier)) {
          this.stakemodifiers.push({
            blockheight: currentBlock,
            blocktime: time,
            modifier: modifier,
            modifierBytes: CryptoUtils.hexToBytes(modifier),
          });
        }
      }

      this.stakemodifiersAll = orderBy(
        this.stakemodifiersAll,
        ["blockheight"],
        ["asc"]
      );
      this.stakemodifiers = orderBy(
        this.stakemodifiers,
        ["blockheight"],
        ["asc"]
      );
      progress(currentBlock);
      currentBlock++;

      if (currentBlock % 100 === 0) {
        await this.delay(250);
      }
    } while (currentBlock <= to);
    //onfinished(currentBlock);
  }

  private async getHash(currentBlock: number): Promise<string> {
    try {
      return await this.client.getBlockHash(currentBlock);
    } catch (error) {
      console.error(error);
    }
    return "";
  }

  private delay(n: number): Promise<void> {
    return new Promise(function (resolve) {
      setTimeout(resolve, n);
    });
  }

  private async getBlockByHash(
    hash: string
  ): Promise<{ time: number; modifier: string } | null> {
    try {
      if (!hash) return null;
      return await this.client.getBlock(hash);
    } catch (error) {
      console.error(error);
    }
    return null;
  }
}
