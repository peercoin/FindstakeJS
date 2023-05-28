<template>
  <div class="Site-content" ref="sitecontent">
    <div :style="centeredWhenCapped">
      <FindstakeMain :innerwidth="actualInnerWidth" v-slot="slotProps">
        <Toastr />
        <PageHeader title="FindstakeJS" @on-home-click="slotProps.homeClick" />
      </FindstakeMain>
    </div>

    <PageFooter :innerheigth="heightApp" :innerwidth="actualInnerWidth" />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onUnmounted, onMounted } from "vue";
import debounce from "lodash/debounce";
import FindstakeMain from "./components/FindstakeMain.vue";
import Toastr from "./components/Toastr.vue";
import PageHeader from "./components/PageHeader.vue";
import PageFooter from "./components/PageFooter.vue";
const heightApp = ref<number>(0);
const widthApp = ref<number>(0);
const actualInnerWidth = ref<number>(0);
const deboucedGetDimension = ref<any>(null);
const resizeObserver = ref<any>(null);
const sitecontent = ref<HTMLDivElement | null>(null);

onMounted(() => {
  getDimensions();

  deboucedGetDimension.value = debounce(getDimensions, 500);

  resizeObserver.value = new ResizeObserver(() => {
    getDimensions();
  });
  resizeObserver.value.observe(document.body);
});

onUnmounted(() => resizeObserver.value.unobserve(document.body));

const centeredWhenCapped = computed<object>(() => {
  if (
    actualInnerWidth.value > 0 &&
    actualInnerWidth.value - widthApp.value > 1
  ) {
    const offset = Math.floor(0.5 * (actualInnerWidth.value - widthApp.value));
    return {
      position: "relative",
      left: offset + "px",
    };
  }

  return {};
});

function getDimensions() {
  heightApp.value = sitecontent.value!.clientHeight; // El. width minus scrollbar
  actualInnerWidth.value = document.body.clientWidth; // El. width minus scrollbar width
  widthApp.value = sitecontent.value!.offsetWidth;
}
</script>

<style lang="scss">
@import "../node_modules/typeface-roboto/index.css";

@import "../node_modules/bootstrap/scss/functions";
//@import "my-bootstrap5-variables.scss";
@import "../node_modules/bootstrap/scss/variables";
@import "../node_modules/bootstrap/scss/mixins";
@import "../node_modules/bootstrap/scss/maps";
@import "../node_modules/bootstrap/scss/utilities";

// see node_modules/bootstrap/scss/bootstrap.scss
@import "../node_modules/bootstrap/scss/root";
@import "../node_modules/bootstrap/scss/reboot";
@import "../node_modules/bootstrap/scss/type";
@import "../node_modules/bootstrap/scss/buttons";
@import "../node_modules/bootstrap/scss/containers";
@import "../node_modules/bootstrap/scss/grid";
@import "../node_modules/bootstrap/scss/forms";
//@import "../node_modules/bootstrap/scss/spinners";
@import "../node_modules/bootstrap/scss/helpers";
@import "../node_modules/bootstrap/scss/list-group";
@import "../node_modules/bootstrap/scss/progress";
@import "../node_modules/bootstrap/scss/utilities/api";

#app {
  font-family: "Roboto", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  min-height: 100vh;
}

html {
  font-family: "Roboto", sans-serif;
  font-size: 18px;
  font-weight: 400;
  line-height: 1.7;
  -webkit-text-size-adjust: 100%;
  color: #ffffff;
  //height: 100%;
  // min-height: 100%;
  background-color: #efefef !important;
}

body {
  font-family: "Roboto", sans-serif;
  font-size: 1rem;
  background-color: #efefef !important;
  min-height: 100vh;
}

.Site-content {
  min-height: 100vh;
  max-width: 1000px;
}

.btn-success {
  color: #fff;
  border-radius: 8px;
  background-color: #3cb054;
  border-color: #fff;
  &:hover {
    position: relative;
    top: -2px;
    color: #ffffff;
    background-color: #3cb054;
    border-color: #fff;
  }
}

.btn-success:not(:disabled):not(.disabled) {
  background-color: #3cb054;
}
.btn-success:disabled {
  background-color: #3cb054;
  border-color: #fff;
}

.btn-outline-success {
  border-width: 1;
  color: #3cb054;
  border-radius: 8px;
  border-color: #3cb054;
  &:hover {
    position: relative;
    top: -2px;
    background-color: #ffffff;
    color: #3cb054;
  }
}

.btn-outline-success:not(:disabled):not(.disabled) {
  background-color: #ffffff;
}

.vue-slider-process {
  background-color: #046424 !important;
}

.appinput {
  color: #fff;
  background-color: transparent !important;
  border: 0;
  outline: 0;
  background: transparent;
  border-radius: 0px;
  border-bottom: 2px solid #fff;
  padding: 5px 5px 0px 5px;
  &:focus {
    box-shadow: none;
    border-color: #fff;
    color: #fff;
  }
  &:focus-visible {
    background-color: #3cb054 !important;
  }
  &.invalid {
    border-bottom: 2px solid rgb(223, 98, 98);
  }
}

.appinput-label-container {
  width: 100%;
}

.appinput-label {
  font-size: 70%;
  font-weight: 600;
}

/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}
</style>
