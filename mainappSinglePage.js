


//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
 
var $ = require('jquery');
var moment = require('moment');
require('./lib/bootstrap').init($);
require('./lib/bootstrap-datetimepicker').init($, moment);
var BigInteger = require('./lib/BigInteger');
var Peercoin = require('./lib/Peercoin');  
 
require('./lib/NProgress');

require('./lib/setZeroTimeout').init(window);








// In case we forget to take out console statements. IE becomes very unhappy when we forget. Let's not make IE unhappy
if (typeof(console) === 'undefined') {
	var console = {}
	console.log = console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function () {};
}
window.AppLogger = {};
window.AppLogger.log = function (s, clear) {
	if (window.AppLogger.el == null)
		window.AppLogger.el = document.getElementById("divresults");

	window.AppLogger.el.innerHTML = clear ? '<pre>' + s + '</pre>' : window.AppLogger.el.innerHTML + '<pre>' + s + '</pre>';
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
	var mpfoundstakes = {};
	var tmp = '<a href="javascript:void(0)" class="list-group-item active"><span class="glyphicon glyphicon-camera"></span> Found stakes</a>';
	AppLogger.arrmints.forEach(function (result) {
		var keydups = 'fs' + moment.unix(result.foundstake).format('MM_DD_HH_mm');
		if (mpfoundstakes[keydups] == null) {
			mpfoundstakes[keydups] = true;
			var t = moment.unix(result.foundstake).format('MMM Do, H:mm');

			console.log('Mint@' + t + ' min diff: ' + result.mindifficulty.toFixed(1));
			tmp += '<a href="javascript:void(0)" class="list-group-item"><span class="glyphicon glyphicon-leaf"></span> ' + t +
			'<span class="badge">' + result.mindifficulty.toFixed(1) + '</span></a>';

		}
	});
	AppLogger.elmint.innerHTML = '' + tmp + '';
};
window.App = {};
App.Staketemplates = null;
App.LastKnownDifficulty = 1;
App.LastKnownHeight = 1;
App.LastKnownBlocktime = 1;

//onready
$(function () {

	$('#datetimepicker6').datetimepicker({
		format : 'DD-MM-YYYY HH:mm:ss'
	});
	$('#datetimepicker7').datetimepicker({
		format : 'DD-MM-YYYY HH:mm:ss'
	});
	$("#datetimepicker6").on("dp.change", function (e) {
		$('#datetimepicker7').data("DateTimePicker").minDate(e.date);
	});
	$("#datetimepicker7").on("dp.change", function (e) {
		$('#datetimepicker6').data("DateTimePicker").maxDate(e.date);
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

		var btn = document.getElementById("actiongo"),
		inputAdrtx = document.getElementById("inputAdr").value;

		var peercoinaddress = '';
		try {
			var peeradr = new Peercoin.Address(inputAdrtx);
			peercoinaddress = peeradr.toString();
		} catch (err) {
			Applogger.log('unknown Peercoin address');
		}
		if (peercoinaddress.length == 0) {
			return false;
		}

		if (btn.innerHTML == "GO") {
			btn.innerHTML = "STOP";

		} else {
			if (window.Staketemplates != null)
				App.Staketemplates.stop();
			btn.innerHTML = "GO";

			window.AppLogger.logDone();
		}

		if (peercoinaddress) {
			App.Staketemplates = new Peercoin.UnspentOutputsToStake();

			var getstakedata = function (txkey, cb) {

				if (txkey) {
					//jasonp call
					$.ajax({
						url : "https://peercoinfindstakedata.divshot.io/json/" + txkey + ".json",
						timeout : 12000,
						dataType : "jsonp",
						jsonpCallback : txkey /* Unique function name */
					})
					.done(function (dbdata) {

						var tpldata = {
							BlockFromTime : dbdata.BlockFromTime,
							StakeModifier : BigInteger.fromByteArrayUnsigned(Peercoin.Crypto.hexToBytes(dbdata.StakeModifier16)),
							PrevTxOffset : dbdata.PrevTxOffset,
							PrevTxTime : dbdata.PrevTxTime,
							PrevTxOutIndex : dbdata.PrevTxOutIndex,
							PrevTxOutValue : dbdata.PrevTxOutValue
						};

						App.Staketemplates.add(tpldata);
					})
					.fail(function () {
						console.log('failed to get tx data ');
					})
					.always(function () {
						cb();
					});

				}
			};
			var prog = 0.10;
			var onreqdone = function (dbdata) {
				var ctotal = dbdata.txo.length,
				count = 0;

				if (ctotal < 1)
					return AppLogger.logProgress(0.999, 'No stake data found for this input to proceed!!!!!!');

				App.LastKnownDifficulty = parseFloat(dbdata.difficulty);

				dbdata.txo.forEach(function (txout) {
					getstakedata(txout, function () {

						count++;
						prog = prog + 0.01;
						AppLogger.logProgress(prog, '');
						if (count == ctotal) {

							//'AppLogger.logProgress(0.11, '');
							AppLogger.log('Data successfully retrieved');
							AppLogger.log('Starting...');
							btn.style.display = 'none';
							btnFs.style.display = 'block';

							setTimeout(function () {
								btnFs.click();
							}, 500);
						}
					});
				});
			};
			var logfailure = function () {
				Applogger.log('failed to get Address data ');
			};
			AppLogger.logProgress(0.01, 'retrieving data...');

			if (peercoinaddress) {
				//jasonp call

				$.ajax({
					url : "https://hook.io/jointhepartypooper/hookGetFindstakeData?PeercoinAddress=" + peercoinaddress + "&run=true",
					accepts : {
						text : "*/*"
					},
					timeout : 12000,
					dataType : "jsonp",
					jsonpCallback : peercoinaddress /* Unique function name */
				})
				.done(onreqdone)
				.fail(logfailure)
				.always(function () {});

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
		AppLogger.log('Findstake started');

		var m1 = moment(document.getElementById("startd").value, "DD-MM-YYYY HH:mm:ss").format("X");
		var m2 = moment(document.getElementById("endd").value, "DD-MM-YYYY HH:mm:ss").format("X");
		var startx1 = parseInt(m1, 10);
		var endx = parseInt(m2, 10);

		App.Staketemplates.setBitsWithDifficulty((App.LastKnownDifficulty | 0) - 1); //decrease diff with 1 to widen chances


		if (!isNumber(m1) || !isNumber(m2)) {
			AppLogger.log('please provide dates')
			//App.Staketemplates.stop();
			btnFs.innerHTML = "Find Stakes";

			window.AppLogger.logDone();
		} else {
			App.Staketemplates.setStartStop(startx1, endx);
			App.Staketemplates.findStake(window.AppLogger.logMint, AppLogger.logProgress, window.setZeroTimeout);
		}

		return cancelDefaultAction(e);
	});

}); //onready