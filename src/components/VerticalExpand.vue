<template>
  <transition
    name="expand"
    @after-enter="afterEnter"
    @enter="enter"
    @leave="leave"
  >
    <slot></slot>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  methods: {

    afterEnter(element: HTMLElement) {
      element.style.height = "auto";
    },

    enter(element: HTMLElement) {
      element.classList.add("expandable");
      const { width } = getComputedStyle(element);

      element.style.width = width;
      element.style.position = "absolute";
      element.style.visibility = "hidden";
      element.style.height = "auto";

      const { height } = getComputedStyle(element);

      element.style.removeProperty("width");
      element.style.removeProperty("position");
      element.style.removeProperty("visibility");
      element.style.height = "0";

      getComputedStyle(element).height;

      setTimeout(() => {
        element.style.height = height;
      });
    },

    leave(element: HTMLElement) {
      const { height } = getComputedStyle(element);

      element.style.height = height;

      getComputedStyle(element).height;

      setTimeout(() => {
        element.style.height = "0";
      });
    },
  },
});
</script>

<style scoped>
.expandable > * {
  will-change: height;
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}
</style>

<style>
.expand-enter-active,
.expand-leave-active {
  transition: height 0.3s ease-in-out;
  overflow: hidden;
  transition-property: opacity, height;
}

.expand-enter,
.expand-leave-to {
  height: 0;
  opacity: 0;
}
</style>
