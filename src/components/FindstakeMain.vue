<template>
  <div>
    <slot @homeClick="onHomeClick"></slot>
    <div class="bodyview">
      <div class="container mb-3">
        <div class="row my-3 mx-1">
          <MultiStepsProgress :step="wizardStatus" />
        </div>
      </div>

      <div class="container mb-2">
        <div class="row my-3">
          <div class="col-md-12">
            <FindstakeForm
              :step="wizardStatus"
              :startBlock="startBlock"
              :currentBlock="currentBlock"
              :progressGetVouts="progressGetVouts"
              :progressTemplates="progressTemplates"
              :progressFindstake="progressFindstake"
              :templates="mintTemplates"
              :innerwidth="innerwidth"
              :max="max"
              @connectionData="collectStakeModifiers"
              @peercoinaddressentered="collectVouts"
              @started="startRun"
            />
          </div>
        </div>
      </div>

      <VerticalExpand>
        <div
          class="container mb-2"
          v-if="!!allMintTemplates && allMintTemplates.length > max"
        >
          <UTXOSelector
            :staketemplates="allMintTemplates"
            :max="max"
            @utxo-selected="utxoSelected"
          ></UTXOSelector>
        </div>
      </VerticalExpand>

      <VerticalExpand>
        <div class="container mb-2" v-if="showfrequencyPoints">
          <div class="results-title">FOUND STAKES</div>

          <BarChart
            :points="frequencyPoints"
            :show-y-axis="true"
            :show-x-axis="true"
            :width="Math.max(100, Math.min(900, 0.7 * innerwidth))"
            :height="200"
            :show-values="true"
            bar-color="#3cb054"
            @bar-clicked="onBarClicked"
          />

          <StakeProspects
            v-for="template in mintTemplatesWithResults"
            :key="template.Name"
            :staketemplate="template"
            :day-stamp="dayStamp"
          ></StakeProspects>
        </div>
      </VerticalExpand>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import isEmpty from "lodash/isEmpty";
import MultiStepsProgress from "../components/MultiStepsProgress.vue";
import FindstakeForm from "../components/FindstakeForm.vue";
import { StakeModifiers } from "../implementation/StakeModifiers";
import {
  UnspentTransactions,
  IUnspent,
} from "../implementation/UnspentTransactions";
import { FutureStake, MintTemplate } from "../implementation/MintTemplate";
import { BlockCollection } from "../implementation/BlockCollection";
import { KernelHash } from "../implementation/KernelHash";
import groupBy from "lodash/groupBy";
import orderBy from "lodash/orderBy";
import VerticalExpand from "./VerticalExpand.vue";
import BarChart from "./BarChart.vue";
import StakeProspects from "./StakeProspects.vue";
import { CryptoUtils } from "../implementation/CryptoUtils";
import UTXOSelector from "./UTXOSelector.vue";
import { CreateRawCoinStake } from "../implementation/CreateRawConstake";
import { PeercoinMint } from "../implementation/PeercoinMint";

