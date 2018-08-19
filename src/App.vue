<template>
    <div id="app">
        <b-container fluid class="top-row">
            <div class="mx-auto" style="width: 200px; height: 450px;">
                <div class="p-5"></div>
                <a href="https://peercoin.net/"><b-img class="mt-5" src="../src/assets/logowhite.png" /></a>
            </div>
            <div class="row">
                <div class="col">
                </div>
                <div class="col-8">
                    <div class="row justify-content-between mb-3">
                        <div class="col-4">
                            <b-button size="sm" v-show="curlang==='en'" variant="link" v-on:click="lang('zh-cn')" class="text-link">
                                中文
                            </b-button>
                            <b-button size="sm" v-show="curlang!=='en'" variant="link" v-on:click="lang('en')" class="text-link">
                                English
                            </b-button>
                        </div>
                        <div class="col-4 text-right">
                            <a href="https://github.com/peercoin/FindstakeJS" class="text-link ml-3"><b-img src="../src/assets/GitHub-Mark-Light-32px.png" /></a>
                        </div>
                    </div>
                </div>
                <div class="col">
                </div>
            </div>
        </b-container>
        <b-container class="mt-4 lower-body">
            <div>
                <b-card-group deck class="mb-3">
                    <b-card header="Difficulty" class="text-center" v-if="difficulty>0">
                        <p class="card-text">{{lastknowndifficulty}}</p>
                    </b-card>
                    <b-card header="Height" align="center" v-if="difficulty>0">
                        <p class="card-text">{{lastupdatedblock}}</p>
                    </b-card>
                    <b-card header="Blocktime" align="center" v-if="difficulty>0">
                        <p class="card-text">{{lastknownblocktime}}</p>
                    </b-card>
                </b-card-group>
                <b-card :header="title" align="center" v-if="difficulty>0">
                    <p class="card-text">{{availabilty}}</p>
                </b-card>
                <b-jumbotron class="mt-3" :header="$t('message.title')" :lead="$t('message.subtitle')">
                    <b-form-group v-show="!showtxid" class="mt-2" id="fieldsetHorizontal" horizontal :label-cols="4" breakpoint="md" description="" :label="$t('message.PeercoinAddress')" label-for="inputHorizontal">
                        <b-form-input id="inputHorizontal" :state="isvalidaddr" v-model="address" v-bind:disabled="isRunning" required :placeholder="$t('message.PeercoinAddress')"></b-form-input>
                    </b-form-group>
                    <div v-show="showtxid">
                    <b-form-group class="mt-2" id="fieldsetHorizontal2" horizontal :label-cols="4" breakpoint="md" description="" label="peercoin transaction id" label-for="inputHorizontal2">
                        <b-form-input id="inputHorizontal2" :state="isvalidtxid" v-model="txid" v-bind:disabled="isRunning" required placeholder="peercoin transaction id"></b-form-input>
                    </b-form-group>
                    <b-form-group class="mt-2" id="fieldsetHorizontal3" horizontal :label-cols="4" breakpoint="md" description="" label="peercoin transaction index" label-for="inputHorizontal3">
                      <number-control v-model="txindex" :min="0"></number-control>
                    </b-form-group>
                    </div>

                    <b-btn variant="success" v-on:click="start" v-show="showStart">{{ $t("message.go") }}</b-btn>
                    <b-btn variant="danger" v-on:click="stop" v-show="isRunning">{{ $t("message.stop") }}</b-btn>
                    <b-progress :value="searchperc" :max="max" animated variant="success" class="my-3"></b-progress>                    
                    <p class="text-right"><small>{{progresssubtitle}}</small></p>
                </b-jumbotron>
            </div>
            <b-row>
                <b-col>
                <b-card v-show="arrmintsresults.length>0" no-body :header="'<b>' + $t('message.results')+'</b>'">
                    <b-list-group v-for="(s, id) in arrmintsresults" :key="id">
                        <b-list-group-item class="d-flex justify-content-between align-items-center">
                            {{s.foundstake}} @ {{ $t("message.max-difficulty") }} {{s.mindifficulty}}
                            <b-badge variant="primary" pill>{{s.stake}}</b-badge>
                        </b-list-group-item>
                    </b-list-group>
                </b-card>
                </b-col>
            </b-row>
            <b-row class="mt-4">
                <b-col>
                    <b-card v-show="messages.length>0" no-body :header="'<b>' + $t('message.messages')+'</b>'">
                        <b-list-group flush v-for="(s, id) in messages" :key="id">
                            <b-list-group-item href="#">{{s}}</b-list-group-item>
                        </b-list-group>
                    </b-card>
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script>
import NumberControl from "../src/components/NumberControl.vue";
const BigInteger = require("../lib/BigInteger");
const Peercoin = require("../lib/Peercoin");
/*
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
*/
export default {
  name: "App",
  data: function data() {
    return {
      LastKnownBlocktime: 1,
      LastKnownHeight: 0,
      LastKnownDifficulty: 0,
      MRdata: [], //e.g.[[1425105787,'b6448eaeacd5727a']];
      Findstakelimit: 2592000 - 761920,
      MRdataMap: {},
      Staketemplates: null,
      StakeMinAge : 2592000,
      curlang: "en",
      difficulty: 0,
      lastupdatedblock: 0,
      lastupdatedblocktime: 0,
      isRunning: false,
      messages: [],
      address: "",
      txid: "",
      txindex: 1,
      showtxid: false,
      searchperc: 0,
      progresssubtitle: "",
      pagesubtitle: "",
      stake: "",
      results: "",
      logmessages: "",
      //go: "",
      max: 100,
      arrmints: [] // [{ foundstake: 1318781876, mindifficulty: 989.98198, stake: 324.35 }]
    };
  },
  mounted: function() {
    this.stake = this.$t("message.stake");

    if (!this.showtxid) {
      this.getData("/peercoin/info", this.onGetStatusHandler, () => {
        this.log("unable to retrieve modifier data.");
      });
    } else {
      //////change//////
      const onxstatus = user => {
        this.getData("ppc/status", this.onGetStatusHandler, () => {
          this.log("unable to retrieve modifier data.");
        });
      };
      //ini fb
      ////////////
    }
  },
  methods: {
    onGetStatusHandler: function(data) {
      if (!!data) {
        if (!!data.result && data.data != null) {
          if (data.data.difficulty) {
            this.LastKnownDifficulty = data.data.difficulty;
            this.setdifficulty(data.data.difficulty);
          }

          if (data.data.lastupdatedblock) {
            this.LastKnownHeight = data.data.lastupdatedblock;
            this.setlastupdatedblock(data.data.lastupdatedblock);
          }

          if (data.data.lastupdatedblocktime) {
            this.LastKnownBlocktime = data.data.lastupdatedblocktime;
            this.setlastupdatedblocktime(data.data.lastupdatedblocktime);
          }

          this.MRdata = data.data.blockModifiers;
        } else {
          this.LastKnownDifficulty = data.difficulty;
          this.setdifficulty(data.difficulty);
          this.LastKnownHeight = data.lastupdatedblock;
          this.setlastupdatedblock(data.lastupdatedblock);
          this.LastKnownBlocktime = data.lastupdatedblocktime;
          this.setlastupdatedblocktime(data.lastupdatedblocktime);
          this.MRdata = data.blockModifiers;
        }
      }
    },

    getData: function(path, callback, errcallback) {
      if (this.showtxid) {
       /* get from fb*/
      } else {
        var request = new XMLHttpRequest();
        if (process.env.NODE_ENV !== "production")
          path = "http://localhost:3000" + path;

        request.open("GET", path, true);

        request.onreadystatechange = function() {
          if (this.readyState === 4) {
            if (this.status >= 200 && this.status < 400) {
              var data = JSON.parse(this.responseText);

              callback(data);
            } else {
              if (errcallback) errcallback();
            }
          }
        };

        request.send();
        request = null;
      }
    },
    LookupCallback: function(curtime) {
      let stakeModifier16 = "";
      const tt = curtime - this.Findstakelimit;

      for (let i = 0, max = this.MRdata.length; i < max; i++) {
        if (this.MRdata[i][0] <= tt) {
          stakeModifier16 = this.MRdata[i][1];
        } else {
          break;
        }
      }
      if (!this.MRdataMap[stakeModifier16]) {
        this.MRdataMap[stakeModifier16] = BigInteger.fromByteArrayUnsigned(
          Peercoin.Crypto.hexToBytes(stakeModifier16)
        );
      }
      return this.MRdataMap[stakeModifier16];
    },

    lang: function(lang) {
      this.curlang = lang;
      this.$i18n.locale = lang;
      this.$moment.locale(lang);
      document.title = this.$t("message.title");
    },
    log: function(msg, clear) {
      if (!!clear) {
        for (let i = this.messages.length; i > 0; i--) {
          this.messages.pop();
        }
      }
      this.messages.push(msg);
    },

    logProgress: function(p, time) {
      this.searchperc = this.max * p;
      if (this.searchperc >= this.max) {
        this.stop();
        this.log(this.$t("message.fininshed"));
        this.searchperc = 0;
      }
      this.progresssubtitle = this.todatetime(time);
    },

    start: function() {
      this.logProgress(0.01, "retrieving data...");
      if (this.showtxid) {
        if (this.isvalidtxid && this.txid.length > 0) {
          this.logProgress(0.0001, "retrieving data...");
          let key = "to" + this.txid + "_" + this.txindex;

          this.isRunning = true;

          this.getData("ppcto/" + key, this.onGetUnspentHandler, () => {
            this.isRunning = false;
            this.log("No unspent output found.");
          });
        }
      } else {
        let peercoinaddress = "";
        try {
          let peeradr = new Peercoin.Address(this.address);
          peercoinaddress = peeradr.toString();

          this.getData(
            "/peercoin/" + peercoinaddress + "/unspent",
            this.onGetUnspentHandler,
            () => {
              this.log("No unspent outputs found.");
            }
          );
        } catch (err) {}
      }

      this.isRunning = true;
    },

    stop: function() {
      if (this.Staketemplates != null) this.Staketemplates.stop();
      this.Staketemplates.MaxTime = this.Staketemplates.TxTime + 1111;
      this.isRunning = false;
    },

    onGetUnspentHandler: function(data) {
      if (!!data) {
        ///////
        if (this.showtxid) {
          this.logProgress(0.001, "unspent outputs retrieved.");
          this.Staketemplates = new Peercoin.UnspentOutputsToStake();
          this.Staketemplates.setLookupCallback(this.LookupCallback);

          const dbdata = {
            PrevTxOutValue: data.pv,
            PrevTxOutIndex: data.pi,
            PrevTxOffset: data.po,
            PrevTxTime: data.pt,
            BlockFromTime: data.b
          };

          if (
            dbdata.PrevTxTime + this.StakeMinAge >
            Math.floor(new Date().getTime() / 1000)
          ) {
            this.log("output needs 30 days to mature");
            return;
          }
          this.Staketemplates.add({
            BlockFromTime: dbdata.BlockFromTime,
            StakeModifier: BigInteger.ZERO,
            PrevTxOffset: dbdata.PrevTxOffset,
            PrevTxTime: dbdata.PrevTxTime,
            PrevTxOutIndex: dbdata.PrevTxOutIndex,
            PrevTxOutValue: dbdata.PrevTxOutValue
          });
          this.Staketemplates.setBitsWithDifficulty(
            (this.LastKnownDifficulty | 0) - 1
          ); //decrease diff with 1 to widen chances

          this.logProgress(0.011, "");
          this.log("Data successfully retrieved");
          this.log("Starting...");

          setTimeout(() => {
            this.onGetStarted();
          }, 300);
        } else if (data.result && data.data != null) {
          this.logProgress(0.001, "unspent outputs retrieved.");
          this.Staketemplates = new Peercoin.UnspentOutputsToStake();
          this.Staketemplates.setLookupCallback(this.LookupCallback);

          data.data.forEach((dbdata, index, array) => {
            this.Staketemplates.add({
              BlockFromTime: dbdata.BlockFromTime,
              StakeModifier: BigInteger.ZERO,
              PrevTxOffset: dbdata.PrevTxOffset,
              PrevTxTime: dbdata.PrevTxTime,
              PrevTxOutIndex: dbdata.PrevTxOutIndex,
              PrevTxOutValue: dbdata.PrevTxOutValue
            });

            if (array.length > 0 && index + 1 == array.length) {
              this.Staketemplates.setBitsWithDifficulty(
                (this.lastknowndifficulty | 0) - 1
              ); //decrease diff with 1 to widen chances

              this.logProgress(0.011, "");
              this.log("Data successfully retrieved");
              this.log("Starting...");

              setTimeout(() => {
                this.onGetStarted();
              }, 300);
            }
          });
        }
      } else {
        this.log(
          "No unspent outputs found. Output may not have past 30 days or database may need an update"
        );
      }
    },

    logMint: function(arr) {
      this.arrmints = this.arrmints.concat(arr);
    },

    onGetStarted: function() {
      this.log(this.$t("message.progressstart"), false);

      const startx1 = Math.round(new Date().getTime() / 1000);
      const endx = this.LastKnownBlocktime + this.Findstakelimit - 1;
      this.Staketemplates.setStartStop(startx1, endx);
      this.Staketemplates.findStake(
        this.logMint,
        this.logProgress,
        window.setZeroTimeout
      );
    },

    setSubtext: function(msg) {
      this.pagesubtitle = msg;
    },
    setdifficulty: function(d) {
      this.difficulty = d;
    },
    setlastupdatedblock: function(d) {
      this.lastupdatedblock = d;
    },
    setlastupdatedblocktime: function(d) {
      this.lastupdatedblocktime = d;
    },
    todatetime: function(dt) {
      return this.$moment.unix(dt).format("dddd, MMMM Do YYYY, h:mm:ss a");
    }
  },

  computed: {
    showStart: function() {
      return (
        this.difficulty > 0 &&
        !this.isRunning &&
        (this.hasvalidaddress || (this.isvalidtxid && !!this.txid)) &&
        this.LastKnownBlocktime + this.Findstakelimit - 1 >
          Math.round(new Date().getTime() / 1000)
      );
    },
    title: function() {
      return this.$t("message.title");
    },
    title2: function() {
      return this.$t("message.subtitle");
    },
    availabilty: function() {
      let text = this.$moment
        .unix(this.LastKnownBlocktime + this.Findstakelimit)
        .format("dddd, MMMM Do YYYY, h:mm:ss a");

      return this.$t("message.Findstake-available") + text;
    },
    lastknownblocktime: function() {
      return this.$moment
        .unix(this.lastupdatedblocktime)
        .format("MMMM Do YYYY, h:mm");
    },
    lastknowndifficulty: function() {
      return this.difficulty.toFixed(1);
    },
    isvalidaddr: function() {
      if (this.address == "") return true;
      return this.hasvalidaddress;
    },
    isvalidtxid: function() {
      if (this.txid == "") return true;

      const re = new RegExp("^[a-fA-F0-9]{64}$");
      if (re.test(this.txid)) {
        return true;
      }
      return false;
    },
    hasvalidaddress: function() {
      try {
        var peeradr = new Peercoin.Address(this.address);
        let peercoinaddress = peeradr.toString();
      } catch (err) {
        return false;
      }
      return true;
    },
    hasstakes: function() {
      return this.arrmints.length > 0;
    },
    found: function() {
      return this.arrmints.length;
    },
    arrmintsresults: function() {
      let mpfoundstakes = {};
      let tmp = [];
      this.arrmints.forEach(result => {
        const keydups = "fs" + this.$moment.unix(result.foundstake).format("X");
        if (mpfoundstakes[keydups] == null) {
          mpfoundstakes[keydups] = true;

          tmp.push({
            foundstake: this.$moment
              .unix(result.foundstake)
              .format("dddd, MMMM Do YYYY, h:mm:ss a"),
            mindifficulty: result.mindifficulty.toFixed(1),
            stake: result.stake.toFixed(2)
          });
        }
      });

      return tmp;
    }
  },
  components: {
    NumberControl
  }
};
</script>

<style>
body {
  background-color: #ffffff;
}
.top-row {
  background-color: rgba(60, 176, 84, 1);
}
.btn-link,
.text-link {
  color: #cffcc6 !important;
}
.text-link:focus,
text-link:hover {
  color: #fafafa !important;
}
.btn-link:hover {
  color: #fafafa;
  text-decoration: none;
}
.lower-body {
  background-color: #ffffff;
}
</style>
