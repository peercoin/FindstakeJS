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
              :innerwidth="props.innerwidth"
              :max="max"
              :percentBlocks="percentBlocks"
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
            :width="Math.max(100, Math.min(900, 0.7 * props.innerwidth))"
            :height="200"
            :show-values="true"
            bar-color="#3cb054"
            @bar-clicked="onBarClicked"
          />

          <div v-show="showDiscord" class="row mx-1 mt-3 bg-light">
            <div class="col-md-8 my-2 discord-title text-start">
              PUSH TO DISCORD <strong>{{ numberOfSelected }}</strong> threads
            </div>

            <div class="col-md-2 my-2 text-center">
              <button
                type="button"
                class="btn btn-success mt-1 mb-3"
                @click="toggleDiscordSelect"
                :disabled="!showDiscord"
              >
                TOGGLE
              </button>
            </div>

            <div class="col-md-2 my-2">
              <button
                type="button"
                class="btn btn-success mt-1 mb-3"
                @click="startThreadToDiscord"
                :disabled="!showDiscord"
              >
                PUSH
              </button>
            </div>
          </div>

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

<script lang="ts" setup>
import { computed, ref, type PropType } from "vue";
import { DiscordPoster } from "../implementation/DiscordPoster";
import BN from "bn.js";
import { JsonRPCClient } from "../implementation/JsonRPCClient";
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
import uniqBy from "lodash/uniqBy";
import VerticalExpand from "./VerticalExpand.vue";
import BarChart from "./BarChart.vue";
import StakeProspects from "./StakeProspects.vue";
import { CryptoUtils } from "../implementation/CryptoUtils";
import UTXOSelector from "./UTXOSelector.vue";
import { CreateRawCoinStake } from "../implementation/CreateRawConstake";
import { PeercoinMint } from "../implementation/PeercoinMint";
import { getToastr } from "../implementation/ToastrContainer";
const toastr = getToastr();
const props = defineProps({
  innerwidth: {
    Type: Number,
    required: true,
    default: 0,
  },
});
const debugSkipCollectModifiers = false; //to skip loading modifiers while debugging
const Findstakelimit = PeercoinMint.getFindstakelimit(); //2592000 - 761920;
const startBlocksDelta = 6 * 24 * (30 + 1); //proposed: 12 * 24 * (21+1)
const max = 750;
let lastIndexModifier = 0;
const pushed2DiscordIds = [] as Array<string>;
const trigger = ref<number>(1);
const findstakeStatus = ref<number>(1);
const urlDiscordProxy = ref<string>("");
const daystamp = ref<string>("");
const lastBlock = ref<number>(0);
const lastDifficulty = ref<number>(0);
const currentBlock = ref<number>(0);
const percentBlocks = ref<number>(0);
const minterReward = ref<number>(0);
const progressGetVouts = ref<number>(0);
const progressTemplates = ref<number>(0);
const progressFindstake = ref<number>(0);
const stakeModifiers = ref<StakeModifiers | null>(null);

const unspentTransactions = ref<UnspentTransactions | null>(null);
const allMintTemplates = ref<Array<MintTemplate>>([]);
const mintTemplates = ref<Array<MintTemplate>>([]);
let blocks = null as BlockCollection | null;
const findstakeRunning = ref<boolean>(false);
const findstakeDone = ref<boolean>(false);

const dayStamp = computed<string>(() => {
  return "" + daystamp.value;
});

const showDiscord = computed<boolean>(() => {
  let queryString = window.location.search;
  let urlParams = new URLSearchParams(queryString);
  return (
    urlParams.has("pushToDiscord") && urlParams.get("pushToDiscord") === "1"
  );
});

