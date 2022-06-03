<template>
  <div class="notifications" :style="styles">
    <transition-group name="vn-fade" @after-leave="clean">
      <div
        v-for="item in active"
        class="notification-wrapper"
        :key="item.id"
        :data-id="item.id"
      >
        <div :class="notifyClass(item)" @click="destroy(item)">
          <div class="notification-content" v-html="item.text"></div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    group: {
      type: String,
      default: "",
    },
    width: {
      type: [Number, String],
      default: 380,
    },
    max: {
      type: Number,
      default: Infinity,
    },
    classes: {
      type: String,
      default: "vue-notification",
    },
  },

  data: () => {
    return {
      list: [] as any[],
      duration: 7000,
      speed: 300,
      IDLE: 0,
      DESTROYED: 2,
    };
  },

  created() {
    (this as any).eventBus.on("add-toastr", this.addItem);
  },

  beforeUnmount() {
    (this as any).eventBus.off("add-toastr", this.addItem);
  },

  computed: {
    actualWidth() {
      return Number(this.width);
    },
    active() {
      return this.list.filter((v) => v.state !== this.DESTROYED);
    },
    styles() {
      const width = this.actualWidth;
      const suffix = "px";

      return {
        width: width + suffix,
        top: "0px",
        left: `calc(50% - ${width / 2}${suffix})`,
      };
    },
  },

  methods: {
    newId() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0,
            v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      );
    },

    addItem(event: any) {
      event.group = event.group || "";

      if (this.group !== event.group) {
        return;
      }

      if (event.clean || event.clear) {
        this.destroyAll();
        return;
      }

      let { title, text, type, data } = event;

      let item = {
        id: this.newId(),
        title,
        text,
        type,
        state: this.IDLE,
        speed: this.speed,
        length: this.duration + 2 * this.speed,
        data,
        timer: null as any,
      };

      if (this.duration >= 0) {
        item.timer = setTimeout(() => {
          this.destroy(item);
        }, item.length);
      }

      let indexToDestroy = -1;

      this.list.unshift(item);

      if (this.active.length > this.max) {
        indexToDestroy = this.active.length - 1;
      }

      if (indexToDestroy !== -1) {
        this.destroy(this.active[indexToDestroy]);
      }
    },

    notifyClass: function (item: any) {
      return ["notification", this.classes, item.type];
    },

    destroy(item: any) {
      clearTimeout(item.timer);
      item.state = this.DESTROYED;
      this.clean();
    },

    destroyAll() {
      this.active.forEach(this.destroy);
    },
    clean: function () {
      this.list = this.list.filter((v) => v.state !== this.DESTROYED);
    },
  },
});
</script>

<style lang="scss">
.notifications {
  border-radius: 4px;
  display: block;
  position: fixed;
  z-index: 5000;
}

.notification-wrapper {
  display: block;
  overflow: hidden;
  width: 100%;
  margin: 0;
  padding: 0;
  transition: "all 300ms";

  &:hover {
    cursor: pointer;
  }
}

.notification {
  display: block;
  box-sizing: border-box;
  background: white;
  text-align: left;
}

.vue-notification {
  border: 1px solid transparent;
  border-radius: 0.25rem;
  font-family: "clear_sans_regular", "arial", sans-serif;
  font-size: 0.8rem;
  font-weight: 400;

  padding: 10px;
  margin: 0 5px 5px;
  padding-left: 40px;
  padding-top: 13px;
  padding-bottom: 16px;
  color: white;
  background: #44a4fc;
  box-shadow: 0 0 10px #000;
}

.vue-notification.warn {
  background: #ffb648;
}

.vue-notification.error {
  background: #f2dede;
  color: rgb(184, 103, 102);
}
.vue-notification.success {
  background: #dff0d8;
  color: #517e56;
}

.vn-fade-enter-active,
.vn-fade-leave-active,
.vn-fade-move {
  transition: all 0.5s;
}

.vn-fade-enter,
.vn-fade-leave-to {
  opacity: 0;
}
</style>
