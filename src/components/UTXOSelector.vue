<template>
  <div>
    <p class="page-title smaller mt-2">SELECT AT MOST {{ max }} UTXO TO CONTINUE</p>

    <div v-if="1 === 1" class="row justify-content-between my-4 g-0">
      <div class="col-md-6 pe-md-2 mt-3">
        <div class="selectbiggest" @click.stop="selectTop">
          SELECT TOP <strong>{{ max }}</strong>
        </div>
      </div>
      <div class="col-md-6 ps-md-2 mt-3">
        <div
          class="conituebiggest"
          @click.stop="onContinueClick"
          :class="{
            clickable: numberOfSelected <= max && numberOfSelected > 0,
            'invalid-value': numberOfSelected > max || numberOfSelected < 1,
          }"
        >
          CONTINUE WITH <strong>{{ numberOfSelected }}</strong>
        </div>
      </div>
    </div>

    <div v-if="!!staketemplates" class="tbl-content">
      <table cellpadding="0" cellspacing="0" class="tbl-header-head">
        <tr v-for="item in orderedMintTemplates" :key="item.Id">
          <td>
            <CheckboxToggle
              v-model="item.Selected"
              :show-labels="true"
              :label-checked="item.Name"
              :label-unchecked="item.Name"
            />
          </td>
          <td :title="item.Txid">
            {{ formatId(item.Txid) }} <span class="p-4">{{ item.Vout }}</span>
          </td>
          <td class="to-upper">
            {{ formatNumber(item.PrevTxOutValue * 0.000001, 6) }}
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { MintTemplate } from "../implementation/MintTemplate";
import CheckboxToggle from "./CheckboxToggle.vue";

import cloneDeep from "lodash/cloneDeep";

export default defineComponent({
  emits: ["utxo-selected"],

  components: {
    CheckboxToggle,
  },

  props: {
    staketemplates: {
      type: Object as PropType<Array<MintTemplate>>,
      default: [],
    },
    max: {
      type: Number,
      default: 25,
    },
  },

  data() {
    return {
      local_staketemplates: cloneDeep(this.staketemplates),
    };
  },

  methods: {
    selectTop() {
      for (let index = 0; index < this.orderedMintTemplates.length; index++) {
        const element = this.orderedMintTemplates[index];

        element.Selected = index < this.max;
      }
    },

    onContinueClick(): void {
      if (this.numberOfSelected <= this.max && this.numberOfSelected > 0)
        this.$emit(
          "utxo-selected",
          this.local_staketemplates.filter((t) => t.Selected)
        );
    },

    formatId(txid: string): string {
      return !!txid
        ? txid.slice(0, 7) + "..." + txid.substring(txid.length - 7)
        : "";
    },

    formatNumber(coins: number, fix: number): string {
      return "" + parseFloat(coins.toFixed(fix));
    },
  },

  computed: {
    numberOfSelected(): number {
      if (!!this.local_staketemplates) {
        return this.local_staketemplates.filter((t) => t.Selected).length;
      }
      return 0;
    },

    orderedMintTemplates(): Array<MintTemplate> {
      //assumed the array !isEmpty
      let results = this.local_staketemplates; //.slice();
 

      return results.sort((
        ob1: {
          PrevTxOutValue: number;
        },
        ob2: { PrevTxOutValue: number }
      ): number => {
        if (ob1.PrevTxOutValue > ob2.PrevTxOutValue) {
          return -1;
        } else if (ob1.PrevTxOutValue < ob2.PrevTxOutValue) {
          return 1;
        }
        return 0;
      });
    },
  },
});
</script>

<style lang="scss">
$table-bg: #3cb054;

.clickable {
  &:hover {
    cursor: pointer;
    background-color: #3cb054;
    color: white;
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
// .clickable:hover {
//   background-color: rgba(255, 255, 255, 0.3);
//   cursor: pointer;
// }
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

.page-title {
  color: #3cb054;
  font-size: 1.7rem;
  font-weight: 400;
  &.smaller {
    font-size: 1.4rem;
  }
}

.selectbiggest {
  padding-bottom: 7px;
  padding-top: 7px;

  border: 1px solid #3cb054;
  // background-color: #fff;
  text-align: center;
  opacity: 1;
  font-size: 14px;
  color: #3cb054;
  border-radius: 8px;
  &:hover {
    cursor: pointer;
    background-color: #3cb054;
    color: white;
  }
}
.conituebiggest {
  padding-bottom: 7px;
  padding-top: 7px;

  border: 1px solid #3cb054;
  // background-color: #fff;
  text-align: center;
  opacity: 1;
  font-size: 14px;
  color: #3cb054;
  border-radius: 8px;
  //   &:hover {
  //     cursor: pointer;
  //     background-color: #3cb054;
  //     color: white;
  //   }
}
.invalid-value {
  color: red;
}
</style>
