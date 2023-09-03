<template>
  <div>
    <div class="connectinfobox mb-1 px-3">
      <div class="container">
        <div class="row gx-0">
          <div class="col-3 text-start"></div>
          <div class="col-6 fw-bold">FIND OUT WHEN TO STAKE YOUR COINS</div>
          <div class="col-3 text-end"></div>
        </div>

        <VerticalExpand>
          <div v-if="connected">
            <div class="row">
              <div class="col-12">
                <input
                  id="lastBlockinp"
                  class="form-control appinput"
                  type="text"
                  v-model="lastBlock"
                  :readonly="true"
                />
                <div class="appinput-label-container text-start">
                  <label for="lastBlockinp" class="form-label appinput-label"
                    >CURRENT BLOCK</label
                  >
                </div>
              </div>
              <div class="col-12">
                <input
                  id="lastDifficultyinp"
                  class="form-control appinput"
                  type="text"
                  :value="lastDifficulty"
                  :readonly="true"
                />
                <div class="appinput-label-container text-start">
                  <label
                    for="lastDifficultyinp"
                    class="form-label appinput-label"
                    >CURRENT DIFFICULTY</label
                  >
                </div>
              </div>
            </div>

            <div class="row mt-3">
              <div class="col-12">
                <kprogress
                  status="success"
                  type="line"
                  :show-text="false"
                  :line-height="4"
                  color="#fff"
                  bg-color="#adb5bd"
                  :percent="percentBlocks"
                >
                </kprogress>
                <div class="text-start appinput-label">GET STAKEMODIFIERS</div>
              </div>
            </div>

            <div class="row mt-2">
              <div class="col-12">
                <input
                  id="peercoinAddressinp"
                  class="form-control appinput"
                  :class="{ invalid: !validPPCAddress }"
                  type="text"
                  v-model="peercoinAddress"
                  :readonly="addressEntered || step > 3"
                />
                <div class="appinput-label-container text-start">
                  <label
                    for="peercoinAddressinp"
                    class="form-label appinput-label"
                    >PEERCOIN ADDRESS</label
                  >
                </div>
              </div>
            </div>
          </div>
        </VerticalExpand>

        <VerticalExpand>
          <div
            v-if="connected && validPPCAddress && !addressEntered"
            class="row"
          >
            <div class="col-md-2 my-2"></div>

            <div class="col-md-8 my-2 text-center">
              <button
                type="button"
                class="btn btn-success mt-1 mb-3"
                @click="getVouts"
              >
                GET UNSPENTS
              </button>
            </div>

            <div class="col-md-2 my-2"></div>
          </div>
        </VerticalExpand>

        <div
          v-if="connected && validPPCAddress && addressEntered"
          class="row mt-3"
        >
          <div class="col-12">
            <kprogress
              status="success"
              type="line"
              :show-text="false"
              :line-height="4"
              color="#fff"
              bg-color="#adb5bd"
              :percent="progressGetVouts"
            >
            </kprogress>
            <div class="text-start appinput-label">
              GET UNSPENTS FROM BLOCKBOOK.PEERCOIN.NET
            </div>
          </div>
        </div>

        <VerticalExpand>
          <div
            v-if="
              connected &&
              validPPCAddress &&
              addressEntered &&
              progressGetVouts > 99.9
            "
            class="row mt-4"
          >
            <div class="col-12">
              <kprogress
                status="success"
                type="line"
                :show-text="false"
                :line-height="4"
                color="#fff"
                bg-color="#adb5bd"
                :percent="progressTemplates"
              >
              </kprogress>
              <div class="text-start appinput-label">
                COLLECT UNSPENT TRANSACTION DATA
              </div>
            </div>
          </div>
        </VerticalExpand>

        <VerticalExpand>
          <div
            class="mt-3"
            v-if="
              connected &&
              step >= 3 &&
              progressTemplates > 99.9 &&
              validPPCAddress
            "
          >
            <vue-slider
              v-model="dateRangeValues"
              :min-range="3600 * 4"
              :enable-cross="false"
              :disabled="findingStakes"
              :min="1800 + Math.floor(0.001 * new Date().getTime())"
              :max="3600 * 24 * 20 + Math.floor(0.001 * new Date().getTime())"
            >
              <template v-slot:tooltip="{ value, focus }">
                <div :class="['custom-tooltip', { focus }]">
                  {{ formatLongDate(value, false) }}
                </div>
              </template>
            </vue-slider>
            <div class="appinput-label text-start mt-1">SEARCH RANGE</div>
          </div>
        </VerticalExpand>

        <VerticalExpand>
          <div
            v-if="
              connected &&
              step >= 3 &&
              progressTemplates > 99.9 &&
              validPPCAddress
            "
            class="row gx-0 mt-3"
          >
            <div
              :class="{
                'col-6': isP2SHaddress,
                'col-12': !isP2SHaddress,
              }"
            >
              <input
                id="minDifficultyinp"
                class="form-control appinput"
                :class="{ invalid: !(minDifficulty > lastDifficulty - 3.0) }"
                type="number"
                v-model.number="minDifficulty"
                :readonly="findingStakes"
              />
              <div class="appinput-label-container text-start">
                <label for="minDifficultyinp" class="form-label appinput-label"
                  >MINIMUM DIFFICULTY</label
                >
              </div>
            </div>

            <div
              v-if="validPPCAddress && isP2SHaddress"
              class="col-6 my-2 px-5"
            >
              <CheckboxToggle
                :model-value="generateRawCoinStake"
                @update:model-value="toggleRaw"
                :show-labels="true"
                label-checked="PROVIDE COINTOOLKIT LINK"
                label-unchecked="HIDE COINTOOLKIT LINK"
              />
            </div>
          </div>
        </VerticalExpand>

        <VerticalExpand>
          <div
            v-show="
              step >= 3 && progressTemplates > 99.9 && generateRawCoinStake
            "
          >
            <div class="row mt-2">
              <div class="col-12">
                <textarea
                  ref="redeemarea"
                  id="redeemscriptinp"
                  class="form-control appinput"
                  :class="{ invalid: !redeemscript }"
                  :style="heightTextArea"
                  placeholder="532102633a97eab667d...fb63e4b117800a6838c6eb0f0e881b55ae"
                  v-model="redeemscript"
                  :readonly="step < 2"
                ></textarea>
                <div class="appinput-label-container text-start">
                  <label for="redeemscriptinp" class="form-label appinput-label"
                    >REDEEM SCRIPT COLD MINT</label
                  >
                </div>
              </div>
            </div>

            <div class="row mt-2">
              <div class="col-12">
                <input
                  id="minterpubkeyAddressinp"
                  class="form-control appinput"
                  :class="{ invalid: !validPubkeyAddress }"
                  type="text"
                  placeholder="[0-9a-f]{130}"
                  v-model="minterpubkeyAddress"
                  :readonly="step < 2"
                />
                <div class="appinput-label-container text-start">
                  <label
                    for="minterpubkeyAddressinp"
                    class="form-label appinput-label to-upper"
                    >UNCOMPRESSED PUBLIC KEY MINTER</label
                  >
                </div>
              </div>
            </div>

            <div class="row mt-2">
              <div class="col-12">
                <input
                  id="minterreward"
                  class="form-control appinput"
                  :class="{ invalid: (minterReward < 0) }"
                  type="text"
                  placeholder="enter reward for minter"
                  v-model.number="minterReward"
                  :readonly="step < 2"
                />
                <div class="appinput-label-container text-start">
                  <label
                    for="minterreward"
                    class="form-label appinput-label to-upper"
                    >REWARD MINTER</label
                  >
                </div>
              </div>
            </div>
          </div>
        </VerticalExpand>

        <VerticalExpand>
          <div v-show="showStart" class="row">
            <div class="col-md-2 my-2"></div>

            <div class="col-md-8 my-2 text-center">
              <button
                type="button"
                class="btn btn-success mt-1 mb-3"
                @click="findstakes"
                :disabled="!enableStart"
              >
                START FINDSTAKE
              </button>
            </div>

            <div class="col-md-2 my-2"></div>
          </div>
        </VerticalExpand>

        <VerticalExpand>
          <div v-if="connected && findingStakes" class="row my-4">
            <div class="col-12">
              <kprogress
                status="success"
                type="line"
                :show-text="false"
                :line-height="4"
                color="#fff"
                bg-color="#adb5bd"
                :percent="progressFindstake"
              >
              </kprogress>
              <div class="text-start appinput-label to-upper">
                FIND STAKES TILL
                {{
                  new Date(
                    new Date(1000 * dateRangeValues[1]).getTime()
                  ).toLocaleDateString("en-us", {
                    weekday: "long",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                }}
              </div>
            </div>
          </div>
        </VerticalExpand>

        <div v-if="!connected && showDiscord" class="row my-3">
          <div class="col-12">
            <input
              id="proxyurl"
              class="form-control appinput"
              :class="{ invalid: !isValidDiscordURL }"
              type="text"
              v-model="discordurl"
              :readonly="step > 1"
            />
            <div class="appinput-label-container text-start">
              <label for="proxyurl" class="form-label appinput-label"
                >URL WalletProxy</label
              >
            </div>
          </div>
        </div>

        <div v-if="!connected" class="row my-3">
          <div class="col-12">
            <input
              id="proxyhost"
              class="form-control appinput"
              :class="{ invalid: !rpchost }"
              type="text"
              v-model="rpchost"
              :readonly="step > 1"
            />
            <div class="appinput-label-container text-start">
              <label for="proxyhost" class="form-label appinput-label"
                >RPC hostname</label
              >
            </div>
          </div>
        </div>

        <div v-if="!connected" class="row my-3">
          <div class="col-12">
            <input
              id="proxyuser"
              class="form-control appinput"
              :class="{ invalid: !rpcuser }"
              type="text"
              v-model="rpcuser"
              :readonly="step > 1"
            />
            <div class="appinput-label-container text-start">
              <label for="proxyuser" class="form-label appinput-label"
                >RPC username</label
              >
            </div>
          </div>
        </div>

        <div v-if="!connected" class="row my-3">
          <div class="col-12">
            <input
              id="proxypassword"
              class="form-control appinput"
              :class="{ invalid: !rpcpassword }"
              type="text"
              v-model="rpcpassword"
              :readonly="step > 1"
            />
            <div class="appinput-label-container text-start">
              <label for="proxypassword" class="form-label appinput-label"
                >RPC password</label
              >
            </div>
          </div>
        </div>

        <div v-if="!connected" class="row my-3">
          <div class="col-12">
            <input
              id="proxyport"
              class="form-control appinput"
              :class="{ invalid: !rpcport }"
              type="text"
              v-model.number="rpcport"
              :readonly="step > 1"
            />
            <div class="appinput-label-container text-start">
              <label for="proxyport" class="form-label appinput-label"
                >RPC port</label
              >
            </div>
          </div>
        </div>

        <div v-if="!connected" class="row">
          <div class="col-md-2 my-2"></div>

          <div class="col-md-8 my-2 text-center">
            <button
              type="button"
              class="btn btn-success mt-1 mb-3"
              @click="connect"
            >
              Connect with wallet
            </button>
          </div>

          <div class="col-md-2 my-2"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, type PropType, nextTick } from "vue";
import { JsonRPCClient } from "../implementation/JsonRPCClient";
import kprogress from "./kprogress.vue";
import { MintTemplate } from "../implementation/MintTemplate";
import { CryptoUtils } from "../implementation/CryptoUtils";
import VerticalExpand from "./VerticalExpand.vue";
import CheckboxToggle from "./CheckboxToggle.vue";
import VueSlider from "vue-slider-component";
import { getToastr } from "../implementation/ToastrContainer";
const toastr = getToastr();
const emit = defineEmits<{
  (
    e: "connectionData",
    data: {
      lastBlock: number;
      urlDiscordProxy: string;
      lastDifficulty: number;
      rpcClient: JsonRPCClient;
      rpchost: string;
      rpcuser: string;
      rpcpassword: string;
      rpcport: number;
      minterReward: number;
    }
  ): void;
  (e: "peercoinaddressentered", value: string): void;
  (e: "rawTxToggle", value: boolean): void;
  (
    e: "started",
    value: {
      generateRawCoinStake: boolean;
      minDifficulty: number;
      minterpubkeyAddress: string;
      redeemscript: string;
      start: number;
      end: number;
      client: JsonRPCClient;
      peercoinAddress: string;
    }
  ): void;
}>();

const props = defineProps({
  percentBlocks: {
    Type: Number,
    required: true,
    default: 0,
  },
  innerwidth: {
    Type: Number,
    required: true,
    default: 0,
  },
  step: {
    type: Number,
    default: 0,
  },
  templates: {
    type: Object as PropType<Array<MintTemplate>>,
    default: [],
  },
  progressGetVouts: {
    type: Number,
    default: 0,
  },
  progressTemplates: {
    type: Number,
    default: 0,
  },
  progressFindstake: {
    type: Number,
    default: 0,
  },
  startBlock: {
    type: Number,
    default: 0,
  },
  currentBlock: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 25,
  },
});

