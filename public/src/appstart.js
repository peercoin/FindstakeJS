

// In case we forget to take out console statements. IE becomes very unhappy when we forget. Let's not make IE unhappy
if (typeof(console) === 'undefined') {
	var console = {}
	console.log = console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function () {};
}
window.AppLogger = {};
window.AppLogger.log = function (s, clear) {
	if (window.AppLogger.el == null)
		window.AppLogger.el = document.getElementById("divresults");
 
	window.AppLogger.el.innerHTML = clear ? '<pre>'+s+'</pre>' : window.AppLogger.el.innerHTML + '<pre>'+s+'</pre>';
};

window.AppLogger.logProgress = function (p, lbl) {
	if (p >= 100)
		AppLogger.logDone();
	else
		NProgress.set(p, lbl);
};
window.AppLogger.logDone = function () {
	NProgress.done();
	AppLogger.log('Finished!');
 
  var btnFs = document.getElementById('actiongofindstake');
  btnFs.style.display = 'none'; 
}; 

window.AppLogger.logMint = function (arr) { 
	if (window.AppLogger.elmint == null)
		window.AppLogger.elmint = document.getElementById("listmints");
	if (window.AppLogger.arrmints == null)
		window.AppLogger.arrmints = [];

	AppLogger.arrmints = AppLogger.arrmints.concat(arr);
  var mpfoundstakes={};
	var tmp = '<a href="javascript:void(0)" class="list-group-item active"><span class="glyphicon glyphicon-camera"></span> Found stakes</a>';
	AppLogger.arrmints.forEach(function (result) {
    var keydups='fs'+moment.unix(result.foundstake).format('MM_DD_HH_mm');
    if (mpfoundstakes[keydups] == null){
      mpfoundstakes[keydups]= true;
      var t = moment.unix(result.foundstake).format('MMM Do, H:mm');
      
        console.log('Mint@' + t + ' min diff: ' + result.mindifficulty.toFixed(1));
      tmp += '<a href="javascript:void(0)" class="list-group-item"><span class="glyphicon glyphicon-leaf"></span> ' + t +
        '<span class="badge">' + result.mindifficulty.toFixed(1) + '</span></a>';           
      
    }    
	});
	AppLogger.elmint.innerHTML =  '' + tmp + '';
};
window.App = {};
App.Staketemplates = null;
App.LastKnownDifficulty=1; 
App.LastKnownHeight=1;
App.LastKnownBlocktime=1;



// BEGIN implementation of setZeroTimeout

