<template>
  <div
    class="loading-screen"
    v-if="loading"
    :class="classes"
    :style="{ backgroundColor: bc }"
  >
    <component v-if="customLoader" :is="customLoader"></component>
    <div v-else>
      <div v-if="!!text" class="loading-circle"></div>
      <p v-if="!!text" class="loading-text">{{ text }}</p>
    </div>
  </div>
</template>



<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    loading: Boolean,
    text: String,
  },

  data() {
    return {
      dark: false,
      classes: null,

      background: null,
      customLoader: null,
    };
  },

  computed: {
    bc() {
      return (
        this.background ||
        (this.dark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.42)")
      );
    },
  },
});
</script>

<style lang="scss" scoped>
.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9300;
  flex-direction: column;
  user-select: none;
  background-color: rgb(24, 109, 21)!important;
  opacity: 0.5;
}
.loading-circle {
  width: 50px;
  height: 50px;
  border-radius: 100%;
  border: 2px solid transparent;
  border-left-color: #ababab;
  animation: circleanimation 0.45s linear infinite;
}
.loading-text {
  margin-top: 15px;
  color: #2c2f2b;
  font-size: 14px;
  font-weight: 200%;
  text-align: center;
}
@keyframes circleanimation {
  from {
    transform: rotateZ(0deg);
  }
  to {
    transform: rotateZ(360deg);
  }
}
</style>
