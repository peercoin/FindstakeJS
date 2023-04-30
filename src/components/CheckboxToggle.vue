<template>
  <div
    class="checkbox-toggle"
    role="checkbox"
    @keydown="toggle"
    @click.stop="toggle"
    tabindex="0"
    :aria-checked="toggled"
  >
    <div class="checkbox-slide" :class="classes">
      <div class="checkbox-switch" :class="classes"></div>
    </div>
    <div v-show="showLabels" class="checkbox-label" v-html="label"></div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";

const emit = defineEmits(["update:modelValue"]);
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  showLabels: {
    type: Boolean,
    default: false,
  },

  labelChecked: {
    type: String,
    default: "",
  },

  labelUnchecked: {
    type: String,
    default: "",
  },
});

const toggled = computed<boolean>(() => {
  return props.modelValue;
});

const classes = computed<object>(() => {
  return {
    checked: toggled.value,
    unchecked: !toggled.value,
    disabled: props.disabled,
  };
});

const label = computed<string>(() => {
  return toggled.value && props.showLabels
    ? props.labelChecked
    : props.labelUnchecked;
});

function toggle(e: any) {
  if (props.disabled || (!!e && e.keyCode === 9)) {
    // not if disabled or tab is pressed
    e.stop();
  }
  emit("update:modelValue", !toggled.value);
}
</script>

<style lang="scss" scoped>
.checkbox-toggle {
  //width: 20em;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  //margin: 0.5em;
}

.checkbox-slide {
  width: 2.4em;
  padding: 0;
  margin: 0;
  border-radius: 0.25em;
  cursor: pointer;
}

.checkbox-switch {
  padding: 0;
  margin: 0;
  width: 1.2em;
  height: 1.2em;
  border-radius: 0.25em;
  background: #fff;
  cursor: pointer;
}

.checkbox-label {
  margin-left: 0.95em;
  font-size: 0.7em;
  font-weight: bold;
}

.checkbox-switch.checked {
  transform: translateX(1.2em);
  transition: all 350ms;
}

.checkbox-switch.unchecked {
  transition: all 350ms;
}

.checkbox-slide.checked {
  transition: all 350ms;
  background: #046424;
}

.checkbox-slide.unchecked {
  transition: all 350ms;
  background: lightgray;
}

.checkbox-switch.disabled {
  cursor: not-allowed;
  background: #8da3ba;
}

.checkbox-slide.disabled {
  cursor: not-allowd;
  background: #e0e0e0;
}
</style>