export default defineComponent({
  components: {
    MultiStepsProgress,
    FindstakeForm,
    BarChart,
    StakeProspects,
    VerticalExpand,
    UTXOSelector,
  },

  props: {
    innerwidth: {
      Type: Number,
      required: true,
      default: 0,
    },
  },

  watch: {
    dayStamp() {
      this.$nextTick(() => {
        this.trigger++;
      });
    },
  },

  data() {
    return {
      debugSkipCollectModifiers: false, //to skip loading modifiers while debugging
      findstakeStatus: 1,
      Findstakelimit: 2592000 - 761920,
      urlProxy: "",
      dayStamp: "",
      lastBlock: 0,
      lastDifficulty: 0,
      currentBlock: 0,
      progressGetVouts: 0,
      progressTemplates: 0,
      progressFindstake: 0,
      stakeModifiers: null as StakeModifiers | null,
      startBlocksDelta: 6 * 24 * 31,
      unspentTransactions: null as UnspentTransactions | null,
      allMintTemplates: [] as Array<MintTemplate>,
      mintTemplates: [] as Array<MintTemplate>,
      blocks: null as BlockCollection | null,
      findstakeRunning: false,
      findstakeDone: false,
      trigger: 0,
      max: 75,
    };
  },

  computed: {
    wizardStatus(): number {
      if (this.findstakeDone) return 7;
      if (this.findstakeRunning) return 6;
      if (
        this.totaltemplates > 0 &&
        this.findstakeStatus <= 3 &&
        this.progressGetVouts >= 100 &&
        this.progressTemplates > 99.9 &&
        this.currentBlock === this.lastBlock
      ) {
        return 5;
      }

      if (
        this.totaltemplates > 0 &&
        this.findstakeStatus <= 3 &&
        this.progressGetVouts >= 100
      ) {
        return 4;
      }

      if (
        this.findstakeStatus == 2 &&
        !!this.unspentTransactions &&
        !!this.unspentTransactions.address
      ) {
        return 3;
      }
      return this.findstakeStatus;
    },

    startBlock(): number {
      return this.lastBlock - this.startBlocksDelta;
    },

    totaltemplates(): number {
      if (!!this.unspentTransactions && !!this.unspentTransactions.unspents) {
        return this.unspentTransactions!.unspents.length;
      }
      return 0;
    },

    mintTemplatesWithResults(): Array<MintTemplate> {
      let trigger1 = this.trigger;
      let results = this.mintTemplates
        .filter((t) => !isEmpty(t.FutureStakes))
        .slice();

      const sortItem = this.dayStamp || "";

      return orderBy(
        results,
        [
          (r) =>
            r.FutureStakes.filter((fs) => fs.DayStamp === sortItem).length * -1,
          (r) => r.PrevTxOutValue * -1,
        ],
        ["asc", "asc"]
      );
    },

    showfrequencyPoints(): boolean {
      if (!!this.frequencyPoints) {
        return this.frequencyPoints.some((p) => p.value > 0);
      }
      return false;
    },

    frequencyPoints(): Array<{
      label: string;
      value: number;
      tooltipLabel: string;
    }> {
      let points = [] as Array<{
        label: string;
        value: number;
        tooltipLabel: string;
      }>;
      const now = new Date();

      for (let index = 0; index < 21; index++) {
        let daystamp = new Intl.DateTimeFormat(
          Intl.DateTimeFormat().resolvedOptions().locale,
          { weekday: "narrow", day: "numeric" }
        ).format(now);

        points.push({
          label: daystamp,
          value: 0, //start with zero
          tooltipLabel: now.toLocaleDateString(),
        });

        now.setDate(now.getDate() + 1);
      }
      if (this.mintTemplates.length === 1) {
        this.mintTemplates[0].FutureStakes.forEach((element) => {
          let point = points.find((p) => p.label === element.DayStamp);
          if (!!point) {
            point.value++;
          }
        });
      } else {
        this.mintTemplates.forEach((template) => {
          const dict = groupBy(template.FutureStakes, (t) => t.DayStamp);
          for (let daystamp in dict) {
            let point = points.find((p) => p.label === daystamp);
            if (!!point) {
              point.value++;
            }
          }
        });
      }

      return points;
    },
  },

  methods: {
    onHomeClick() {
      //todo: reset to defaults, for now refresh page
      window.location.reload();
    },

    utxoSelected(list: Array<MintTemplate>) {
      this.mintTemplates = list;
      this.allMintTemplates = [];
    },

    onBarClicked(bar: { label: string }): void {
      this.dayStamp = bar.label || "";
    },

    getModifier(curtime: number) {
      let stakeModifierBytes = [] as number[] | null;
      const tt = curtime - this.Findstakelimit;

      for (
        let i = 0, max = this.stakeModifiers!.stakemodifiers.length;
        i < max;
        i++
      ) {
        const item = this.stakeModifiers!.stakemodifiers[i];
        if (item.blocktime <= tt) {
          stakeModifierBytes = item.modifierBytes;
        } else {
          break;
        }
      }
      return CryptoUtils.fromByteArrayUnsigned(stakeModifierBytes!);
    },

    async collectStakeModifiers(data: {
      lastBlock: number;
      urlProxy: string;
      lastDifficulty: number;
    }) {
      //console.log(data);
      this.findstakeStatus = 2;
      this.urlProxy = data.urlProxy;
      this.blocks = new BlockCollection(this.urlProxy);
      this.lastBlock = data.lastBlock;
      this.lastDifficulty = data.lastDifficulty;
      this.stakeModifiers = new StakeModifiers(this.urlProxy);

      if (!this.debugSkipCollectModifiers) {
        await this.stakeModifiers.collect(
          this.lastBlock - this.startBlocksDelta,
          this.lastBlock,
          this.onStakeModifiersProgress
        );
      }

      this.findstakeStatus = 3;
    },

    onStakeModifiersProgress(currentBlock: number): void {
      if (
        this.lastBlock == currentBlock ||
        this.currentBlock < 1000 ||
        currentBlock % 64 === 0
      )
        this.currentBlock = currentBlock;
    },

    async startRun(startoptions: {
      generateRawCoinStake: boolean;
      minDifficulty: number;
      minterpubkeyAddress: string;
      redeemscript: string;
      start: number;
      end: number;
      url: string;
      peercoinAddress: string;
    }): Promise<void> {
      this.findstakeRunning = true;

      this.mintTemplates.forEach((template) => {
        template.setBitsWithDifficulty(startoptions.minDifficulty);
      });

      await this.delay(300);

      let futureTime = startoptions.start;
      let startTime = startoptions.start;
      let endTill = startoptions.end;
      do {
        for (let index = 0; index < this.mintTemplates.length; index++) {
          const template = this.mintTemplates[index];
          {
            const result = KernelHash.checkStakeKernelHash(
              template,
              futureTime,
              this.getModifier(futureTime)
            );

            if (result.success) {
              if (
                !template.FutureStakes.find(
                  (t) => t.FutureTimestamp === futureTime
                )
              ) {
                let raw = "" as string | null;
                if (startoptions.generateRawCoinStake) {
                  const createtc = new CreateRawCoinStake(startoptions.url);

                  raw = await createtc.createRawCoinstakeTransaction(
                    template.Txid,
                    template.Vout,
                    startoptions.redeemscript,
                    startoptions.peercoinAddress,
                    parseFloat(
                      (result.FutureUnits / PeercoinMint.coin).toFixed(6)
                    ),
                    result.FutureTimestamp,
                    startoptions.minterpubkeyAddress
                  );
                }

                template.FutureStakes.push({
                  DayStamp: result.DayStamp,
                  FutureTimestamp: result.FutureTimestamp,
                  FutureUnits: result.FutureUnits,
                  MaxDifficulty: result.MaxDifficulty,
                  RawTransaction: !!raw ? raw : null,
                } as FutureStake);

                this.trigger++;
              }
            }
          }
        }

        if (
          futureTime - startTime <= 1 ||
          futureTime === endTill ||
          futureTime % (1 * 3600) === 0
        ) {
          this.progressFindstake = Math.max(
            0.0,
            Math.min(
              100,
              (100.0 * (futureTime - startTime)) / (1.0 * (endTill - startTime))
            )
          );

          await this.delay(300);
        }
        futureTime++;
      } while (futureTime <= endTill);
      this.findstakeDone = true;
      this.trigger++;
      (this as any).eventBus.emit("add-toastr", {
        text: `  ${
          this.unspentTransactions!.unspents.length
        } Findstake completed`,
        type: "success",
      });
    },

    async collectVouts(address: string): Promise<void> {
      try {
        this.unspentTransactions = new UnspentTransactions(address);
        await this.unspentTransactions.collect(
          this.onCheckUnspent,
          this.doToastr
        );

        await this.collectTemplates(
          this.unspentTransactions!.address,
          this.unspentTransactions!.unspents
        );

        if (this.unspentTransactions!.unspents.length > this.max)
          (this as any).eventBus.emit("add-toastr", {
            text: `Please reduce ${
              this.unspentTransactions!.unspents.length
            } transactions from ${address} to a max of ${
              this.max
            } to find stake with.`,
            type: "warn",
          });
      } catch (error) {
        console.error(error);
        (this as any).eventBus.emit("add-toastr", {
          text: `Unable to reach blockbook.peercoin.net`,
          type: "error",
        });
      }
    },

    delay(n: number): Promise<void> {
      return new Promise(function (resolve) {
        setTimeout(resolve, n);
      });
    },

    async collectTemplates(
      address: string,
      unspents: IUnspent[]
    ): Promise<void> {
      this.progressTemplates = unspents.length === 0 ? 100 : 0;
      const newmintTemplates = [] as Array<MintTemplate>;

      for (let index = 0; index < unspents.length; index++) {
        try {
          const unspent = unspents[index];
          const id = "to" + unspent.tx + "_" + unspent.index;

          const blockheight = unspent.blockheight;

          const block = await this.blocks!.getBlockByHeight(blockheight);
          const transaction = block!.getTransaction(unspent.tx);
          const output = transaction!.vout.find((v) => v.n === unspent.index);
          const template = new MintTemplate(
            id,
            address,
            block!.time,
            transaction!.offset,
            transaction!.time,
            output!.n,
            output!.units,
            blockheight,
            block.hash
          );
          //console.log(template);

          newmintTemplates.push(template);
          if (index % 100 === 0) await this.delay(250);
        } catch (error) {
          console.warn(error);
        }
        const percent = (100.0 * (index + 1)) / unspents.length;

        if (percent - this.progressTemplates > 0.9 || percent > 99.9)
          this.progressTemplates = Math.min(100.0, Math.max(percent, 0.0));
      }
      if (newmintTemplates.length === 0) {
        (this as any).eventBus.emit("add-toastr", {
          text: `0 unspent transactions from ${address} found`,
          type: "warn",
        });
      }
      this.allMintTemplates = newmintTemplates;

      if (newmintTemplates.length > this.max) {
        // stay empty
      } else {
        this.mintTemplates = newmintTemplates;
      }
    },

    doToastr(text: string, toastrType: string) {
      (this as any).eventBus.emit("add-toastr", {
        text: text,
        type: toastrType,
      });
    },

    onCheckUnspent(percentage: number) {
      this.progressGetVouts = percentage;
    },
  },
});
</script>

<style lang="scss" scoped>
.bodyview {
  min-height: 550px;
}

.greenwrapcontainer {
  padding: 15px;
  margin-bottom: 20px;
  border: 0x solid transparent;
  border-radius: 10px;

  color: #fff;
  background-color: #3cb054;
  border-color: #faebcc;
}
.headericon {
  color: #fff;
  &:hover {
    cursor: pointer;
    position: relative;
    top: -2px;
  }
}

.results-title {
  color: #3cb054;
  font-size: 1.7rem;
  font-weight: 400;
  &.smaller {
    font-size: 1.4rem;
  }
}
</style>
