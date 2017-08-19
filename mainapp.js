//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////

var moment = require('moment');
var BigInteger = require('./lib/BigInteger');
var Peercoin = require('./lib/Peercoin'); // !!!!!!!!!!!!!!!!!!!!!!!!!!
require('vue');
require('./lib/setZeroTimeout').init(window);
var Language = require('./lib/languagepack');
// In case we forget to take out console statements. IE becomes very unhappy when we forget. Let's not make IE unhappy
if (typeof(console) === 'undefined') {
    var console = {}
    console.log = console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function() {};
}

//youmightnotneedjquery
function ready(fn) {
    if (document.readyState != 'loading') {
        fn();
    } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        document.attachEvent('onreadystatechange', function() {
            if (document.readyState != 'loading')
                fn();
        });
    }
}

/* jsonp.js, (c) Przemek Sobstel 2012, License: MIT */
var $jsonp = (function() {
    var that = {};

    that.send = function(src, options) {
        var options = options || {},
            callback_name = options.callbackName || 'callback',
            on_success = options.onSuccess || function() {},
            on_timeout = options.onTimeout || function() {},
            timeout = options.timeout || 10;

        var timeout_trigger = window.setTimeout(function() {
            window[callback_name] = function() {};
            on_timeout();
        }, timeout * 1000);

        window[callback_name] = function(data) {
            window.clearTimeout(timeout_trigger);
            on_success(data);
        };

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = src;

        document.getElementsByTagName('head')[0].appendChild(script);
    };

    return that;
})();



/*
$jsonp.send('some_url?callback=handleStuff', {
    callbackName: 'handleStuff',
    onSuccess: function(json){
        console.log('success!', json);
    },
    onTimeout: function(){
        console.log('timeout!');
    },
    timeout: 5
});
*/


var $getData = function(path, callback, errcallback) {

    var request = new XMLHttpRequest();
    request.open('GET', path, true);

    request.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status >= 200 && this.status < 400) {
                // Success!
                var data = JSON.parse(this.responseText);

                callback(data);

            } else {
                if (errcallback) errcallback();
                // Error :(
            }
        }
    };

    request.send();
    request = null;
};



window.AppLogger = {};
window.AppLogger.log = function(s, clear) {
    window.App.app.log(s, clear);
};



window.AppLogger.logProgress = function(p, time) {
	p=p*100;
    if (p >= 100)
        AppLogger.logDone();
    else {

        if (time === "" || Object.prototype.toString.call(time) == '[object String]' || isNaN(time))
            window.App.app.logProgress(p, time);
        else
            window.App.app.logProgress(p, moment.unix(time).format('MMMM Do YYYY, h:mm'));
    }
};
window.AppLogger.logDone = function() {
    AppLogger.log(Language.getString('finished', "Finished!"));
};

window.AppLogger.logMint = function(arr) {

    if (window.AppLogger.arrmints == null)
        window.AppLogger.arrmints = [];

    AppLogger.arrmints = AppLogger.arrmints.concat(arr);
    window.App.app.updateresults(AppLogger.arrmints);
};


window.App = {};
App.Staketemplates = null;
App.LastKnownDifficulty = 1;
App.LastKnownHeight = 1;
App.LastKnownBlocktime = 1;
App.Findstakelimit = 2592000 - 761920;
App.MRdataMap = {};
App.MRdataHint = 0;
App.MRdata = null; //e.g.[[1425105787,'b6448eaeacd5727a']];
App.LookupCallback = function(curtime) {
    var stakeModifier16 = '';
    var tt = curtime - App.Findstakelimit;
    var starti = Math.max(0, App.MRdataHint - 1);
    for (var i = starti, max = App.MRdata.length;
        (i < max); i++) {
        if (App.MRdata[i][0] <= tt) {
            stakeModifier16 = App.MRdata[i][1];
            App.MRdataHint = i;
        } else {
            break;
        }
    }
    if (!App.MRdataMap[stakeModifier16]) {
        App.MRdataMap[stakeModifier16] = BigInteger.fromByteArrayUnsigned(Peercoin.Crypto.hexToBytes(stakeModifier16));
    }
    return App.MRdataMap[stakeModifier16];
}

