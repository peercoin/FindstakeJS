import { PeercoinMint } from "./PeercoinMint";
import { MintTemplate } from "./MintTemplate";
import { CryptoUtils } from "./CryptoUtils";
import BN from "bn.js";

export class KernelHash {
  static checkStakeKernelHash(
    template: MintTemplate,
    futureTimestamp: number,
    stakeModifier: BN
  ): {
    success: boolean;
    minTarget: BN;
    MaxDifficulty: number;
    FutureTimestamp: number;
    FutureUnits: number;
    DayStamp: string;
    hash: null | Uint8Array;
    stake: number;
   // template: MintTemplate;
  } {
    let retobj = {
      success: false,
      FutureTimestamp: futureTimestamp,
      minTarget: new BN(0),
      MaxDifficulty: 0,
      hash: null as null | Uint8Array,
      stake: template.PrevTxOutValue,
      //template: template,
      FutureUnits: 0,
      DayStamp: "",
    };

    // if (this.UnspentOutputs.TxTime < template.PrevTxTime) {
    //   // Transaction timestamp violation
    //   console.log("CheckStakeKernelHash() : nTime violation");

    //   return retobj;
    // }
    // if (template.BlockFromTime + this.StakeMinAge > this.UnspentOutputs.TxTime) {
    //   // Min age requirement
    //   console.log("CheckStakeKernelHash() : min age violation");

    //   return retobj;
    // }

    const bnTargetPerCoinDay = PeercoinMint.CompactToBig(template.Bits);

    const timeReduction = PeercoinMint.minStakeMinAge;
    let nTimeWeight = futureTimestamp - template.PrevTxTime; // int64
    if (nTimeWeight > PeercoinMint.stakeMaxAge) {
      nTimeWeight = PeercoinMint.stakeMaxAge;
    }
    nTimeWeight -= timeReduction;

    let bnCoinDayWeight: BN; // *big.Int
    let valueTime: number = template.PrevTxOutValue * nTimeWeight;
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
      const t1 = new BN("" + 24 * 60 * 60, 10);
      const t2 = new BN("" + PeercoinMint.coin, 10);
      const t3 = new BN("" + template.PrevTxOutValue, 10);
      const t4 = new BN("" + nTimeWeight, 10);
      bnCoinDayWeight = t3.mul(t4).div(t2).div(t1);
    }
    const targetInt: BN = bnCoinDayWeight.mul(bnTargetPerCoinDay);
    const buf = new Uint8Array([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0,
    ]);

    let bufferIndex = 0;

    // v0.5 protocol
    const reversedBytes: number[] = stakeModifier.toArray().reverse();
    for (let index = 0; index < 8; index++) {
      buf[bufferIndex] = reversedBytes[index];
      bufferIndex++;
    }

    const data = [
      template.BlockFromTime,
      template.PrevTxOffset,
      template.PrevTxTime,
      template.PrevTxOutIndex,
      futureTimestamp,
    ];

    for (
      let dataIndex = 0, arrayLength = data.length;
      dataIndex < arrayLength;
      dataIndex++
    ) {
      let dataNumber = data[dataIndex];
      for (let index = 0; index < 4; index++) {
        buf[bufferIndex] = dataNumber & 0xff;
        dataNumber >>= 8;
        bufferIndex++;
      }
    }

    const hashProofOfStake = CryptoUtils.SHA256(
      CryptoUtils.SHA256(buf)
    ).reverse();

    const hashProofOfStakeInt: BN =
      CryptoUtils.fromByteArrayUnsigned(hashProofOfStake);

    if (hashProofOfStakeInt.cmp(targetInt) > 0) {
      return retobj;
    }
    //yeah found a stake!
    retobj.minTarget = hashProofOfStakeInt.div(bnCoinDayWeight).sub(new BN(1));

    const compact = PeercoinMint.IncCompact(
      PeercoinMint.BigToCompact(retobj.minTarget)
    );
    retobj.MaxDifficulty = PeercoinMint.CompactToDiff(compact);
    retobj.success = true;
    retobj.hash = hashProofOfStake;

    const date = new Date(futureTimestamp * 1000);
    retobj.DayStamp = new Intl.DateTimeFormat(
      Intl.DateTimeFormat().resolvedOptions().locale,
      { weekday: "narrow", day: "numeric" }
    ).format(date);

    retobj.FutureUnits = KernelHash.getCoinstakeReward(
      template.BlockFromTime,
      futureTimestamp,
      template.PrevTxOutValue
    );

    return retobj;
  }

  static getCoinstakeReward(
    blocktime: number,
    futureTimestamp: number,
    units: number
  ): number {
    /*
    Equation at 2.9975% plus a basis 1.2 peercoin:
    A = P(1 + 0.029975*t) + 1.2      
    if set too high the protocol may deny it.
    */
    const perc = 0.029975;
    const YEAR_IN_SECONDS = 31556952; // Average length of year in Gregorian calendar

    const time = futureTimestamp - blocktime;
    const seconds = Math.min(time, YEAR_IN_SECONDS); // cap at 1 year max
    const fractionyears = seconds / (1.0 * YEAR_IN_SECONDS);

    // just floor the double:
    var newUnits = Math.floor(
      units * (1 + perc * fractionyears) + 1.2 * 1000000
    );
    return parseFloat(newUnits.toFixed(6));
  }
 
}
