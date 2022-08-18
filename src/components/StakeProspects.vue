<template>
  <div>
    <div class="tbl-header mt-3">
      <table cellpadding="0" cellspacing="0" class="tbl-header-head">
        <thead>
          <tr>
            <th
              @click.stop="copyToClipboard(staketemplate.Txid)"
              :title="staketemplate.Txid"
              class="to-lower clickable"
            >
              {{ txId }}
            </th>
            <th title="UTXO index">{{ staketemplate.Vout }}</th>
            <th title="UTXO value">
              {{
                (
                  Math.round(
                    staketemplate.PrevTxOutValue * 0.000001 * 1000000
                  ) / 1000000
                ).toString()
              }}
            </th>
            <th
              class="clickable"
              @click.stop="
                copyToClipboard('' + orderedFutureStakes[0].FutureTimestamp)
              "
              :title="'' + orderedFutureStakes[0].FutureTimestamp"
            >
              {{ formatLongDate(orderedFutureStakes[0].FutureTimestamp) }}
            </th>
            <th>
              <font-awesome-icon
                v-if="!!orderedFutureStakes[0]?.RawTransaction"
                title="cointoolkit"
                class="mx-3 clickable"
                :icon="['fas', 'link']"
                @click.stop="openToolkit(orderedFutureStakes[0].RawTransaction)"
              />
              <font-awesome-icon
                v-if="!showMore"
                class="clickable"
                title="more"
                :icon="['fas', 'chevron-down']"
                @click.stop="showMore = !showMore"
              />
              <font-awesome-icon
                v-if="showMore"
                class="clickable"
                title="less"
                :icon="['fas', 'chevron-up']"
                @click.stop="showMore = !showMore"
              />
            </th>
          </tr>
        </thead>
      </table>
    </div>

    <VerticalExpand>
      <div v-if="showMore" class="tbl-content">
        <table cellpadding="0" cellspacing="0" class="tbl-header-head">
          <tr v-for="item in orderedFutureStakes" :key="item.FutureTimestamp">
            <td class="to-upper">
              {{ formatLongDate(item.FutureTimestamp) }},
              {{ item.FutureTimestamp }} unix time
            </td>
            <td class="to-upper">
              {{ formatNumber(item.MaxDifficulty, 3) }} max difficulty
            </td>
            <td>
              {{ formatNumber(staketemplate.PrevTxOutValue * 0.000001, 6) }} →
              {{ formatNumber(item.FutureUnits * 0.000001, 6) }}
              <font-awesome-icon
                v-if="!!item?.RawTransaction"
                title="cointoolkit"
                class="mx-3 clickable"
                :icon="['fas', 'link']"
                @click.stop="openToolkit(item?.RawTransaction)"
              />
            </td>
          </tr>
        </table>
      </div>
    </VerticalExpand>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import orderBy from "lodash/orderBy";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { FutureStake, MintTemplate } from "../implementation/MintTemplate";
import VerticalExpand from "./VerticalExpand.vue";

export default defineComponent({
  components: {
    MintTemplate,
    FontAwesomeIcon,
    VerticalExpand,
  },

  props: {
    dayStamp: {
      type: String,
      default: "",
    },
    staketemplate: {
      type: Object as PropType<MintTemplate>,
      default: null,
    },
  },

  data() {
    return {
      showMore: false,
      trigger: 0,
    };
  },

  watch: {
    dayStamp() {
      this.$nextTick(() => {
        this.trigger++;
      });
    },
  },

  computed: {
    txId(): string {
      return !!this.staketemplate.Txid
        ? this.staketemplate.Txid.slice(0, 5) +
            "..." +
            this.staketemplate.Txid.substring(
              this.staketemplate.Txid.length - 5
            )
        : "";
    },

    orderedFutureStakes(): Array<FutureStake> {
      let trigger1 = this.trigger;
      //assumed the array !isEmpty
      let results = this.staketemplate.FutureStakes.slice();
      const sortItem = this.dayStamp || "";

      return orderBy(
        results,
        [
          (fs) => (fs.DayStamp === sortItem ? -1 : 1),
          (fs) => fs.FutureTimestamp,
        ],
        ["asc", "asc"]
      );
      //   return results.sort(sortDaystampFirst);
    },
  },

  methods: {
    copyToClipboard(val: string): void {
      navigator.clipboard.writeText(val);
      (this as any).eventBus.emit("add-toastr", {
        text: val + " copied to clipboard",
        type: "success",
      });
    },

    openToolkit(nw: string | null | undefined) {
      if (!nw) return;

      const url =
        "https://peercoin.github.io/cointoolkit/?mode=peercoin&verify=" + nw;
      window.open(url, "_blank");
    },

    formatLongDate(timestamp: number, longFormat: boolean = true): string {
      return new Date(timestamp * 1000).toLocaleString(
        Intl.DateTimeFormat().resolvedOptions().locale,
        {
          weekday: "short", // long, short, narrow
          day: "numeric", // numeric, 2-digit
          year: "numeric", // numeric, 2-digit
          month: "short", // numeric, 2-digit, long, short, narrow
          hour: "numeric", // numeric, 2-digit
          minute: "numeric", // numeric, 2-digit
          second: "numeric", // numeric, 2-digit
        }
      );
    },
    formatNumber(coins: number, fix: number): string {
      return "" + parseFloat(coins.toFixed(fix));
    },
  },
});
</script>

<style lang="scss">
$table-bg: #3cb054;

.clickable {
  &:hover {
    cursor: pointer;
  }
}

.filler {
  min-height: 11px;
}
.alnright {
  text-align: right;
}
.table-overview {
  opacity: 0.9;
}
h1 {
  font-size: 30px;
  color: rgb(26, 143, 15);
  text-transform: uppercase;
  font-weight: 300;
  text-align: center;
  margin-bottom: 15px;
}
table {
  width: 100%;
  table-layout: fixed;
}
.tbl-header-head {
  border-width: 1;
}
.tbl-header {
  background-color: #fff;
  color: transparent;
}
.tbl-content {
  overflow-x: hidden;
  margin-top: 0px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background-color: $table-bg;
}
th {
  padding: 20px 15px;
  text-align: left;
  font-weight: 500;
  font-size: 12px;
  color: #29881d;
  text-transform: uppercase;
}
.clickable:hover {
  background-color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
}
td {
  padding: 15px;
  text-align: left;
  vertical-align: middle;
  font-weight: 300;
  font-size: 12px;
  color: #fff;
  border-bottom: solid 1px rgba(255, 255, 255, 0.1);
  width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.to-upper {
  text-transform: uppercase;
}
.to-lower {
  text-transform: lowercase;
}
.headertext {
  text-align: left;
  font-weight: 500;
  font-size: 12px;
  color: #29881d;
  text-transform: uppercase;
}
/* for custom scrollbar for webkit browser*/

::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
}
::-webkit-scrollbar-thumb {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
}
</style>