App.onGetStatusHandler = function(data) {
    if (data && data.result && data.data != null) {
        if (data.data.difficulty) {
            window.App.LastKnownDifficulty = data.data.difficulty;
            window.App.app.setdifficulty(data.data.difficulty);
        }

        if (data.data.lastupdatedblock) {
            window.App.LastKnownHeight = data.data.lastupdatedblock;
            window.App.app.setlastupdatedblock(data.data.lastupdatedblock);
        }

        if (data.data.lastupdatedblocktime) {
            window.App.LastKnownBlocktime = data.data.lastupdatedblocktime;
            window.App.app.setlastupdatedblocktime(data.data.lastupdatedblocktime);
        }

        if (data.data.blockModifiers)
            window.App.MRdata = data.data.blockModifiers;

        var text = moment.unix(window.App.LastKnownBlocktime + window.App.Findstakelimit).format("dddd, MMMM Do YYYY, h:mm:ss a");


        setTimeout(function() {
            window.App.app.setSubtext(Language.getString('Findstake-available', 'Findstake is available untill ') + text);

        }, 1300);


    }
};

App.onGetStarted = function() {
    AppLogger.log(Language.getString('progressstart', 'Findstake started'), false);

    var startx1 = Math.round((new Date()).getTime() / 1000);
    var endx = (window.App.LastKnownBlocktime + window.App.Findstakelimit); //moment(document.getElementById("endd").value, "DD-MM-YYYY HH:mm:ss").format("X");

    App.Staketemplates.setStartStop(startx1, endx);
    App.Staketemplates.findStake(window.AppLogger.logMint, window.AppLogger.logProgress, window.setZeroTimeout);

}

App.onGetUnspentHandler = function(data) {
    if (data && data.result && data.data != null) {
        AppLogger.logProgress(0.02, 'unspent outputs retrieved.');
        App.Staketemplates = new Peercoin.UnspentOutputsToStake();
        App.Staketemplates.setLookupCallback(App.LookupCallback);

        data.data.forEach(function(dbdata, index, array) {

            var tpldata = {
                BlockFromTime: dbdata.BlockFromTime,
                StakeModifier: BigInteger.ZERO,
                PrevTxOffset: dbdata.PrevTxOffset,
                PrevTxTime: dbdata.PrevTxTime,
                PrevTxOutIndex: dbdata.PrevTxOutIndex,
                PrevTxOutValue: dbdata.PrevTxOutValue
            };

            App.Staketemplates.add(tpldata);

            if (array.length > 0 && index + 1 == array.length) {
                App.Staketemplates.setBitsWithDifficulty((App.LastKnownDifficulty | 0) - 1); //decrease diff with 1 to widen chances

                AppLogger.logProgress(0.11, '');
                AppLogger.log('Data successfully retrieved');
                AppLogger.log('Starting...');
                //var btn = document.getElementById("actiongo");
                //btn.style.display = 'none';
                //btnFs.style.display = 'block';

                setTimeout(function() {
                    //start!!!
                    App.onGetStarted();
                }, 300);
            }
        });
    } else {
        AppLogger.log('No unspent outputs found. Output may not have past 30 days or database may need an update');
    }
}






