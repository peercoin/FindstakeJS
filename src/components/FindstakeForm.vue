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
                :class="{ invalid: !minDifficulty }"
                type="number"
                v-model="minDifficulty"
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

        <div v-if="!connected" class="row my-3">
          <div class="col-12">
            <input
              id="proxyurl"
              class="form-control appinput"
              :class="{ invalid: !isValidURL }"
              type="text"
              v-model="url"
              :readonly="step > 1"
            />
            <div class="appinput-label-container text-start">
              <label for="proxyurl" class="form-label appinput-label"
                >URL WalletProxy</label
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
              Connect with WalletProxy
            </button>
          </div>

          <div class="col-md-2 my-2"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import axios from "axios";
import { defineComponent, PropType } from "vue";
import kprogress from "./kprogress.vue";
import { MintTemplate } from "../implementation/MintTemplate";
import { CryptoUtils } from "../implementation/CryptoUtils";
import VerticalExpand from "./VerticalExpand.vue";
import CheckboxToggle from "./CheckboxToggle.vue";
import VueSlider from "vue-slider-component";
export default defineComponent({
  components: {
    kprogress,
    VerticalExpand,
    CheckboxToggle,
    VueSlider,
  },

  emits: ["connectionData", "peercoinaddressentered", "rawTxToggle", "started"],

  props: {
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
  },

  data() {
    return {
      dateRangeValues: [
        3600 + Math.floor(0.001 * new Date().getTime()),
        7 * 24 * 3600 + Math.floor(0.001 * new Date().getTime()),
      ],
      connected: false,
      addressEntered: false,
      generateRawCoinStake: false,
      findingStakes: false,
      lastBlock: 0,
      lastDifficulty: 0,
      minDifficulty: 0,
      peercoinAddress: "",
      minterpubkeyAddress: "",
      redeemscript: "",
      redeemscriptDfeault: "",
      url: "http://127.0.0.1:9009",
    };
  },

  methods: {
    async connect() {
      try {
        let url = this.url + "/block/count";

        let resp = await axios.get(url);
        if (!!resp.data) {
          this.lastBlock = resp.data as number;
        }

        url = this.url + "/difficulty";

        resp = await axios.get(url);
        if (!!resp.data) {
          this.lastDifficulty = parseFloat(Number(resp.data).toFixed(5));
          this.minDifficulty = parseFloat(
            (this.lastDifficulty + 0.25).toFixed(2)
          );
          this.connected = true;
          this.$emit("connectionData", {
            urlProxy: this.url,
            lastBlock: this.lastBlock,
            lastDifficulty: this.lastDifficulty,
          });
        }
      } catch (error) {
        console.warn(error);

        (this as any).eventBus.emit("add-toastr", {
          text: `Unable to connect to  ${this.url}`,
          type: "error",
        });
      }
    },

    async findstakes() {
      if (!this.findingStakes) {
        this.$emit("started", {
          generateRawCoinStake: this.generateRawCoinStake,
          minDifficulty: this.minDifficulty,
          minterpubkeyAddress: this.minterpubkeyAddress,
          redeemscript: this.redeemscript,
          start: this.dateRangeValues[0],
          end: this.dateRangeValues[1],
          url: this.url,
          peercoinAddress: this.peercoinAddress,
        });
        this.findingStakes = true;
      }
    },

    formatLongDate(timestamp: number, longFormat: boolean = false): string {
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
    },

    toggleRaw(newval: boolean) {
      if (!!newval) {
        this.$nextTick(() => {
          this.redeemscript = this.redeemscriptDfeault;
        });
      }
      this.generateRawCoinStake = newval;
      this.$emit("rawTxToggle", newval);
    },

    getVouts() {
      if (!!this.peercoinAddress) {
        this.addressEntered = true;
        this.$emit("peercoinaddressentered", this.peercoinAddress);
      }
    },
  },

  computed: {
    showStart(): boolean {
      let valid =
        this.progressTemplates >= 50 &&
        !this.findingStakes &&
        this.validPPCAddress &&
        !!this.templates &&
        this.templates.length > 0 &&
        this.templates.length <= this.max &&
        !!this.minDifficulty &&
        this.minDifficulty > this.lastDifficulty - 1.0;

      if (!valid) return valid;

      return this.generateRawCoinStake
        ? this.validPubkeyAddress && !!this.redeemscript
        : valid;
    },

    enableStart(): boolean {
      return (
        this.showStart &&
        this.step >= 5 &&
        this.percentBlocks > 99.9 &&
        this.currentBlock === this.lastBlock
      );
    },

    redeemTextareaHeight(): number {
      const trigger = this.redeemscript;
      try {
        let _refs = this.$refs as any;

        let area = _refs.redeemarea; // El. width minus scrollbar

        return Math.max(50, parseInt("" + area.scrollHeight * 1.05)) || 50;
      } catch (error) {
        return 120;
      }
    },

    heightTextArea(): { height: string } {
      return {
        height: this.redeemTextareaHeight + "px",
      };
    },

    validPPCAddress(): boolean {
      if (!!this.peercoinAddress) {
        return CryptoUtils.isValidAddress(this.peercoinAddress, "prod");
      }

      return false;
    },

    validPubkeyAddress(): boolean {
      if (!!this.minterpubkeyAddress) {
        const regex = new RegExp("[0-9a-f]{130}$", "gm");

        return !!this.minterpubkeyAddress.match(regex);
      }

      return false;
    },

    isP2SHaddress(): boolean {
      if (this.validPPCAddress) {
        return this.peercoinAddress.charAt(0) === "p";
      }

      return false;
    },

    stakemodifiersCollected(): boolean {
      return this.currentBlock > 100 && this.currentBlock == this.lastBlock;
    },

    percentBlocks(): number {
      let cur = Math.ceil(
        100.0 *
          (this.currentBlock - this.startBlock) *
          (1.0 / (this.lastBlock - this.startBlock))
      );

      cur = Math.round(cur * 10) / 10;

      return Math.min(100.0, Math.max(0.0, cur));
    },

    isValidURL(): boolean {
      const regex = new RegExp(
        "(localhost|\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)(?::\\d{0,4})?\\b)",
        "g"
      );

      return regex.test(this.url);
    },
  },
});
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