// Only add setZeroTimeout to the window object, and hide everything
// else in a closure.
(function () {
	var timeouts = [];
	var messageName = "zero-timeout-message";

	// Like setTimeout, but only takes a function argument.  There's
	// no time argument (always zero) and no arguments (you have to
	// use a closure).
	function setZeroTimeout(fn) {
		timeouts.push(fn);
		window.postMessage(messageName, "*");
	}

	function handleMessage(event) {
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
})();


  $(function () {
     
      $('#datetimepicker6').datetimepicker({
        format: 'DD-MM-YYYY HH:mm:ss'
      });
      $('#datetimepicker7').datetimepicker({
        format: 'DD-MM-YYYY HH:mm:ss'
      });
      $("#datetimepicker6").on("dp.change",function (e) {
          $('#datetimepicker7').data("DateTimePicker").minDate(e.date);
      });
      $("#datetimepicker7").on("dp.change",function (e) {
          $('#datetimepicker6').data("DateTimePicker").maxDate(e.date);
      });
      
        //need webserver for same origin constraint
        $.get("/peercoin/info", function(data, status){

          //{"result":1,"data":{"difficulty":14.16506387,"lastupdatedblock":152723,"lastupdatedblocktime":1420777722}}
          
          if (data && data.result && data.data!=null){
            if (data.data.difficulty)
              window.App.LastKnownDifficulty=data.data.difficulty;

            if (data.data.lastupdatedblock)
              window.App.LastKnownHeight=data.data.lastupdatedblock; 
            
            if (data.data.lastupdatedblocktime)
              window.App.LastKnownBlocktime=data.data.lastupdatedblocktime;      
                  
            AppLogger.log('Difficulty: '+data.data.difficulty.toFixed(1)+ ' Block data available from May 2014 to ' + moment.unix(data.data.lastupdatedblocktime).format('DD/MM/YYYY'));
          }
        });      
            
	var btnFs = document.getElementById('actiongofindstake');
 
  function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
 
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
		
		if (btn.innerHTML == "GO") {
			btn.innerHTML = "STOP";

		} else {
			if (window.Staketemplates != null)
				App.Staketemplates.stop();
			btn.innerHTML = "GO";

			window.AppLogger.logDone();
		}

		if (inputAdr) {
            
			AppLogger.logProgress(0.01, 'retrieving data...');
      var peercoinaddress='';
      try {
        var peeradr =	new Peercoin.Address(inputAdr); 
        peercoinaddress = peeradr.toString();        
      }
      catch(err) {
          Applogger.log('unknown Peercoin address');;
      }
		  if (peercoinaddress) {      
        $.get("/peercoin/"+peercoinaddress+"/unspent", function(data, status){        
          if (data && data.result && data.data!=null){   
              AppLogger.logProgress(0.02, 'unspent outputs retrieved.'); 
              App.Staketemplates = new Peercoin.UnspentOutputsToStake();
              data.data.forEach(function (dbdata, index, array) {
                
                var tpldata = {
                    BlockFromTime : dbdata.BlockFromTime,
                    StakeModifier : BigInteger.fromByteArrayUnsigned(Crypto.util.hexToBytes(dbdata.StakeModifier16)),
                    PrevTxOffset : dbdata.PrevTxOffset,
                    PrevTxTime : dbdata.PrevTxTime,
                    PrevTxOutIndex : dbdata.PrevTxOutIndex,
                    PrevTxOutValue : dbdata.PrevTxOutValue 
                  };
              
                App.Staketemplates.add(tpldata);
                
                if (array.length > 0 && index + 1 == array.length) {
                  App.Staketemplates.setBitsWithDifficulty(App.LastKnownDifficulty|0);
                     
                  AppLogger.logProgress(0.11, '');
                  AppLogger.log('Data successfully retrieved');
                  AppLogger.log('Starting...');
                  btn.style.display = 'none';
                  btnFs.style.display = 'block';   

                  setTimeout(function(){ btnFs.click(); }, 500);
                }              
            });              
          }else{
             AppLogger.log('No unspent outputs found. Output may not have past 30 days or database may need an update');
          }
        })
        .fail(function() {
              AppLogger.log('No unspent outputs found. Output may not have past 30 days or database may need an update');
        });         
      }  
		}
		return cancelDefaultAction(e);
	});

	document.querySelector('#actiongofindstake').addEventListener('click', function (e) {
		e.preventDefault();

		if (btnFs.innerHTML == "Find Stakes") {
			btnFs.innerHTML = "STOP";

		} else {
			App.Staketemplates.stop();
			btnFs.innerHTML = "Find Stakes";

			window.AppLogger.logDone();
      return false;
		}
		AppLogger.log('Findstake started', false);

    var m1 = moment(document.getElementById("startd").value, "DD-MM-YYYY HH:mm:ss").format("X");
    var m2 = moment(document.getElementById("endd").value, "DD-MM-YYYY HH:mm:ss").format("X");
    var startx1 = parseInt(m1, 10);
    var endx = parseInt(m2, 10);
    
    if (!isNumber(m1) || !isNumber(m2)){
      AppLogger.log('please provide dates')
      //App.Staketemplates.stop();
			btnFs.innerHTML = "Find Stakes";

			window.AppLogger.logDone();
    }else{
      App.Staketemplates.setStartStop(startx1, endx);
      App.Staketemplates.findStake(window.AppLogger.logMint, AppLogger.logProgress);
      
    }
    
    

		return cancelDefaultAction(e);
	});      
      
      
      
  });//onready


 