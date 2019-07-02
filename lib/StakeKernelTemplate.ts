import { PeercoinMint } from "./PeercoinMint";
import { CryptoUtils } from "./CryptoUtils";
import { UnspentOutputsToStake } from "./UnspentOutputsToStake";
import BN from "bn.js";
import { BNUtil } from "./BNUtil";

export class StakeKernelTemplate {
  BlockFromTime: number;
  StakeModifier: BN;
  PrevTxOffset: number;
  PrevTxTime: number;
  PrevTxOutIndex: number;
  PrevTxOutValue: number;
  UnspentOutputs: UnspentOutputsToStake;
  IsProtocolV05: boolean;
  StakeMinAge: number;
  Bits: number;
  Results: any[];
  maxResults: number;

  constructor(
    tpl: {
      BlockFromTime: number;
      StakeModifier: BN;
      PrevTxOffset: number;
      PrevTxTime: number;
      PrevTxOutIndex: number;
      PrevTxOutValue: number;
      IsProtocolV03?: boolean;
      StakeMinAge?: number | null | undefined;
      Bits?: number;
    },
    manager: UnspentOutputsToStake
  ) {
    this.BlockFromTime = tpl.BlockFromTime; // int64
    this.StakeModifier = tpl.StakeModifier; //uint64  => BN!!!
    this.PrevTxOffset = tpl.PrevTxOffset; //uint32
    this.PrevTxTime = tpl.PrevTxTime; //int64
    this.PrevTxOutIndex = tpl.PrevTxOutIndex; //uint32
    this.PrevTxOutValue = tpl.PrevTxOutValue; //int64
    this.UnspentOutputs = manager;
    this.IsProtocolV05 = true; //bool
    this.StakeMinAge =
      "StakeMinAge" in tpl
        ? Number(tpl.StakeMinAge)
        : PeercoinMint.minStakeMinAge; //int64
    this.Bits =
      "Bits" in tpl
        ? Number(tpl.Bits)
        : this.setBitsWithDifficulty(parseFloat("10.33")); //uint32
    this.Results = [];
    this.maxResults = 7;
  }

  setBitsWithDifficulty(diff: number): number {
    this.Bits = PeercoinMint.BigToCompact(PeercoinMint.DiffToTarget(diff));
    return this.Bits;
  }

  checkStakeKernelHash(): {
    success: boolean;
    minTarget: BN;
    hash: number[];
    stake: number;
  } {
    let retobj = {
      success: false,
      minTarget: new BN(0),
      hash: [],
      stake: this.PrevTxOutValue
    } as any;

    if (this.UnspentOutputs.TxTime < this.PrevTxTime) {
      // Transaction timestamp violation
      console.log("CheckStakeKernelHash() : nTime violation");

      return retobj;
    }
    if (this.BlockFromTime + this.StakeMinAge > this.UnspentOutputs.TxTime) {
      // Min age requirement
      console.log("CheckStakeKernelHash() : min age violation");

      return retobj;
    }

    var bnTargetPerCoinDay = PeercoinMint.CompactToBig(this.Bits);

    let timeReduction = this.IsProtocolV05 ? this.StakeMinAge : 0;
    var nTimeWeight = this.UnspentOutputs.TxTime - this.PrevTxTime; // int64
    if (nTimeWeight > PeercoinMint.stakeMaxAge) {
      nTimeWeight = PeercoinMint.stakeMaxAge;
    }
    nTimeWeight -= timeReduction;

    var bnCoinDayWeight: BN; // *big.Int
    var valueTime: number = this.PrevTxOutValue * nTimeWeight;
    if (valueTime > 0) {
      // no overflow
      bnCoinDayWeight = new BN(
        "" + Math.floor(valueTime / PeercoinMint.coinDay),
        10
      );
    } else {
      // overflow, calc w/ big.Int or return error?
      // err = errors.New("valueTime overflow")
      // return
      var t1 = new BN("" + 24 * 60 * 60, 10);
      var t2 = new BN("" + PeercoinMint.coin, 10);
      var t3 = new BN("" + this.PrevTxOutValue, 10);
      var t4 = new BN("" + nTimeWeight, 10);
      bnCoinDayWeight = t3
        .mul(t4)
        .div(t2)
        .div(t1);
    }
    var targetInt: BN = bnCoinDayWeight.mul(bnTargetPerCoinDay);
    var buf = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ];
    var _o_ = 0;

    if (this.IsProtocolV05) {
      // v0.5 protocol
      this.StakeModifier = this.UnspentOutputs.sMRLookUp(
        this.UnspentOutputs.TxTime
      );
      var d: number[] = this.StakeModifier.toArray().reverse();
      for (var i = 0; i < 8; i++) {
        buf[_o_] = d[i];
        _o_++;
      }
    } else {
      // v0.2 protocol
      var d2: number = this.Bits;
      for (var i = 0; i < 4; i++) {
        buf[_o_] = d2 & 0xff;
        d2 >>= 8;
        _o_++;
      }
    }
    var data = [
      this.BlockFromTime,
      this.PrevTxOffset,
      this.PrevTxTime,
      this.PrevTxOutIndex,
      this.UnspentOutputs.TxTime
    ];
    for (var k = 0, arrayLength = data.length; k < arrayLength; k++) {
      var dn = data[k];
      for (var i = 0; i < 4; i++) {
        buf[_o_] = dn & 0xff;
        dn >>= 8;
        _o_++;
      }
    }
    var hashProofOfStake = CryptoUtils.SHA256(
      CryptoUtils.SHA256(buf)
    ).reverse();
    var hashProofOfStakeInt: BN = BNUtil.fromByteArrayUnsigned(
      hashProofOfStake
    );

    if (hashProofOfStakeInt.cmp(targetInt) > 0) {
      return retobj;
    }

    retobj.minTarget = hashProofOfStakeInt.div(bnCoinDayWeight).sub(new BN(1));

    retobj.success = true;
    retobj.hash = hashProofOfStake;
    return retobj;
  }
}