const dateRangeValues = ref<Array<number>>([
  3600 + Math.floor(0.001 * new Date().getTime()),
  7 * 24 * 3600 + Math.floor(0.001 * new Date().getTime()),
]);
const connected = ref<boolean>(false);
const addressEntered = ref<boolean>(false);
const generateRawCoinStake = ref<boolean>(false);
const findingStakes = ref<boolean>(false);
const lastBlock = ref<number>(0);
const lastDifficulty = ref<number>(0);
const minDifficulty = ref<number>(0);
const minterReward = ref<number>(0);
const peercoinAddress = ref<string>("");
const minterpubkeyAddress = ref<string>("");
const redeemscript = ref<string>("");
const redeemscriptDfeault = ref<string>("");
const discordurl = ref<string>("http://127.0.0.1:9009");
const rpchost = ref<string>("127.0.0.1");

const rpcuser = ref<string>("");
const rpcpassword = ref<string>("");
const rpcport = ref<number>(9902);
const redeemarea = ref<HTMLTextAreaElement | null>(null);
const showDiscord = computed<boolean>(() => {
  let queryString = window.location.search;
  let urlParams = new URLSearchParams(queryString);
  return (
    urlParams.has("pushToDiscord") && urlParams.get("pushToDiscord") === "1"
  );
});

