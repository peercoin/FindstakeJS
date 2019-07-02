import { StakeKernelTemplate } from "./StakeKernelTemplate";
import { PeercoinMint } from "./PeercoinMint";
import BN from "bn.js";

export class UnspentOutputsToStake {
  private arrStakeKernelTemplates: StakeKernelTemplate[];
  Bits: number;
  TxTime: number;
  StartTime: number;
  MaxTime: number;
  Stop: boolean;
  Results: any[];
  private orgtpl: any[];
  sMRLookUp: (time: any) => BN;

  constructor() {
    this.arrStakeKernelTemplates = []; //
    this.Bits = PeercoinMint.BigToCompact(
      PeercoinMint.DiffToTarget(parseFloat("15"))
    ); //uint32
    this.TxTime = (Date.now() / 1000) | 0; //int64
    this.StartTime = this.TxTime;
    this.MaxTime = this.TxTime + 3600;
    this.Stop = false;
    this.Results = [];
    this.orgtpl = [];
    this.sMRLookUp = () => new BN(0);
  }

  add(tpldata: {
    BlockFromTime: number;
    StakeModifier: BN;
    PrevTxOffset: number;
    PrevTxTime: number;
    PrevTxOutIndex: number;
    PrevTxOutValue: number;
  }) {
    var addrfound = this.orgtpl.some(function(el: {
      BlockFromTime: number;
      StakeModifier: BN;
      PrevTxOffset: number;
      PrevTxTime: number;
      PrevTxOutIndex: number;
      PrevTxOutValue: number;
    }) {
      if (
        el.PrevTxOffset == tpldata.PrevTxOffset &&
        el.PrevTxOutIndex == tpldata.PrevTxOutIndex &&
        el.PrevTxOutValue == tpldata.PrevTxOutValue &&
        el.StakeModifier.toString() == tpldata.StakeModifier.toString()
      ) {
        return true;
      }
    });

    if (!addrfound) {
      this.orgtpl.push(tpldata);
      this.arrStakeKernelTemplates.push(
        new StakeKernelTemplate(tpldata as any, this)
      );
    }
  }

  setBitsWithDifficulty(diff: number) {
    var that = this;
    this.Bits = PeercoinMint.BigToCompact(PeercoinMint.DiffToTarget(diff));

    this.arrStakeKernelTemplates.forEach((element: StakeKernelTemplate) => {
      element.Bits = this.Bits;
    });
  }

  setStartStop(start: number, stop: number) {
    var that = this;
    that.TxTime = start;
    that.StartTime = that.TxTime;
    that.MaxTime = stop;
  }

  stop() {
    this.Stop = true;
  }

  private findStakeAt(): { foundstake: number; mindifficulty: number }[] {
    var stakesfound = [] as any[];

    //filter out oudated templates
    var newarrKT :StakeKernelTemplate[]= [];

    this.arrStakeKernelTemplates.forEach((element, index, array) => {
      if (
        element.UnspentOutputs.TxTime < element.PrevTxTime ||
        element.BlockFromTime + element.StakeMinAge >
          element.UnspentOutputs.TxTime
      ) {
        // Transaction timestamp violation
        // console.log("CheckStakeKernelHash() : nTime violation");// Min age requirement
      } else {
        newarrKT.push(element);
      }
    });

    this.arrStakeKernelTemplates = newarrKT;

    this.arrStakeKernelTemplates.forEach((element, index, array) => {
      if (!this.Stop) {
        var resultobj = element.checkStakeKernelHash(); //{succes: succes, hash, minTarget:minTarget}

        if (resultobj.success) {
          var comp = PeercoinMint.IncCompact(
            PeercoinMint.BigToCompact(resultobj.minTarget)
          );
          var diff = PeercoinMint.CompactToDiff(comp);
          if (diff < 0.25) {
            console.log("hmmm is this min diff ok: " + diff);
            //element.maxResults=1;
            //debugger;
            // console.log(element)
          }

          var res = {
            foundstake: this.TxTime,
            mindifficulty: (diff * 10) / 10,
            stake: resultobj.stake * 0.000001
          };
          element.Results.push(res);
          stakesfound.push(res);
        }
      }
    });

    return stakesfound;
  }

  private recursiveFind(ob: {
    progressWhen: number;
    mintcallback: (arr: any[]) => any;
    progresscallback: (n: number, s: number) => any;
    setZeroTimeout: (a: any, b?: any) => any;
  }) {
    ob.progressWhen++;
    this.TxTime++;

    var res = this.findStakeAt();
    if (res.length > 0) {
      ob.mintcallback(res);
      this.Results.push(res);
    }

    var loopfunc: (a: any, b: any) => any = ob.setZeroTimeout;
    if (ob.progressWhen > 555 / this.arrStakeKernelTemplates.length) {
      ob.progressWhen = 0;

      ob.progresscallback(
        (this.TxTime - this.StartTime) /
          (1.0 * (this.MaxTime - this.StartTime)),
        this.TxTime
      );

      loopfunc = setTimeout;
    }

    if (!this.Stop && this.TxTime < this.MaxTime)
      loopfunc(() => this.recursiveFind(ob), 40);
    else ob.progresscallback(100, this.TxTime);
  }

  findStake(
    mintcallback: (arr: any[]) => any,
    progresscallback: (n: number, s: number) => any,
    setZeroTimeout: (a: any, b?: any) => any
  ) {
    if (this.arrStakeKernelTemplates.length > 0) {
      var ob = {
        progressWhen: 0,
        mintcallback: mintcallback,
        progresscallback: progresscallback,
        setZeroTimeout: setZeroTimeout
      };
      setZeroTimeout(() => this.recursiveFind(ob));
    }
  }

  setLookupCallback(funcLookup: (timestamp: any) => BN) {
    this.sMRLookUp = funcLookup;
  }
}
