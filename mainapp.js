


//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
 
var moment = require('moment');
var BigInteger = require('./lib/BigInteger');
var Peercoin = require('./lib/Peercoin'); // !!!!!!!!!!!!!!!!!!!!!!!!!!
 
require('./lib/NProgress');
require('./lib/setZeroTimeout').init(window);

// In case we forget to take out console statements. IE becomes very unhappy when we forget. Let's not make IE unhappy
if (typeof(console) === 'undefined') {
	var console = {}
	console.log = console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function () {};
}

//youmightnotneedjquery
function ready(fn) {
  if (document.readyState != 'loading'){
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
var $jsonp = (function(){
  var that = {};

  that.send = function(src, options) {
    var options = options || {},
      callback_name = options.callbackName || 'callback',
      on_success = options.onSuccess || function(){},
      on_timeout = options.onTimeout || function(){},
      timeout = options.timeout || 10;

    var timeout_trigger = window.setTimeout(function(){
      window[callback_name] = function(){};
      on_timeout();
    }, timeout * 1000);

    window[callback_name] = function(data){
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


var $getData = function(path, callback, errcallback){	 

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
window.AppLogger.log = function (s, clear) {
	if (window.AppLogger.el == null)
		window.AppLogger.el = document.getElementById("divresults");

	window.AppLogger.el.innerHTML = clear ? '<p>' + s + '</p>' : window.AppLogger.el.innerHTML + '<p>' + s + '</p>';
};
 

 
window.AppLogger.logProgress = function (p, time) {
	if (p >= 100)
		AppLogger.logDone();
	else {

		if (time==="" || Object.prototype.toString.call(time) == '[object String]' || isNaN(time))
			NProgress.set(p, time);
		else
			NProgress.set(p, moment.unix(time).format('MMMM Do YYYY, h:mm'));
	}
};
window.AppLogger.logDone = function () {
	NProgress.done();
	AppLogger.log('Finished!');

	//var btnFs = document.getElementById('actiongofindstake');
	//btnFs.style.display = 'none';
};

window.AppLogger.logMint = function (arr) {
	if (window.AppLogger.elmint == null)
		window.AppLogger.elmint = document.getElementById("listmints");

	if (window.AppLogger.arrmints == null)
		window.AppLogger.arrmints = [];

	AppLogger.arrmints = AppLogger.arrmints.concat(arr);
	var mpfoundstakes = {};

	var stable='<table class="pure-table"><thead><tr><th>mint time</th><th>max difficulty</th><th>stake</th></tr></thead><tbody>';
	var etable='</tbody></table>';
	var rodd='<tr class="pure-table-odd">';
    var rind=false;
	var tmp = '';

	AppLogger.arrmints.forEach(function (result) {
		var keydups = 'fs' + moment.unix(result.foundstake).format('MM_DD_HH_mm');
		if (mpfoundstakes[keydups] == null) {
			mpfoundstakes[keydups] = true;
			var t = moment.unix(result.foundstake).format('MMM Do, H:mm');
			
			console.log('Mint@' + t + ' min diff: ' + result.mindifficulty.toFixed(1));

            if(rind){
            	rind=false;
            	tmp+='<tr><td>'+ t +'</td><td>'+ result.mindifficulty.toFixed(1) + '</td><td>'+ result.stake.toFixed(2) +'</td></tr>';
            }else{
            	tmp+=rodd+'<td>'+ t +'</td><td>'+ result.mindifficulty.toFixed(1) +'</td><td>'+ result.stake.toFixed(2)+'</td></tr>';
            	rind=true;
            }
			
		}
	});
	AppLogger.elmint.innerHTML = stable + tmp + etable;
};


window.App = {};
App.Staketemplates = null;
App.LastKnownDifficulty = 1;
App.LastKnownHeight = 1;
App.LastKnownBlocktime = 1;
App.Findstakelimit=2592000-761920;
App.MRdataMap={};
App.MRdataHint=0;
App.MRdata=null;//e.g.[[1425105787,'b6448eaeacd5727a']];
App.LookupCallback = function(curtime){
    var stakeModifier16=''; 
    var tt=curtime-App.Findstakelimit;
    var starti=Math.max(0,App.MRdataHint-1);
	for(var i=starti, max = App.MRdata.length; (i < max); i++)
    {    	
    	if(App.MRdata[i][0] <= tt ){
    		stakeModifier16=App.MRdata[i][1];
    		App.MRdataHint=i;
    	}else{
    		break;
    	}
    }    
    if(!App.MRdataMap[stakeModifier16])
    {
    	App.MRdataMap[stakeModifier16]= BigInteger.fromByteArrayUnsigned(Peercoin.Crypto.hexToBytes(stakeModifier16));
    }
	return App.MRdataMap[stakeModifier16];
}

App.onGetStatusHandler = function(data) {
	if (data && data.result && data.data != null) {
		if (data.data.difficulty)
			window.App.LastKnownDifficulty = data.data.difficulty;

		if (data.data.lastupdatedblock)
			window.App.LastKnownHeight = data.data.lastupdatedblock;

		if (data.data.lastupdatedblocktime)
			window.App.LastKnownBlocktime = data.data.lastupdatedblocktime;

		if (data.data.blockModifiers)
			window.App.MRdata = data.data.blockModifiers;


		window.AppLogger.log('<p>Last known difficulty: ' + data.data.difficulty.toFixed(1) + '</p><p> Findstake is available untill ' + moment.unix(window.App.LastKnownBlocktime+window.App.Findstakelimit).format("dddd, MMMM Do YYYY, h:mm:ss a")+'</p>', true);
	}
};

App.onGetStarted=function () {
 
	AppLogger.log('Findstake started', false);
	var startx1 = Math.round((new Date()).getTime() / 1000);
	var endx = (window.App.LastKnownBlocktime+window.App.Findstakelimit);//moment(document.getElementById("endd").value, "DD-MM-YYYY HH:mm:ss").format("X");

	App.Staketemplates.setStartStop(startx1, endx);
	App.Staketemplates.findStake(window.AppLogger.logMint, window.AppLogger.logProgress, window.setZeroTimeout);

}

App.onGetUnspentHandler=function (data) {
	if (data && data.result && data.data != null) {
		AppLogger.logProgress(0.02, 'unspent outputs retrieved.');
		App.Staketemplates = new Peercoin.UnspentOutputsToStake();
		App.Staketemplates.setLookupCallback(App.LookupCallback);

		data.data.forEach(function (dbdata, index, array) {

			var tpldata = {
				BlockFromTime : dbdata.BlockFromTime,
				StakeModifier : BigInteger.ZERO,
				PrevTxOffset : dbdata.PrevTxOffset,
				PrevTxTime : dbdata.PrevTxTime,
				PrevTxOutIndex : dbdata.PrevTxOutIndex,
				PrevTxOutValue : dbdata.PrevTxOutValue
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

				setTimeout(function () { 
				    //start!!!
					App.onGetStarted();
				}, 300);
			}
		});
	} else {
		AppLogger.log('No unspent outputs found. Output may not have past 30 days or database may need an update');
	}
}








//page load...
ready(function () {

 	$getData('/peercoin/info', App.onGetStatusHandler, function(){
  					AppLogger.log('unable to retrieve modifier data.');
  				});

	function cancelDefaultAction(e) {
		var evt = e ? e : window.event;
		if (evt.preventDefault)
			evt.preventDefault();
		evt.returnValue = false;
		return false;
	}

	document.querySelector('#actiongo').addEventListener('click', function (e) {
		e.preventDefault();

		var btn = document.getElementById("actiongo"), inputAdr = document.getElementById("inputAdr").value;

		if(!window.App.MRdata || (window.App.LastKnownBlocktime+window.App.Findstakelimit)-3600 < Math.round((new Date()).getTime() / 1000)){
			AppLogger.log('Data either not found or out of date.');
					
			return cancelDefaultAction(e);
		}

		if (btn.innerHTML == "GO") {
			btn.innerHTML = "STOP";

		} else {
			if (window.Staketemplates != null)	App.Staketemplates.stop();
			 
	     
            var _last=App.Staketemplates.TxTime;
			App.Staketemplates.MaxTime = App.Staketemplates.TxTime+1111;
			btn.innerHTML = "GO";
            AppLogger.log('Stop requested at '+moment.unix(_last).format('MMMM Do YYYY, h:mm')+' ');
			//window.AppLogger.logProgress(99, _last);

			return cancelDefaultAction(e);
		}

		if (inputAdr) {

			AppLogger.logProgress(0.01, 'retrieving data...');
			var peercoinaddress = '';
			try {
				var peeradr = new Peercoin.Address(inputAdr);
				peercoinaddress = peeradr.toString();
			} catch (err) {
				Applogger.log('unknown Peercoin address'); ;
			}

			if (peercoinaddress) {
				App.MRdataHint=0;
  				$getData("/peercoin/" + peercoinaddress + "/unspent", App.onGetUnspentHandler, function(){
  					AppLogger.log('No unspent outputs found. Output may not have past 30 days or database may need an update');
  				});

			}
		}
		return cancelDefaultAction(e);
	}); 

}); //onready

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////