window.App.app = new Vue({
    el: '#content',
    methods: {
        log: function(msg, clear) {
            if (clear) {
                for (var i = this.messages.length; i > 0; i--) {
                    this.messages.pop();
                }
            }
            this.messages.push(msg);
        },
        updateresults: function(results) {

            for (var i = this.arrmints.length; i > 0; i--) {
                this.arrmints.pop();
            }
            for (var i = results.length; i > 0; i--) {
                var stake = results.shift();
                this.arrmints.push(stake);
            }

        },
        logProgress: function(p, time) {
            this.searchperc = p | 0;
            this.progresssubtitle = time;
        },
        start: function() {

	        if (!window.App.MRdata || (window.App.LastKnownBlocktime + window.App.Findstakelimit) - 3600 < Math.round((new Date()).getTime() / 1000)) {
	            AppLogger.log('Data either not found or out of date.');

	            return;
	        }

	        if (this.hasvalidaddress) {

	            AppLogger.logProgress(0.01, 'retrieving data...');
	            var peercoinaddress = '';
	            try {
	                var peeradr = new Peercoin.Address(this.address);
	                peercoinaddress = peeradr.toString();
	            } catch (err) {
	                Applogger.log('unknown Peercoin address');
	            }

	            if (peercoinaddress) {
	                App.MRdataHint = 0;
	                $getData("/peercoin/" + peercoinaddress + "/unspent", App.onGetUnspentHandler, function() {
	                    AppLogger.log('No unspent outputs found. Output may not have past 30 days or database may need an update');
	                });

	            }
	        }

            this.isRunning = true;
        },
        stop: function() {



            if (window.Staketemplates != null) 
            	App.Staketemplates.stop();


            var _last = App.Staketemplates.TxTime;
            App.Staketemplates.MaxTime = App.Staketemplates.TxTime + 1111;

            this.isRunning = false;
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
    },
    data: {
        difficulty: 0,
        lastupdatedblock: 0,
        lastupdatedblocktime: 0,
        isRunning: false,
        messages: [],
        address: '',
        searchperc: 0,
        progresssubtitle: '',
        pagesubtitle: '',
        arrmints: [] //[{ foundstake: 1318781876, mindifficulty: 989.98198, stake: 324.35 }]
    },
    computed: {
        lastknownblocktime: function() {
            return moment.unix(this.lastupdatedblocktime).format("MMMM Do YYYY, h:mm");
        },
        lastknowndifficulty: function() {
            return this.difficulty.toFixed(1);
        },
        isvalidaddr: function() {
            if (this.address == '') return true;
            return this.hasvalidaddress;
        },
        hasvalidaddress: function() {
            var peercoinaddress = '';
            try {
                var peeradr = new Peercoin.Address(this.address);
                peercoinaddress = peeradr.toString();
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
            var mpfoundstakes = {};
            var tmp = [];
            this.arrmints.forEach(function(result) {
                var keydups = 'fs' + moment.unix(result.foundstake).format('MM_DD_HH_mm');
                if (mpfoundstakes[keydups] == null) {
                    mpfoundstakes[keydups] = true;
                    var t = moment.unix(result.foundstake).format('dddd, MMMM Do YYYY, h:mm:ss a');

                    tmp.push({ foundstake: t, mindifficulty: result.mindifficulty.toFixed(1), stake: result.stake.toFixed(2) });

                }
            });

            return tmp;
        }
    }
});




//page load...
ready(function() {

    $getData('/peercoin/info', App.onGetStatusHandler, function() {
        AppLogger.log('unable to retrieve modifier data.');
    });



    var qs = (function(a) {
        if (a == "") return {};
        var b = {};
        for (var i = 0; i < a.length; ++i) {
            var p = a[i].split('=', 2);
            if (p.length == 1)
                b[p[0]] = "";
            else
                b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
        return b;
    })(window.location.search.substr(1).split('&'));

    var lang = "en";
    if (!qs["locale"]) {

        //localization
        var lang = window.navigator.languages ? window.navigator.languages[0] : null;
        lang = lang || window.navigator.language || window.navigator.browserLanguage || window.navigator.userLanguage;
        if (lang.indexOf('-') !== -1)
            lang = lang.split('-')[0];

        if (lang.indexOf('_') !== -1)
            lang = lang.split('_')[0];

    } else lang = qs["locale"];

    Language.init(lang);

    if (lang == 'zh') {
        moment.locale('zh-cn', {
            months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split('_'),
            monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
            weekdays: '星期日_星期一_星期二_星期三_星期四_星期五_星期六'.split('_'),
            weekdaysShort: '周日_周一_周二_周三_周四_周五_周六'.split('_'),
            weekdaysMin: '日_一_二_三_四_五_六'.split('_'),
            longDateFormat: {
                LT: 'Ah点mm',
                LTS: 'Ah点m分s秒',
                L: 'YYYY-MM-DD',
                LL: 'YYYY年MMMD日',
                LLL: 'YYYY年MMMD日LT',
                LLLL: 'YYYY年MMMD日ddddLT',
                l: 'YYYY-MM-DD',
                ll: 'YYYY年MMMD日',
                lll: 'YYYY年MMMD日LT',
                llll: 'YYYY年MMMD日ddddLT'
            },
            meridiemParse: /凌晨|早上|上午|中午|下午|晚上/,
            meridiemHour: function(hour, meridiem) {
                if (hour === 12) {
                    hour = 0;
                }
                if (meridiem === '凌晨' || meridiem === '早上' ||
                    meridiem === '上午') {
                    return hour;
                } else if (meridiem === '下午' || meridiem === '晚上') {
                    return hour + 12;
                } else {
                    // '中午'
                    return hour >= 11 ? hour : hour + 12;
                }
            },
            meridiem: function(hour, minute, isLower) {
                var hm = hour * 100 + minute;
                if (hm < 600) {
                    return '凌晨';
                } else if (hm < 900) {
                    return '早上';
                } else if (hm < 1130) {
                    return '上午';
                } else if (hm < 1230) {
                    return '中午';
                } else if (hm < 1800) {
                    return '下午';
                } else {
                    return '晚上';
                }
            },
            calendar: {
                sameDay: function() {
                    return this.minutes() === 0 ? '[今天]Ah[点整]' : '[今天]LT';
                },
                nextDay: function() {
                    return this.minutes() === 0 ? '[明天]Ah[点整]' : '[明天]LT';
                },
                lastDay: function() {
                    return this.minutes() === 0 ? '[昨天]Ah[点整]' : '[昨天]LT';
                },
                nextWeek: function() {
                    var startOfWeek, prefix;
                    startOfWeek = moment().startOf('week');
                    prefix = this.unix() - startOfWeek.unix() >= 7 * 24 * 3600 ? '[下]' : '[本]';
                    return this.minutes() === 0 ? prefix + 'dddAh点整' : prefix + 'dddAh点mm';
                },
                lastWeek: function() {
                    var startOfWeek, prefix;
                    startOfWeek = moment().startOf('week');
                    prefix = this.unix() < startOfWeek.unix() ? '[上]' : '[本]';
                    return this.minutes() === 0 ? prefix + 'dddAh点整' : prefix + 'dddAh点mm';
                },
                sameElse: 'LL'
            },
            ordinalParse: /\d{1,2}(日|月|周)/,
            ordinal: function(number, period) {
                switch (period) {
                    case 'd':
                    case 'D':
                    case 'DDD':
                        return number + '日';
                    case 'M':
                        return number + '月';
                    case 'w':
                    case 'W':
                        return number + '周';
                    default:
                        return number;
                }
            },
            relativeTime: {
                future: '%s内',
                past: '%s前',
                s: '几秒',
                m: '1分钟',
                mm: '%d分钟',
                h: '1小时',
                hh: '%d小时',
                d: '1天',
                dd: '%d天',
                M: '1个月',
                MM: '%d个月',
                y: '1年',
                yy: '%d年'
            },
            week: {
                // GB/T 7408-1994《数据元和交换格式·信息交换·日期和时间表示法》与ISO 8601:1988等效
                dow: 1, // Monday is the first day of the week.
                doy: 4 // The week that contains Jan 4th is the first week of the year.
            }
        });
    }


    document.title = Language.getString('title', 'Peercoin Findstakejs');
    document.getElementById("pagetitle").textContent = Language.getString('title', 'Peercoin Findstakejs');
    document.getElementById("minttime").innerHTML = Language.getString('mint-time', 'mint time');
    document.getElementById("mintdiff").innerHTML = Language.getString('max-difficulty', 'max difficulty');
    document.getElementById("mintstake").innerHTML = Language.getString('stake', 'stake');
    document.getElementById("spresults").innerHTML = Language.getString('results', "results");
    document.getElementById("spmessages").innerHTML = Language.getString('messages', "messages");
    document.getElementById("actiongo").innerHTML = Language.getString('go', "GO");


});


 

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