const validPPCAddress = computed<boolean>(() => {
  if (!!peercoinAddress.value) {
    return CryptoUtils.isValidAddress(peercoinAddress.value, "prod");
  }

  return false;
});

const validPubkeyAddress = computed<boolean>(() => {
  if (!!minterpubkeyAddress.value) {
    const regex = new RegExp("[0-9a-f]{130}$", "gm");

    return !!minterpubkeyAddress.value.match(regex);
  }

  return false;
});

const redeemTextareaHeight = computed<number>(() => {
  const trigger = redeemscript.value;
  try {
    //let _refs = this.$refs as any;

    let area = redeemarea.value; // El. width minus scrollbar

    return Math.max(50, parseInt("" + area!.scrollHeight * 1.05)) || 50;
  } catch (error) {
    return 120;
  }
});

const enableStart = computed<boolean>(() => {
  return (
    showStart.value &&
    props.step >= 5 &&
    props.percentBlocks > 99.9 &&
    props.currentBlock === lastBlock.value
  );
});

const heightTextArea = computed<{ height: string }>(() => {
  return {
    height: redeemTextareaHeight.value + "px",
  };
});

const showStart = computed<boolean>(() => {
  let valid =
    props.progressTemplates >= 50 &&
    !findingStakes.value &&
    validPPCAddress &&
    !!props.templates &&
    props.templates.length > 0 &&
    props.templates.length <= props.max &&
    !!minDifficulty.value &&
    minDifficulty.value > lastDifficulty.value - 3.0;

  if (!valid) return valid;

  return generateRawCoinStake.value
    ? validPubkeyAddress && !!redeemscript.value
    : valid;
});

