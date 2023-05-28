<template>
  <div>
    <div class="d-sm-none">
      <div
        ref="sitecontentfootersmall"
        class="Site-footer"
        :style="dynamicsmall"
      >
        <div class="container text-center">
          <div class="row my-2">
            <div class="col-12 my-2 text-center">
              <span
                ><a class="footerlink" href="https://peercoin.net"
                  >Peercoin.net</a
                ></span
              >

              <span class="ms-5">
                <a class="footerlink" href="https://talk.peercoin.net"
                  >Forum</a
                ></span
              >
            </div>

            <div class="col-12 my-1 text-center">
              <a href="https://github.com/peercoin/FindstakeJS">
                <v-icon :inverse="true" name="bi-github" />
              </a>
              &nbsp;
              <a href="https://t.me/peercoin">
                <v-icon :inverse="true" name="bi-telegram" />
              </a>
              &nbsp;
              <a href="https://discord.gg/XPxfwtG">
                <v-icon :inverse="true" name="bi-discord" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- sm view or larger: -->

    <div class="d-none d-sm-block">
      <div
        ref="sitecontentfooter"
        class="Site-footer"
        :style="dynamicbigfooter"
      >
        <div class="container text-center">
          <div class="row my-0 py-2">
            <div class="col-sm-6 text-start">
              <span
                ><a class="footerlink" href="https://peercoin.net"
                  >Peercoin.net</a
                ></span
              >

              <span class="ms-5">
                <a class="footerlink" href="https://talk.peercoin.net"
                  >Forum</a
                ></span
              >
            </div>

            <div class="col-sm-6 text-end">
              <a href="https://github.com/peercoin/FindstakeJS">
                <v-icon :inverse="true" name="bi-github" />
              </a>
              &nbsp;
              <a href="https://t.me/peercoin">
                <v-icon name="bi-telegram" :inverse="true" />
              </a>
              &nbsp;
              <a href="https://discord.gg/XPxfwtG">
                <v-icon :inverse="true" name="bi-discord" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, type PropType } from "vue";
import debounce from "lodash/debounce";
const props = defineProps({
  innerwidth: {
    Type: Number,
    required: true,
    default: 0,
  },
  innerheigth: {
    Type: Number,
    required: true,
    default: 0,
  },
});
const sitecontentfootersmall = ref<HTMLDivElement | null>(null);
const sitecontentfooter = ref<HTMLDivElement | null>(null);
const clientHeight = ref<number>(0);
const heightAppfooter = ref<number>(0);
const heightAppfootersmall = ref<number>(0);
const deboucedGetDimension = ref<any>(null);
const resizeObserver = ref<any>(null);

onMounted(() => {
  getDimensions();

  deboucedGetDimension.value = debounce(getDimensions, 500);

  resizeObserver.value = new ResizeObserver(() => {
    getDimensions();
  });
  resizeObserver.value.observe(document.body);
});

onUnmounted(() => resizeObserver.value.unobserve(document.body));

const dynamicbigfooter = computed<object>(() => {
  if (clientHeight.value < props.innerheigth) {
    //does not fit in window
    return {
      width: props.innerwidth + "px",
    };
  }

  return {
    width: props.innerwidth + "px",
    top:
      Math.min(clientHeight.value, props.innerheigth) -
      heightAppfooter.value +
      "px",
  };
});

const dynamicsmall = computed<object>(() => {
  if (clientHeight.value < props.innerheigth) {
    //does not fit in window
    return {
      width: props.innerwidth + "px",
    };
  }

  return {
    width: props.innerwidth + "px",
    top:
      Math.min(clientHeight.value, props.innerheigth) -
      heightAppfootersmall.value +
      "px",
  };
});

function getDimensions() {
  clientHeight.value = document.documentElement.clientHeight;

  heightAppfooter.value = sitecontentfooter.value!.offsetHeight;
  heightAppfootersmall.value = sitecontentfootersmall.value!.offsetHeight;
}
</script>

<style lang="scss" scoped>
.Site-footer {
  background-color: #3cb054;
  color: #ffffff;
  position: absolute;
  &.TestBottom {
    background-color: #8b1e8f;
  }
}
.footerlink {
  color: white;
  text-decoration: none;
}
</style>
