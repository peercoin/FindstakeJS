import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
//     import firebase from 'firebase';//////////////
import App from "./App.vue";
import router from "./router";
import VueI18n from "vue-i18n";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import Moment from "moment";
Moment.locale("en");
Vue.prototype.$moment = Moment;

Vue.config.productionTip = false;


const initWindow = function(window:any) {
  var timeouts = [] as any[];
  var messageName = "zero-timeout-message";

  // Like setTimeout, but only takes a function argument.  There's
  // no time argument (always zero) and no arguments (you have to
  // use a closure).
  function setZeroTimeout(fn: Function, _t:any) {
    timeouts.push(fn);
    window.postMessage(messageName, "*");
  }

  function handleMessage(event:any) {
    if (event.source == window && event.data == messageName) {
      event.stopPropagation();
      if (timeouts.length > 0) {
        var fn = timeouts.shift();
        fn();
      }
    }
  }

  window.addEventListener("message", handleMessage, true);

  // Add the one thing we want added to the window object.
  window.setZeroTimeout = setZeroTimeout;
};
initWindow(window);


Vue.use(BootstrapVue);
Vue.use(VueI18n);

const messages = {
  en: {
    message: {
      title: "Peercoin Findstakejs",
      subtitle: "see if your coins will mint in the next few days...",
      "Last-known-difficulty": "Last known difficulty:",
      "Findstake-available": "Finding your stakes untill ",
      progressstart: "Findstake started",
      progressnok: "unable to retrieve modifier data.",
      progressStarting: "Starting...",
      progressDataOk: "Data successfully retrieved",
      go: "GO",
      stop: "STOP",
      PeercoinAddress: "Peercoin Address",
      results: "results",
      messages: "messages",
      "mint-time": "mint time",
      "max-difficulty": "max difficulty",
      stake: "stake",
      fininshed: "Done!",
      Nounspentoutputs: "No unspent outputs found."
    }
  },
  "zh-cn": {
    message: {
      title: "点点币权益检查FindStakeJS",
      subtitle: "检查您在接下来几天里是否可以挖到币...",
      "Last-known-difficulty": "上一个难度：",
      "Findstake-available": "权益检查是可用的，直到  ",
      progressstart: "权益检查开始",
      progressnok: "不能够提取到modifier数据",
      progressStarting: "开始...",
      progressDataOk: "数据成功提取",
      go: "开始",
      stop: "停止",
      PeercoinAddress: "点点币地址",
      results: "结果",
      messages: "消息",
      "mint-time": "挖币时间",
      "max-difficulty": "最大难度",
      stake: "权益",
      fininshed: "完成！",
      Nounspentoutputs: "没有找到未花费的输出"
    }
  }
};

const i18n = new VueI18n({
  locale: "en", // set locale
  messages // set locale messages
});


let fbtest=null as any;
 
/*
    // Initialize Firebase
    const arr1=["hello","world"];
    let config = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
      databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_PROJECT_ID.appspot.com",
      messagingSenderId: "YOUR_MESSAGING_SEND_ID"
    };
    firebase.initializeApp(config);
    firebase
      .auth()
      .signInWithEmailAndPassword(arr1[0], arr1[1])
      .catch(function(error) {
      });
    firebase.auth().onAuthStateChanged((user) => {
      if (!fbtest && !!user) {
*/

    ///////////////////////////////////////////////////////////////////////////////
    fbtest = new Vue({
      router,
      i18n,
      render: h => h(App)
    }).$mount("#app");
    ///////////////////////////////////////////////////////////////////////////////

/*
        }
      });
*/

 