const mintTemplatesWithResults = computed<Array<MintTemplate>>(() => {
  let trigger1 = trigger.value;

  let results = uniqBy(
    mintTemplates.value.filter((t) => !isEmpty(t.FutureStakes)).slice(),
    "Id"
  );
  const sortItem = dayStamp.value || "";

  return orderBy(
    results,
    [
      (r) =>
        r.FutureStakes.filter((fs) => fs.DayStamp === sortItem).length * -1,
      (r) => r.PrevTxOutValue * -1,
    ],
    ["asc", "asc"]
  );
});

const numberOfSelected = computed<number>(() => {
  if (!!mintTemplatesWithResults.value) {
    return mintTemplatesWithResults.value.filter((t) => t.Selected).length;
  }
  return 0;
});

const totaltemplates = computed<number>(() => {
  if (!!unspentTransactions.value && !!unspentTransactions.value.unspents) {
    return unspentTransactions.value!.unspents.length;
  }
  return 0;
});

const frequencyPoints = computed<
  Array<{
    label: string;
    value: number;
    tooltipLabel: string;
  }>
>(() => {
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
  if (mintTemplates.value.length === 1) {
    mintTemplates.value[0].FutureStakes.forEach((element) => {
      let point = points.find((p) => p.label === element.DayStamp);
      if (!!point) {
        point.value++;
      }
    });
  } else {
    mintTemplates.value.forEach((template) => {
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
});

const showfrequencyPoints = computed<boolean>(() => {
  if (!!frequencyPoints.value) {
    return frequencyPoints.value.some((p) => p.value > 0);
  }
  return false;
});

const startBlock = computed<number>(() => {
  return lastBlock.value - startBlocksDelta;
});

const wizardStatus = computed<number>(() => {
  if (findstakeDone.value) return 7;
  if (findstakeRunning.value) return 6;
  if (
    totaltemplates.value > 0 &&
    findstakeStatus.value <= 3 &&
    progressGetVouts.value >= 100 &&
    progressTemplates.value > 99.9 &&
    currentBlock.value === lastBlock.value
  ) {
    return 5;
  }

  if (
    totaltemplates.value > 0 &&
    findstakeStatus.value <= 3 &&
    progressGetVouts.value >= 100
  ) {
    return 4;
  }

  if (
    findstakeStatus.value == 2 &&
    !!unspentTransactions.value &&
    !!unspentTransactions.value.address
  ) {
    return 3;
  }
  return findstakeStatus.value;
});

async function startDiscordThread(
  title: string,
  body: string
): Promise<boolean> {
  try {
    var discordClient = new DiscordPoster(urlDiscordProxy.value);
    await discordClient.startDiscordThread(title, body);

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function onHomeClick(): void {
  //todo: reset to defaults, for now refresh page
  window.location.reload();
}

function toggleDiscordSelect(): void {
  mintTemplatesWithResults.value.forEach((mintTemplate) => {
    mintTemplate.Selected = !mintTemplate.Selected;
  });
}

function formatNumber(coins: number, fix: number): string {
  return "" + parseFloat(coins.toFixed(fix));
}

function utxoSelected(list: Array<MintTemplate>): void {
  mintTemplates.value = list;
  allMintTemplates.value = [];
}

async function startThreadToDiscord() {
  for (let index = 0; index < mintTemplatesWithResults.value.length; index++) {
    const staketemplate = mintTemplatesWithResults.value[index];
    const itemExists = pushed2DiscordIds.find((t) => t === staketemplate.Id);
    if (
      !itemExists &&
      staketemplate.Selected &&
      staketemplate.FutureStakes.length > 0
    ) {
      let futureStakes = staketemplate.FutureStakes.slice();
      const sortItem = dayStamp.value || "";
      const stake2push = orderBy(
        futureStakes,
        [
          (fs) => (fs.DayStamp === sortItem ? -1 : 1),
          (fs) => fs.FutureTimestamp,
        ],
        ["asc", "asc"]
      )[0];
      const url =
        "https://peercoin.github.io/cointoolkit/?mode=peercoin&verify=" +
        stake2push.RawTransaction;
      const title =
        stake2push.DayStamp +
        " " +
        staketemplate.Id.slice(-6) +
        " " +
        formatNumber(staketemplate.PrevTxOutValue * 0.000001, 2) +
        " @max" +
        formatNumber(stake2push.MaxDifficulty, 2);
      const result = await startDiscordThread(title, url);
      if (!!result) pushed2DiscordIds.push(staketemplate.Id);
    }
  }
}

function onBarClicked(bar: { label: string }): void {
  daystamp.value = bar.label || "";
}

function getModifier(curtime: number): BN {
  let stakeModifierBytes = [] as number[] | null;
  const tt = curtime - Findstakelimit;
  const max = stakeModifiers.value!.stakemodifiers.length;
  // remember last i
  let start = (lastIndexModifier > 5 && lastIndexModifier < max) ? lastIndexModifier - 5 : 0;

  for (
    let i = start;
    i < max;
    i++
  ) {
    const item = stakeModifiers.value!.stakemodifiers[i];
    if (item.blocktime <= tt) {
      stakeModifierBytes = item.modifierBytes;
      if (lastIndexModifier < max) lastIndexModifier = i;
    } else {
      break;
    }
  }
  return CryptoUtils.fromByteArrayUnsigned(stakeModifierBytes!);
}

function calcPercentBlocks(currentBlock: number): number {
  if (currentBlock < 100) return 0;
  //console.log(currentBlock, startBlock.value);
  let cur = Math.ceil(
    100.0 *
      (currentBlock - startBlock.value) *
      (1.0 / (lastBlock.value - startBlock.value))
  );

  cur = Math.round(cur * 10) / 10;

  return Math.min(100.0, Math.max(0.0, cur));
}

function onStakeModifiersProgress(blocknumber: number): void {
  if (
    lastBlock.value == blocknumber ||
    currentBlock.value < 1000 ||
    currentBlock.value % 64 === 0
  )
    currentBlock.value = blocknumber;

  percentBlocks.value = calcPercentBlocks(blocknumber);
  console.log(percentBlocks.value + " percent of lastest blocks");
}

async function collectStakeModifiers(data: {
  lastBlock: number;
  urlDiscordProxy: string;
  lastDifficulty: number;
  rpcClient: JsonRPCClient;
  rpchost: string;
  rpcuser: string;
  rpcpassword: string;
  rpcport: number;
  minterReward: number;
}) {
  //console.log(data);
  findstakeStatus.value = 2;
  minterReward.value = data.minterReward;
  urlDiscordProxy.value = data.urlDiscordProxy;
  blocks = new BlockCollection(data.rpcClient);
  lastBlock.value = data.lastBlock;
  lastDifficulty.value = data.lastDifficulty;
  stakeModifiers.value = new StakeModifiers(data.rpcClient);

  if (!debugSkipCollectModifiers) {
    await stakeModifiers.value.collect(
      lastBlock.value - startBlocksDelta,
      lastBlock.value,
      onStakeModifiersProgress
    );
  }
  //done collecting:
  findstakeStatus.value = 3;
}

async function delay(n: number): Promise<void> {
  return new Promise(function (resolve) {
    setTimeout(resolve, n);
  });
}

async function collectVouts(address: string): Promise<void> {
  try {
    unspentTransactions.value = new UnspentTransactions(address);
    await unspentTransactions.value.collect(onCheckUnspent, doToastr);

    await collectTemplates(
      unspentTransactions.value!.address,
      unspentTransactions.value!.unspents
    );

    if (unspentTransactions.value!.unspents.length > max) {
      toastr.warning(
        `Please reduce ${
          unspentTransactions.value!.unspents.length
        } transactions from ${address} to a max of ${max} to find stake with.`
      );
    }
  } catch (error) {
    console.error(error);
    toastr.error(`Unable to reach blockbook.peercoin.net`);
  }
}

async function collectTemplates(
  address: string,
  unspents: IUnspent[]
): Promise<void> {
  progressTemplates.value = unspents.length === 0 ? 100 : 0;
  const newmintTemplates = [] as Array<MintTemplate>;

  for (let index = 0; index < unspents.length; index++) {
    try {
      const unspent = unspents[index];
      const id = "to" + unspent.tx + "_" + unspent.index;

      const blockheight = unspent.blockheight;

      const block = await blocks!.getBlockByHeight(blockheight);
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
      if (index % 100 === 0) await delay(250);
    } catch (error) {
      console.warn(error);
    }
    const percent = (100.0 * (index + 1)) / unspents.length;

    if (percent - progressTemplates.value > 0.9 || percent > 99.9)
      progressTemplates.value = Math.min(100.0, Math.max(percent, 0.0));
  }
  if (newmintTemplates.length === 0) {
    toastr.warning(`0 unspent transactions from ${address} found`);
  }
  allMintTemplates.value = newmintTemplates;

  if (newmintTemplates.length > max) {
    // stay empty
  } else {
    mintTemplates.value = newmintTemplates;
  }
}

function doToastr(text: string, toastrType: string): void {
  switch (toastrType) {
    case "success":
      toastr.success(text);
      break;
    case "error":
      toastr.error(text);
      break;
    default:
      break;
  }
}

function onCheckUnspent(percentage: number): void {
  progressGetVouts.value = percentage;
}

async function startRun(startoptions: {
  generateRawCoinStake: boolean;
  minDifficulty: number;
  minterpubkeyAddress: string;
  redeemscript: string;
  start: number;
  end: number;
  client: JsonRPCClient;
  peercoinAddress: string;
}): Promise<void> {
  findstakeRunning.value = true;

  mintTemplates.value.forEach((template) => {
    template.setBitsWithDifficulty(startoptions.minDifficulty);
  });

  await delay(300);

  let futureTime = startoptions.start;
  let startTime = startoptions.start;
  let endTill = startoptions.end;
  do {
    const list = mintTemplates.value;
    for (let index = 0; index < list.length; index++) {
      const template = list[index];
      {
        const result = KernelHash.checkStakeKernelHash(
          template,
          futureTime,
          getModifier(futureTime)
        );

        if (result.success) {
          if (
            !template.FutureStakes.find((t) => t.FutureTimestamp === futureTime)
          ) {
            let raw = "" as string | null;
            if (startoptions.generateRawCoinStake) {
              const createtc = new CreateRawCoinStake(startoptions.client);

              raw = await createtc.createRawCoinstakeTransaction(
                template.Txid,
                template.Vout,
                startoptions.redeemscript,
                startoptions.peercoinAddress,
                parseFloat((result.FutureUnits / PeercoinMint.coin).toFixed(6)),
                result.FutureTimestamp,
                startoptions.minterpubkeyAddress,
                1.0 * minterReward.value
              );
            }

            template.FutureStakes.push({
              DayStamp: result.DayStamp,
              FutureTimestamp: result.FutureTimestamp,
              FutureUnits: result.FutureUnits,
              MaxDifficulty: result.MaxDifficulty,
              RawTransaction: !!raw ? raw : null,
            } as FutureStake);

            trigger.value = trigger.value + 1;
          }
        }
      }
    }

    if (
      futureTime - startTime <= 1 ||
      futureTime === endTill ||
      futureTime % (1 * 3600) === 0
    ) {
      progressFindstake.value = Math.max(
        0.0,
        Math.min(
          100,
          (100.0 * (futureTime - startTime)) / (1.0 * (endTill - startTime))
        )
      );

      await delay(300);
    }
    futureTime++;
  } while (futureTime <= endTill);
  findstakeDone.value = true;
  trigger.value = trigger.value + 1;

  toastr.success(
    `  ${unspentTransactions.value!.unspents.length} Findstake completed`
  );
}
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

.discord-title {
  color: #3cb054;
  font-size: 1.1rem;
  font-weight: 300;
  &:hover {
    cursor: pointer;
  }
}
</style>
