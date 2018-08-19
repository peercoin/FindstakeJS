<template>
  <div class="control number">
        <button class="decrement-button" :disabled="decrementDisabled" @click="decrement">−</button>
        <button class="increment-button" :disabled="incrementDisabled" @click="increment">+</button>
        <input
            type="number"
            :disabled="inputDisabled"
            :min="min"
            :max="max"
            :step="step"
            v-model.number="currentValue"
            @blur="currentValue = value"
            @keydown.esc="currentValue = value"
            @keydown.enter="currentValue = value"
            @keydown.up.prevent="increment"
            @keydown.down.prevent="decrement"
        />
    </div>
</template>

<script>
export default {
  props: {
    disabled: Boolean,
    max: {
      type: Number,
      default: Infinity
    },
    min: {
      type: Number,
      default: -Infinity
    },
    value: {
      required: true
    },
    step: {
      type: Number,
      default: 1
    }
  },

  data() {
    return {
      currentValue: this.value,
      decrementDisabled: false,
      incrementDisabled: false,
      inputDisabled: false
    };
  },

  watch: {
    value(val) {
      this.currentValue = val;
    }
  },

  methods: {
    increment() {
      if (this.disabled || this.incrementDisabled) {
        return;
      }

      let newVal = this.currentValue + 1 * this.step;
      this.decrementDisabled = false;

      this._updateValue(newVal);
    },
    decrement() {
      if (this.disabled || this.decrementDisabled) {
        return;
      }

      let newVal = this.currentValue + -1 * this.step;
      this.incrementDisabled = false;

      this._updateValue(newVal);
    },
    _updateValue(newVal) {
      const oldVal = this.currentValue;

      if (oldVal === newVal || typeof this.value !== "number") {
        return;
      }
      if (newVal <= this.min) {
        newVal = this.min;
        this.decrementDisabled = true;
      }
      if (newVal >= this.max) {
        newVal = this.max;
        this.incrementDisabled = true;
      }
      this.currentValue = newVal;
      this.$emit("input", this.currentValue);
    }
  },

  mounted() {
    if (this.value == this.min) {
      this.decrementDisabled = true;
    }
  }
};
</script>

<style>

.control.number {
  display: inline-flex;
  margin-bottom: 1rem;
  position: relative;
  width: 100%;
  max-width: calc(180 / 16 * 1rem);
}
.control.number input {
  border: 1px solid #e9ecef;
  border-radius: 3px;
  font-size: .875rem;
  flex: 1 0;
  line-height: 1.65;
  height: 2.5em;
  margin: 0 auto;
  padding-left: .5rem;
  padding-right: calc(82 / 16 * 1rem);
  text-align: left;
  width: 100%;
  max-width: 100%;
  vertical-align: top;
  -moz-appearance: textfield;
}
.control.number input::-webkit-inner-spin-button, .control.number input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.control.number input:focus {
  outline: 0;
  box-shadow: 0 0 0 0.2rem #eeeeee;
}
.control.number button {
  background-color: #fff;
  border: 0px solid #e9ecef;
  border-left-width: 1px;
  border-radius: 0;
  color: #343d46;
  cursor: pointer;
  flex: 0 1;
  font-family: sans-serif;
  font-size: .875rem;
  font-weight: bold;
  line-height: 1.7;
  position: absolute;
  top: .0625rem;
  text-align: center;
  width: 2.5rem;
  
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
  z-index: 5;
}
.control.number button:hover, .control.number button:active, .control.number button:focus {
  border-color: #eeeeee;
  color: #eeeeee;
  outline: none;
}
.control.number button:hover ~ .input {
  border: 1px solid #eeeeee;
}
.control.number button:active ~ .input, .control.number button:focus ~ .input {
  border: 0;
  box-shadow: 0 0 0 0.2rem #eeeeee;
}
.control.number button:disabled, .control.number button.is-disabled {
  color: #adb5bd;
  opacity: 1;
}
.control.number .increment-button {
  border-top-right-radius: 3px;
  border-bottom-right-radius: 3px;
  right: calc(1.5 / 14 * 1rem);
}
.control.number .decrement-button {
  right: calc(41.5 / 14 * 1rem);
}

</style>