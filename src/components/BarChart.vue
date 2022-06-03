<template>
  <svg
    :width="fullSvgWidth"
    :height="fullSvgHeight"
    aria-labelledby="title"
    role="img"
  >
    <title v-if="title" id="title">{{ title }}</title>
    <g
      :transform="`translate(0,${showYAxis ? extraTopHeightForYAxisLabel : 0})`"
    >
      <g
        :transform="`translate(${showYAxis ? yAxisWidth : 0},0)`"
        :width="innerChartWidth"
        :height="innerChartHeight"
      >
        <g
          v-for="bar in chartData"
          :key="bar.index"
          :transform="`translate(${bar.x},0)`"
        >
          <title>
            <slot name="title" :bar="bar" > <tspan>{{
              bar.tooltipLabel || bar.staticValue
            }}</tspan> </slot>
          </title>
          <rect
            @click.stop="onBarClick(bar)"
            :width="bar.width"
            :height="bar.height"
            :x="2"
            :y="bar.yOffset"
            :style="{ fill: bar.barColor }"
            class="bar"
          />
          <text
            v-if="showValues"
            :x="bar.midPoint"
            :y="bar.yOffset"
            :dy="`${bar.height < 22 ? '-5px' : '15px'}`"
            text-anchor="middle"
            :style="{
              fill: bar.height < 22 ? bar.textColor : bar.textAltColor,
              font: textFont,
            }"
          >
            {{ bar.staticValue }}
          </text>
          <g v-if="showXAxis">
            <slot
              name="label"
              :bar="bar"
              :text-style="{ fill: textColor, font: textFont }"
            >
              <text
                :x="bar.midPoint"
                :y="`${bar.yLabel + 10}px`"
                text-anchor="middle"
                :style="{ fill: textColor, font: textFont }"
              >
                {{ bar.label }}
              </text>
            </slot>
            <line
              :x1="bar.midPoint"
              :x2="bar.midPoint"
              :y1="innerChartHeight + 3"
              :y2="innerChartHeight"
              stroke="#555555"
              stroke-width="1"
            />
          </g>
        </g>
      </g>
      <g v-if="showXAxis">
        <line
          :x1="showYAxis ? yAxisWidth - 1 : 2"
          :x2="innerChartWidth + yAxisWidth"
          :y1="innerChartHeight"
          :y2="innerChartHeight"
          stroke="#555555"
          stroke-width="1"
        />
      </g>
      <g v-if="showYAxis">
        <line
          :x1="yAxisWidth - 1"
          :x2="yAxisWidth - 1"
          :y1="innerChartHeight"
          y2="0"
          stroke="#555555"
          stroke-width="1"
        />
        <g v-for="tick in getTicks()" :key="tick.key">
          <line
            :x1="tick.x1"
            :y1="tick.y1"
            :x2="tick.x2"
            :y2="tick.y2"
            stroke="#555555"
            stroke-width="1"
          />
          <text
            x="0"
            :y="tick.yText"
            alignment-baseline="central"
            :style="{ fill: textColor, font: textFont }"
          >
            {{ tick.text }}
          </text>
        </g>
      </g>
    </g>
  </svg>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  emits: ["bar-clicked"],

  props: {
    title: { type: String, default: "" },
    points: { type: Array, default: () => [] as any[] },
    height: { type: Number, default: 100 },
    width: { type: Number, default: 300 },
    showYAxis: { type: Boolean, default: false },
    showXAxis: { type: Boolean, default: false },
    labelHeight: { type: Number, default: 12 },
    showTrendLine: { type: Boolean, default: false },
    trendLineColor: { type: String, default: "green" },
    trendLineWidth: { type: Number, default: 2 },
    easeIn: { type: Boolean, default: true },
    showValues: { type: Boolean, default: false },
    maxYAxis: { type: Number, default: 0 },
    animationDuration: { type: Number, default: 0.5 },
    barColor: { type: String, default: "deepskyblue" },
    textColor: { type: String, default: "black" },
    textAltColor: { type: String, default: "black" },
    textFont: { type: String, default: "10px sans-serif" },
    useCustomLabels: { type: Boolean, default: false },
    customLabels: { type: Array, default: () => [] },
  },

  data() {
    return {
      dynamicPoints: [] as any[],
      staticPoints: [] as any[],
      extraTopHeightForYAxisLabel: 4,
      extraBottomHeightForYAxisLabel: 4,
      digitsUsedInYAxis: 0,
    };
  },

  watch: {
    dataPoints(updatedPoints) {
      this.tween(updatedPoints);
    },
  },

  created() {
    if (this.easeIn) {
      this.tween(this.dataPoints);
    } else {
      this.dynamicPoints = this.dataPoints;
      this.staticPoints = this.dataPoints;
    }
  },

  methods: {
    y(val: number): number {
      return (val / this.maxDomain) * this.innerChartHeight;
    },

    roundTo(n: number, digits = 0): number {
      let negative = false;
      let number = n;
      if (number < 0) {
        negative = true;
        number *= -1;
      }
      const multiplicator = 10 ** digits;
      number = parseFloat((number * multiplicator).toFixed(11));
      number = parseFloat((Math.round(number) / multiplicator).toFixed(2));
      if (negative) {
        number = parseFloat((number * -1).toFixed(2));
      }
      return number;
    },

    tween(desiredDataArray: any): void {
      //no tween for now
      this.staticPoints = desiredDataArray;
      this.dynamicPoints = desiredDataArray;
    },

    getTicks(): any[] {
      for (let i = 6; i > 0; i -= 1) {
        if (this.maxDomain % i === 0) {
          const shouldForceDecimals = i < 3;
          const numberOfTicks = shouldForceDecimals ? 3 : i;
          this.digitsUsedInYAxis = this.maxDomain
            .toFixed(shouldForceDecimals ? 1 : 0)
            .replace(".", "").length;
          return [...new Array(numberOfTicks + 1)].map((item, key) => {
            const tickValue =
              (this.maxDomain / numberOfTicks) * (numberOfTicks - key);
            const yCoord = (this.innerChartHeight / numberOfTicks) * key;
            return {
              key,
              text: shouldForceDecimals ? tickValue.toFixed(1) : tickValue,
              yText: yCoord < 10 ? 10 : yCoord + 4,
              x1: this.yAxisWidth - 4,
              y1: yCoord,
              x2: this.yAxisWidth - 1,
              y2: yCoord,
            };
          });
        }
      }
      return [];
    },

    onBarClick(bar: any): void {
     // console.log(bar);
      this.$emit("bar-clicked", {
        label: bar.label,
      });
    },
  },

  computed: {
    usingObjectsForDataPoints() {
      return this.points.every((x) => typeof x === "object");
    },

    dataPoints(): any[] {
      return this.usingObjectsForDataPoints
        ? this.points.map((item: any) => item.value)
        : this.points;
    },

    dataLabels(): any {
      return this.points.map((point: any, i: number) => {
        if (this.useCustomLabels) {
          return this.customLabels[i];
        }
        return this.usingObjectsForDataPoints ? point.label : i + 1;
      });
    },
    tooltipLabels(): any {
      return this.points.map((point: any, i: number) => {
        if (this.useCustomLabels) {
          return this.customLabels[i];
        }
        return this.usingObjectsForDataPoints ? point.tooltipLabel : i + 1;
      });
    },
    dataColors() {
      return this.points.map((item: any) => ({
        barColor: item && item.barColor ? item.barColor : this.barColor,
        textColor: item && item.textColor ? item.textColor : this.textColor,
        textAltColor:
          item && item.textAltColor ? item.textAltColor : this.textAltColor,
      }));
    },

    yAxisWidth() {
      return this.digitsUsedInYAxis * 5.8 + 5;
    },

    xAxisHeight() {
      return this.showYAxis
        ? this.labelHeight
        : this.labelHeight +
            this.extraBottomHeightForYAxisLabel +
            this.extraTopHeightForYAxisLabel;
    },

    fullSvgWidth() {
      return this.width;
    },

    fullSvgHeight() {
      return this.height;
    },

    innerChartWidth() {
      return this.showYAxis ? this.width - this.yAxisWidth : this.width;
    },

    innerChartHeight() {
      let chartHeight = this.height;
      if (this.showYAxis) {
        chartHeight -=
          this.extraTopHeightForYAxisLabel +
          this.extraBottomHeightForYAxisLabel;
      }
      if (this.showXAxis) {
        chartHeight -= this.xAxisHeight;
      }
      return chartHeight;
    },

    partitionWidth() {
      return this.innerChartWidth / this.dataPoints.length;
    },

    maxDomain() {
      return this.maxYAxis
        ? this.maxYAxis
        : Math.ceil(Math.max(...this.dataPoints));
    },

    chartData() {
      return this.dynamicPoints.map((dynamicValue, index) => ({
        staticValue: this.staticPoints[index],
        index,
        label: this.dataLabels[index],
        tooltipLabel: this.tooltipLabels[index],
        width: this.partitionWidth - 2,
        midPoint: this.partitionWidth / 2,
        yLabel: this.innerChartHeight + 4,
        x: index * this.partitionWidth,
        xMidpoint: index * this.partitionWidth + this.partitionWidth / 2,
        yOffset: this.innerChartHeight - this.y(dynamicValue),
        height: this.y(dynamicValue),
        barColor: this.dataColors[index].barColor,
        textColor: this.dataColors[index].textColor,
        textAltColor: this.dataColors[index].textAltColor,
      }));
    },
  },
});
</script>
<style lang="scss" scoped>
.bar {
  //fill: none;
  pointer-events: all;
  &:hover {
    cursor: pointer;
  }
}
</style>