const isP2SHaddress = computed<boolean>(() => {
  if (validPPCAddress.value) {
    return peercoinAddress.value.charAt(0) === "p";
  }

  return false;
});

// const stakemodifiersCollected = computed<boolean>(() => {
//   return props.currentBlock > 100 && props.currentBlock == lastBlock.value;
// });

const isValidDiscordURL = computed<boolean>(() => {
  const regex = new RegExp(
    "(localhost|\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)(?::\\d{0,4})?\\b)",
    "g"
  );
  return regex.test(discordurl.value);
});

function toggleRaw(newval: boolean) {
  if (!!newval) {
    nextTick(() => {
      redeemscript.value = redeemscriptDfeault.value;
    });
  }
  generateRawCoinStake.value = newval;
  emit("rawTxToggle", newval);
}

function getVouts(): void {
  if (!!peercoinAddress.value) {
    addressEntered.value = true;
    emit("peercoinaddressentered", peercoinAddress.value);
  }
}

function formatLongDate(
  timestamp: number,
  longFormat: boolean = false
): string {
  const options = longFormat
    ? ({
        weekday: "short", // long, short, narrow
        day: "numeric", // numeric, 2-digit
        year: "numeric", // numeric, 2-digit
        month: "short", // numeric, 2-digit, long, short, narrow
        hour: "numeric", // numeric, 2-digit
        minute: "numeric", // numeric, 2-digit
        second: "numeric", // numeric, 2-digit
      } as Intl.DateTimeFormatOptions)
    : ({
        day: "2-digit", // numeric, 2-digit

        month: "2-digit", // numeric, 2-digit, long, short, narrow
        hour: "2-digit", // numeric, 2-digit
        minute: "numeric", // numeric, 2-digit
      } as Intl.DateTimeFormatOptions);

  return new Date(timestamp * 1000).toLocaleString(
    Intl.DateTimeFormat().resolvedOptions().locale,
    options
  );
}

