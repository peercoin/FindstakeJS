import { createApp } from "vue";
import App from "./App.vue";
import mitt from "mitt";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  // faQuestionCircle,
  // faArrowCircleLeft,
  faChevronDown,
  faChevronUp,
  faTimesCircle,
  faLink,
} from "@fortawesome/free-solid-svg-icons";
import {
  faGithub,
  faTelegramPlane,
  faDiscord,
} from "@fortawesome/free-brands-svg-icons";
library.add(
  faDiscord,
  // faQuestionCircle,
  faGithub,
  faTelegramPlane,
  //faTimes,
  //faArrowCircleLeft,
  faTimesCircle,
  faChevronDown,
  faChevronUp,
  faLink
);

import "vue-slider-component/theme/default.css";

const eventBus = mitt();
const app = createApp(App);
app.config.globalProperties.eventBus = eventBus;

app
  //   .use(router)
  //   .use(store)
  .mount("#app");

//todo: what does this do
//import "bootstrap/dist/js/bootstrap.js"
