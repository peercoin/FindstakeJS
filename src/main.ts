import { createApp } from "vue";
import App from "./App.vue";
import mitt from "mitt";
import { OhVueIcon, addIcons } from "oh-vue-icons";
import {
  FaFlag,
  LaExternalLinkAltSolid,
  BiChevronDoubleDown,
  BiChevronDoubleUp,
  BiGithub,
  BiTelegram,
  BiDiscord,
  FaGamepad,
} from "oh-vue-icons/icons";

addIcons(
  FaFlag,
  LaExternalLinkAltSolid,
  BiChevronDoubleDown,
  BiChevronDoubleUp,
  BiGithub,
  BiTelegram,
  BiDiscord,
  FaGamepad
);

import "vue-slider-component/theme/default.css";

const eventBus = mitt();
const app = createApp(App);
app.config.globalProperties.eventBus = eventBus;
app.component("v-icon", OhVueIcon);
app
  //   .use(router)
  //   .use(store)
  .mount("#app");

//todo: what does this do
//import "bootstrap/dist/js/bootstrap.js"