async function connect() {
  //const url="http://"+rpchost.value+":"+rpcport.value;
  try {
    const client = new JsonRPCClient(
      rpchost.value,
      rpcuser.value,
      rpcpassword.value,
      rpcport.value,
      true
    );
    lastBlock.value = await client.getBlockCount();
    let difficulty = await client.getDifficulty();
    lastDifficulty.value = parseFloat(difficulty.toFixed(5));
    minDifficulty.value = parseFloat((lastDifficulty.value + 0.25).toFixed(2));
    connected.value = true;

    emit("connectionData", {
      rpcClient: client,
      urlDiscordProxy: discordurl.value, //todo rename discordurl
      rpchost: rpchost.value,
      rpcuser: rpcuser.value,
      rpcpassword: rpcpassword.value,
      rpcport: rpcport.value,
      lastBlock: lastBlock.value,
      lastDifficulty: lastDifficulty.value,
      minterReward: minterReward.value,
    });
  } catch (error) {
    console.warn(error);
    const url = "http://" + rpchost.value + ":" + rpcport.value;
    toastr.error(`Unable to connect to ${url}`);
  }
}

async function findstakes() {
  if (!findingStakes.value) {
    const client = new JsonRPCClient(
      rpchost.value,
      rpcuser.value,
      rpcpassword.value,
      rpcport.value,
      true
    );
    emit("started", {
      generateRawCoinStake: generateRawCoinStake.value,
      minDifficulty: minDifficulty.value,
      minterpubkeyAddress: minterpubkeyAddress.value,
      redeemscript: redeemscript.value,
      start: dateRangeValues.value[0],
      end: dateRangeValues.value[1],
      client: client,
      peercoinAddress: peercoinAddress.value,
    });
    findingStakes.value = true;
  }
}
</script>

<style lang="scss" scoped>
.connectinfobox {
  padding: 15px;
  margin-bottom: 20px;
  border: 0x solid transparent;
  border-radius: 10px;

  color: #fff;
  background-color: #3cb054;
  border-color: #faebcc;
}
.to-upper {
  text-transform: uppercase;
}

.custom-tooltip {
  transform: translateY(5px);
  color: #fff;
  background-color: #3cb054;
  font-size: 10px;
  white-space: nowrap;
}
.custom-tooltip.focus {
  font-weight: bold;
}
</style>
