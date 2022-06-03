import { Humanizer } from "./Humanizer";
import { PeercoinMint } from "./PeercoinMint";

export interface FutureStake {
  MaxDifficulty: number;
  FutureTimestamp: number;
  FutureUnits: number;
  DayStamp: string;
  RawTransaction?: string | null;
}

export class MintTemplate {
  Id: string;
  Name: string;
  Address: string;
  BlockFromTime: number;
  PrevTxOffset: number;
  PrevTxTime: number;
  PrevTxOutIndex: number;
  PrevTxOutValue: number;
  Bits: number = 0;

  Txid: string;
  Vout: number;

  Blockheight: number;
  Blockhash: string;

  FutureStakes: Array<FutureStake>;
  Selected: boolean = false;
  
  constructor(
    id: string,
    address: string,
    blockFromTime: number,
    prevTxOffset: number,
    prevTxTime: number,
    prevTxOutIndex: number,
    prevTxOutValue: number,
    //bits: number,
    blockheight: number,
    blockhash: string
  ) {
    this.Name = Humanizer.toReadableId(id);
    this.Id = id;
    this.Txid = id.substring(2).split("_")[0];
    this.Vout = parseInt(id.substring(2).split("_")[1], 10);
    this.Address = address;
    this.BlockFromTime = blockFromTime;
    this.PrevTxOffset = prevTxOffset;
    this.PrevTxTime = prevTxTime;
    this.PrevTxOutIndex = prevTxOutIndex;
    this.PrevTxOutValue = prevTxOutValue;
    //  this.Bits = bits;
    this.Blockheight = blockheight;
    this.Blockhash = blockhash;
    //this.CurrentUnits = currentUnits;
    this.FutureStakes = [];
  }

  add(futureStake: FutureStake): void {
    if (
      !this.FutureStakes.find(
        (s) => s.FutureTimestamp === futureStake.FutureTimestamp
      )
    ) {
      this.FutureStakes.push(futureStake);
    }
  }

  setBitsWithDifficulty(diff: number): void {
    this.Bits = PeercoinMint.BigToCompact(PeercoinMint.DiffToTarget(diff));
  }
}
