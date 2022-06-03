import axios from "axios";
import orderBy from "lodash/orderBy";
import { CryptoUtils } from "../implementation/CryptoUtils";

export interface IStakeModifier {
  blockheight: number;
  blocktime: number;
  modifier: string;
  modifierBytes: number[] | null;
}

export class StakeModifiers {
  url: string;
  stakemodifiersAll: IStakeModifier[];
  stakemodifiers: IStakeModifier[];
  constructor(url: string) {
    this.url = url;
    this.stakemodifiersAll = [];
    this.stakemodifiers = [];
  }

  async collect(from: number, to: number, progress: (current: number) => void) {
    //skip if already collected
    if (this.stakemodifiersAll.length > 4400) return;

    let currentBlock = from;
    do {
      const hash = await this.getHash(currentBlock);

      const block = await this.getBlockByHash(hash);

      if (
        !!hash &&
        !!block &&
        !this.stakemodifiersAll.find((sm) => sm.blockheight === currentBlock)
      ) {
        this.stakemodifiersAll.push({
          blockheight: currentBlock,
          blocktime: block.time,
          modifier: block.modifier,
          modifierBytes: null,
        });

        if (!this.stakemodifiers.find((sm) => sm.modifier === block.modifier)) {
          this.stakemodifiers.push({
            blockheight: currentBlock,
            blocktime: block.time,
            modifier: block.modifier,
            modifierBytes: CryptoUtils.hexToBytes(block.modifier),
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
        await this.delay(350);
      }
    } while (currentBlock <= to);
  }

  private async getHash(currentBlock: number): Promise<string> {
    try {
      return (
        await axios.get(this.url + "/block/" + currentBlock, null || undefined)
      ).data as string;
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
      return (
        await axios.get(this.url + "/block/hash/" + hash, null || undefined)
      ).data;
    } catch (error) {
      console.error(error);
    }
    return null;
  }
}
