<template>
  <div class="k-progress">
    <div class="k-progress-outer">
      <div
        class="k-progress-outer-bg"
        :class="border ? 'k-progress-outer-bg-border' : ''"
        :style="getOuterStyle()"
      ></div>
      <div
        ref="k-progress-linex"
        class="k-progress-outer-line"
        :class="status ? 'k-progress-outer-line-' + status : ''"
        :style="getLineStyle()"
      >
        <div
          v-if="active"
          class="k-progress-outer-line-active"
          :style="getActiveStyle()"
        ></div>
      </div>
      <div
        v-if="type === 'lump'"
        class="k-progress-outer-cut"
        :style="getCutStyle()"
      >
        <div v-for="item in items" :key="item" :style="getCutBarStyle()"></div>
      </div>
    </div>
    <div class="k-progress-text" v-if="showText">
      {{ content }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "KProgress",
  props: {
    percent: {
      type: Number,
      default: 0,
      required: true,
      validator: (val: number) => val >= 0 && val <= 100,
    },
    showText: {
      type: Boolean,
      default: true,
    },
    active: {
      type: Boolean,
      default: false,
    },
    bgColor: {
      type: String,
      default: "#ebeef5",
    },
    cutColor: {
      type: String,
      default: "#ebeef5",
    },
    cutWidth: {
      type: Number,
      default: 1,
    },
    type: {
      type: String,
      default: "line",
      validator: (val: string) => ["line", "lump"].indexOf(val) > -1,
    },
    border: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      validator: (val: string) =>
        ["success", "warning", "error"].indexOf(val) > -1,
    },
    lineHeight: {
      type: Number,
      default: 6,
    },
    color: {
      type: [String, Array, Function],
      default: "",
    },
    colorFlow: {
      type: Boolean,
      default: false,
    },
    flowSecond: {
      type: Number,
      default: 5,
      //validator: (val:number) => (val:number)  => [1, 2, 3, 4, 5, 6].indexOf(val) > -1
    },
    activeColor: {
      type: [String, Array],
      default: "",
    },
    format: Function,
  },
  data() {
    return {
      items: [],
      idNow: "",
    };
  },
  computed: {
    content(): string {
      if (typeof this.format === "function") {
        return this.format(this.percent) || "";
      } else {
        return `${this.percent}%`;
      }
    },
  },
  mounted() {
    if (this.type === "lump") {
      this.countCut();
    }
    this.idNow = this.getUUID();
  },
  methods: {
    getOuterStyle() {
      let result = "";
      result += `background: ${this.bgColor};`;
      result += `height: ${this.lineHeight}px;`;
      return result;
    },

    getLineStyle(): string {
      let result = "";
      result += `width: ${this.percent}%;`;
      result += `height: ${this.lineHeight}px;margin-top: -${this.lineHeight}px;`;
      if (this.color) {
        if (typeof this.color === "string") {
          result += `background: ${this.color};`;
        } else if (Array.isArray(this.color) && this.color.length < 7) {
          // 只取 6 种颜色
          let colors = "";
          let i = this.color.length;
          this.color.map((co, index) => {
            index === i - 1 ? (colors += co) : (colors += co + ", ");
          });
          result += `background: linear-gradient(to right, ${colors});`;
        } else if (typeof this.color === "function") {
          result += `background: ${this.color(this.percent)};`;
        }
      }
      if (!this.border) {
        result += `border-radius: 0px`;
      }
      if (this.colorFlow) {
        result += `animation: kp-flow ${this.flowSecond}s linear infinite`;
      }
      return result;
    },

    getActiveStyle() {
      let result = "";
      if (this.activeColor) {
        if (typeof this.activeColor === "string") {
          result = `background: ${this.activeColor};`;
        }
      }
      return result;
    },

    countCut(): void {
      const that = this as any;
      let kpl = this.$refs["k-progress-linex"] as any;

      let kplSet = setInterval(() => {
        kpl = this.$refs["k-progress-linex"] as any;
        if (!!kpl) {
          clearInterval(kplSet);
          let lno = kpl.offsetWidth / (that.lineHeight + that.cutWidth);
          that.items = [...Array(lno).keys()];
        }
      }, 100);
    },

    getCutStyle() {
      let result = "";
      result += `height: ${this.lineHeight}px; margin-top: -${this.lineHeight}px;`;
      return result;
    },

    getCutBarStyle() {
      let result = "";
      result += `width: ${this.lineHeight}px;`;
      result += `border-right: ${this.cutWidth}px solid ${this.cutColor};`;
      return result;
    },

    getUUID(): string {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0,
            v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      );
    },
  },
});
</script>

<style lang="scss" scoped>
$default-color: #409eff;
$success-color: #67c23a;
$warning-color: #e6a23c;
$error-color: #f56c6c;
.k-progress {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  color: #606266;
  font-size: 14px;
  //margin-right: 8px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  &-outer {
    width: 100%;
    display: inline-block;
    vertical-align: middle;
    box-sizing: border-box;
    margin-right: -55px;
    //padding-right: 50px;
    &-bg {
      width: 100%;
      position: relative;
      &-border {
        border-radius: 100px;
      }
    }
    &-line {
      position: relative;
      background: $default-color;
      border-radius: 100px;
      transition: all 0.4s cubic-bezier(0.08, 0.82, 0.17, 1) 0s;
      &-success {
        background: $success-color;
      }
      &-warning {
        background: $warning-color;
      }
      &-error {
        background: $error-color;
      }
      &-active {
        background: #fff;
        height: inherit;
        border-radius: 10px;
        opacity: 0;
        animation: kp-active 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
        content: "";
      }
    }
    &-cut {
      position: relative;
      display: flex;
    }
  }

  &-text {
    margin-left: 10px;
    display: inline-block;
    vertical-align: middle;
    text-align: left;
    word-break: keep-all;
  }
}

@keyframes kp-active {
  0% {
    width: 0;
    opacity: 0.2;
  }
  30% {
    width: 0;
    opacity: 0.6;
  }
  100% {
    width: 100%;
    opacity: 0;
  }
}

@keyframes kp-flow {
  from {
    filter: hue-rotate(0deg);
  }
  to {
    filter: hue-rotate(360deg);
  }
}
</style>
