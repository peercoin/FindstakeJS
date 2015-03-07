

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


 

/* fork of http://ricostacruz.com/nprogress */

;(function(factory) {

  if (typeof module === 'function') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    this.NProgress = factory();
  }

})(function() {
  var NProgress = {};

  NProgress.version = '0.1.2';

  var Settings = NProgress.settings = {
    minimum: 0.08,
    easing: 'ease',
    positionUsing: '',
    speed: 200,
    trickle: true,
    trickleRate: 0.02,
    trickleSpeed: 800,
    showStatus: true,
    barSelector: '[role="bar"]',
    statusSelector: '[role="status"]',
    template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="status" role="status"></div></div>'
  };

  NProgress.configure = function(options) {
    var key, value;
    for (key in options) {
      value = options[key];
      if (value !== undefined && options.hasOwnProperty(key)) Settings[key] = value;
    }

    return this;
  };

  NProgress.status = null;
  NProgress.statuslabel = '';

  NProgress.set = function(n, nl) {
    var started = NProgress.isStarted();

    n = clamp(n, Settings.minimum, 1);
    NProgress.status = (n === 1 ? null : n);
	NProgress.statuslabel = nl || NProgress.statuslabel || '';

    var progress = NProgress.render(!started),
        bar      = progress.querySelector(Settings.barSelector),
        speed    = Settings.speed,
        ease     = Settings.easing;

    progress.offsetWidth; /* Repaint */
	NProgress.setStatusHtml(progress);
	
    queue(function(next) {
      // Set positionUsing if it hasn't already been set
      if (Settings.positionUsing === '') Settings.positionUsing = NProgress.getPositioningCSS();

      // Add transition
      css(bar, barPositionCSS(n, speed, ease));

      if (n === 1) {
        // Fade out
        css(progress, { 
          transition: 'none', 
          opacity: 1 
        });
        progress.offsetWidth; /* Repaint */
		NProgress.setStatusHtml(progress);
		
        setTimeout(function() {
          css(progress, { 
            transition: 'all ' + speed + 'ms linear', 
            opacity: 0 
          });
          setTimeout(function() {
            NProgress.remove();
            next();
          }, speed);
        }, speed);
      } else {
        setTimeout(next, speed);
      }
    });

    return this;
  };

  NProgress.isStarted = function() {
    return typeof NProgress.status === 'number';
  };

  NProgress.start = function() {
    if (!NProgress.status) NProgress.set(0);

    var work = function() {
      setTimeout(function() {
        if (!NProgress.status) return;
        NProgress.trickle();
        work();
      }, Settings.trickleSpeed);
    };

    if (Settings.trickle) work();

    return this;
  };

  NProgress.done = function(force) {
    if (!force && !NProgress.status) return this;

    return NProgress.inc(0.3 + 0.5 * Math.random()).set(1);
  };

  NProgress.inc = function(amount) {
    var n = NProgress.status;

    if (!n) {
      return NProgress.start();
    } else {
      if (typeof amount !== 'number') {
        amount = (1 - n) * clamp(Math.random() * n, 0.1, 0.95);
      }

      n = clamp(n + amount, 0, 0.994);
      return NProgress.set(n);
    }
  };

  NProgress.trickle = function() {
    return NProgress.inc(Math.random() * Settings.trickleRate);
  };

  NProgress.render = function(fromStart) {
    if (NProgress.isRendered()) return document.getElementById('nprogress');

    addClass(document.documentElement, 'nprogress-busy');
    
    var progress = document.createElement('div');
    progress.id = 'nprogress';
    progress.innerHTML = Settings.template;

    var bar      = progress.querySelector(Settings.barSelector),
        perc     = fromStart ? '-100' : toBarPerc(NProgress.status || 0);
    
    css(bar, {
      transition: 'all 0 linear',
      transform: 'translate3d(' + perc + '%,0,0)'
    });

    if (!Settings.showStatus) {
      var statuselm = progress.querySelector(Settings.statusSelector);
      statuselm && removeElement(statuselm);
    }	

    document.body.appendChild(progress);
    return progress;
  };

  //displays addtional text as progress
  NProgress.setStatusHtml = function(progress) {  
	if (Settings.showStatus && progress && NProgress.statuslabel){
		progress.querySelector(Settings.statusSelector).innerHTML = NProgress.statuslabel;
	}	  
  };    

  NProgress.remove = function() {
    removeClass(document.documentElement, 'nprogress-busy');
    var progress = document.getElementById('nprogress');
    progress && removeElement(progress);
  };

  NProgress.isRendered = function() {
    return !!document.getElementById('nprogress');
  };

  // Determine which positioning CSS rule to use.
  NProgress.getPositioningCSS = function() {
    // Sniff on document.body.style
    var bodyStyle = document.body.style;

    // Sniff prefixes
    var vendorPrefix = ('WebkitTransform' in bodyStyle) ? 'Webkit' :
                       ('MozTransform' in bodyStyle) ? 'Moz' :
                       ('msTransform' in bodyStyle) ? 'ms' :
                       ('OTransform' in bodyStyle) ? 'O' : '';

    if (vendorPrefix + 'Perspective' in bodyStyle) {
      // Modern browsers with 3D support, e.g. Webkit, IE10
      return 'translate3d';
    } else if (vendorPrefix + 'Transform' in bodyStyle) {
      // Browsers without 3D support, e.g. IE9
      return 'translate';
    } else {
      // Browsers without translate() support, e.g. IE7-8
      return 'margin';
    }
  };

  function clamp(n, min, max) {
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function toBarPerc(n) {
    return (-1 + n) * 100;
  }

  function barPositionCSS(n, speed, ease) {
    var barCSS;

    if (Settings.positionUsing === 'translate3d') {
      barCSS = { transform: 'translate3d('+toBarPerc(n)+'%,0,0)' };
    } else if (Settings.positionUsing === 'translate') {
      barCSS = { transform: 'translate('+toBarPerc(n)+'%,0)' };
    } else {
      barCSS = { 'margin-left': toBarPerc(n)+'%' };
    }

    barCSS.transition = 'all '+speed+'ms '+ease;

    return barCSS;
  }

  var queue = (function() {
    var pending = [];
    
    function next() {
      var fn = pending.shift();
      if (fn) {
        fn(next);
      }
    }

    return function(fn) {
      pending.push(fn);
      if (pending.length == 1) next();
    };
  })();

  // internal. Applies css properties to an element
  var css = (function() {
    var cssPrefixes = [ 'Webkit', 'O', 'Moz', 'ms' ],
        cssProps    = {};

    function camelCase(string) {
      return string.replace(/^-ms-/, 'ms-').replace(/-([\da-z])/gi, function(match, letter) {
        return letter.toUpperCase();
      });
    }

    function getVendorProp(name) {
      var style = document.body.style;
      if (name in style) return name;

      var i = cssPrefixes.length,
          capName = name.charAt(0).toUpperCase() + name.slice(1),
          vendorName;
      while (i--) {
        vendorName = cssPrefixes[i] + capName;
        if (vendorName in style) return vendorName;
      }

      return name;
    }

    function getStyleProp(name) {
      name = camelCase(name);
      return cssProps[name] || (cssProps[name] = getVendorProp(name));
    }

    function applyCss(element, prop, value) {
      prop = getStyleProp(prop);
      element.style[prop] = value;
    }

    return function(element, properties) {
      var args = arguments,
          prop, 
          value;

      if (args.length == 2) {
        for (prop in properties) {
          value = properties[prop];
          if (value !== undefined && properties.hasOwnProperty(prop)) applyCss(element, prop, value);
        }
      } else {
        applyCss(element, args[1], args[2]);
      }
    }
  })();
 
  function hasClass(element, name) {
    var list = typeof element == 'string' ? element : classList(element);
    return list.indexOf(' ' + name + ' ') >= 0;
  }

  function addClass(element, name) {
    var oldList = classList(element),
        newList = oldList + name;

    if (hasClass(oldList, name)) return; 

    // Trim the opening space.
    element.className = newList.substring(1);
  }

  function removeClass(element, name) {
    var oldList = classList(element),
        newList;

    if (!hasClass(element, name)) return;

    // Replace the class name.
    newList = oldList.replace(' ' + name + ' ', ' ');

    // Trim the opening and closing spaces.
    element.className = newList.substring(1, newList.length - 1);
  }

  function classList(element) {
    return (' ' + (element.className || '') + ' ').replace(/\s+/gi, ' ');
  }

  function removeElement(element) {
    element && element.parentNode && element.parentNode.removeChild(element);
  }

  return NProgress;
});




// this module includes BigInteger, Peercoin, Address, Mint, kernel, Crypto and utils. requires Q
(function (globals) {

	var Peercoin = globals.Peercoin = {};
	/////////////////////////////////////

	/*!
	 * Basic JavaScript BN library - subset useful for RSA encryption. v1.3
	 *
	 * Copyright (c) 2005  Tom Wu
	 * All Rights Reserved.
	 * BSD License
	 * http://www-cs-students.stanford.edu/~tjw/jsbn/LICENSE
	 *
	 * Copyright Stephan Thomas
	 * Copyright bitaddress.org
	 */

	(function (globals) {

		// (public) Constructor function of Global BigInteger object
		var BigInteger = globals.BigInteger = function BigInteger(a, b, c) {
			if (a != null)
				if ("number" == typeof a)
					this.fromNumber(a, b, c);
				else if (b == null && "string" != typeof a)
					this.fromString(a, 256);
				else
					this.fromString(a, b);
		};

		// Bits per digit
		var dbits;

		// JavaScript engine analysis
		var canary = 0xdeadbeefcafe;
		var j_lm = ((canary & 0xffffff) == 0xefcafe);

		// return new, unset BigInteger
		function nbi() {
			return new BigInteger(null);
		}

		// am: Compute w_j += (x*this_i), propagate carries,
		// c is initial carry, returns final carry.
		// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
		// We need to select the fastest one that works in this environment.

		// am1: use a single mult and divide to get the high bits,
		// max digit bits should be 26 because
		// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
		function am1(i, x, w, j, c, n) {
			while (--n >= 0) {
				var v = x * this[i++] + w[j] + c;
				c = Math.floor(v / 0x4000000);
				w[j++] = v & 0x3ffffff;
			}
			return c;
		}
		// am2 avoids a big mult-and-extract completely.
		// Max digit bits should be <= 30 because we do bitwise ops
		// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
		function am2(i, x, w, j, c, n) {
			var xl = x & 0x7fff,
			xh = x >> 15;
			while (--n >= 0) {
				var l = this[i] & 0x7fff;
				var h = this[i++] >> 15;
				var m = xh * l + h * xl;
				l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff);
				c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
				w[j++] = l & 0x3fffffff;
			}
			return c;
		}
		// Alternately, set max digit bits to 28 since some
		// browsers slow down when dealing with 32-bit numbers.
		function am3(i, x, w, j, c, n) {
			var xl = x & 0x3fff,
			xh = x >> 14;
			while (--n >= 0) {
				var l = this[i] & 0x3fff;
				var h = this[i++] >> 14;
				var m = xh * l + h * xl;
				l = xl * l + ((m & 0x3fff) << 14) + w[j] + c;
				c = (l >> 28) + (m >> 14) + xh * h;
				w[j++] = l & 0xfffffff;
			}
			return c;
		}
		if (j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
			BigInteger.prototype.am = am2;
			dbits = 30;
		} else if (j_lm && (navigator.appName != "Netscape")) {
			BigInteger.prototype.am = am1;
			dbits = 26;
		} else { // Mozilla/Netscape seems to prefer am3
			BigInteger.prototype.am = am3;
			dbits = 28;
		}

		BigInteger.prototype.DB = dbits;
		BigInteger.prototype.DM = ((1 << dbits) - 1);
		BigInteger.prototype.DV = (1 << dbits);

		var BI_FP = 52;
		BigInteger.prototype.FV = Math.pow(2, BI_FP);
		BigInteger.prototype.F1 = BI_FP - dbits;
		BigInteger.prototype.F2 = 2 * dbits - BI_FP;

		// Digit conversions
		var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
		var BI_RC = new Array();
		var rr,
		vv;
		rr = "0".charCodeAt(0);
		for (vv = 0; vv <= 9; ++vv)
			BI_RC[rr++] = vv;
		rr = "a".charCodeAt(0);
		for (vv = 10; vv < 36; ++vv)
			BI_RC[rr++] = vv;
		rr = "A".charCodeAt(0);
		for (vv = 10; vv < 36; ++vv)
			BI_RC[rr++] = vv;

		function int2char(n) {
			return BI_RM.charAt(n);
		}
		function intAt(s, i) {
			var c = BI_RC[s.charCodeAt(i)];
			return (c == null) ? -1 : c;
		}

		// return bigint initialized to value
		function nbv(i) {
			var r = nbi();
			r.fromInt(i);
			return r;
		}

		// returns bit length of the integer x
		function nbits(x) {
			var r = 1,
			t;
			if ((t = x >>> 16) != 0) {
				x = t;
				r += 16;
			}
			if ((t = x >> 8) != 0) {
				x = t;
				r += 8;
			}
			if ((t = x >> 4) != 0) {
				x = t;
				r += 4;
			}
			if ((t = x >> 2) != 0) {
				x = t;
				r += 2;
			}
			if ((t = x >> 1) != 0) {
				x = t;
				r += 1;
			}
			return r;
		}

		// (protected) copy this to r
		BigInteger.prototype.copyTo = function (r) {
			for (var i = this.t - 1; i >= 0; --i)
				r[i] = this[i];
			r.t = this.t;
			r.s = this.s;
		};

		// (protected) set from integer value x, -DV <= x < DV
		BigInteger.prototype.fromInt = function (x) {
			this.t = 1;
			this.s = (x < 0) ? -1 : 0;
			if (x > 0)
				this[0] = x;
			else if (x < -1)
				this[0] = x + this.DV;
			else
				this.t = 0;
		};

		// (protected) set from string and radix
		BigInteger.prototype.fromString = function (s, b) {
			var k;
			if (b == 16)
				k = 4;
			else if (b == 8)
				k = 3;
			else if (b == 256)
				k = 8; // byte array
			else if (b == 2)
				k = 1;
			else if (b == 32)
				k = 5;
			else if (b == 4)
				k = 2;
			else {
				this.fromRadix(s, b);
				return;
			}
			this.t = 0;
			this.s = 0;
			var i = s.length,
			mi = false,
			sh = 0;
			while (--i >= 0) {
				var x = (k == 8) ? s[i] & 0xff : intAt(s, i);
				if (x < 0) {
					if (s.charAt(i) == "-")
						mi = true;
					continue;
				}
				mi = false;
				if (sh == 0)
					this[this.t++] = x;
				else if (sh + k > this.DB) {
					this[this.t - 1] |= (x & ((1 << (this.DB - sh)) - 1)) << sh;
					this[this.t++] = (x >> (this.DB - sh));
				} else
					this[this.t - 1] |= x << sh;
				sh += k;
				if (sh >= this.DB)
					sh -= this.DB;
			}
			if (k == 8 && (s[0] & 0x80) != 0) {
				this.s = -1;
				if (sh > 0)
					this[this.t - 1] |= ((1 << (this.DB - sh)) - 1) << sh;
			}
			this.clamp();
			if (mi)
				BigInteger.ZERO.subTo(this, this);
		};

		// (protected) clamp off excess high words
		BigInteger.prototype.clamp = function () {
			var c = this.s & this.DM;
			while (this.t > 0 && this[this.t - 1] == c)
				--this.t;
		};

		// (protected) r = this << n*DB
		BigInteger.prototype.dlShiftTo = function (n, r) {
			var i;
			for (i = this.t - 1; i >= 0; --i)
				r[i + n] = this[i];
			for (i = n - 1; i >= 0; --i)
				r[i] = 0;
			r.t = this.t + n;
			r.s = this.s;
		};

		// (protected) r = this >> n*DB
		BigInteger.prototype.drShiftTo = function (n, r) {
			for (var i = n; i < this.t; ++i)
				r[i - n] = this[i];
			r.t = Math.max(this.t - n, 0);
			r.s = this.s;
		};

		// (protected) r = this << n
		BigInteger.prototype.lShiftTo = function (n, r) {
			var bs = n % this.DB;
			var cbs = this.DB - bs;
			var bm = (1 << cbs) - 1;
			var ds = Math.floor(n / this.DB),
			c = (this.s << bs) & this.DM,
			i;
			for (i = this.t - 1; i >= 0; --i) {
				r[i + ds + 1] = (this[i] >> cbs) | c;
				c = (this[i] & bm) << bs;
			}
			for (i = ds - 1; i >= 0; --i)
				r[i] = 0;
			r[ds] = c;
			r.t = this.t + ds + 1;
			r.s = this.s;
			r.clamp();
		};

		// (protected) r = this >> n
		BigInteger.prototype.rShiftTo = function (n, r) {
			r.s = this.s;
			var ds = Math.floor(n / this.DB);
			if (ds >= this.t) {
				r.t = 0;
				return;
			}
			var bs = n % this.DB;
			var cbs = this.DB - bs;
			var bm = (1 << bs) - 1;
			r[0] = this[ds] >> bs;
			for (var i = ds + 1; i < this.t; ++i) {
				r[i - ds - 1] |= (this[i] & bm) << cbs;
				r[i - ds] = this[i] >> bs;
			}
			if (bs > 0)
				r[this.t - ds - 1] |= (this.s & bm) << cbs;
			r.t = this.t - ds;
			r.clamp();
		};

		// (protected) r = this - a
		BigInteger.prototype.subTo = function (a, r) {
			var i = 0,
			c = 0,
			m = Math.min(a.t, this.t);
			while (i < m) {
				c += this[i] - a[i];
				r[i++] = c & this.DM;
				c >>= this.DB;
			}
			if (a.t < this.t) {
				c -= a.s;
				while (i < this.t) {
					c += this[i];
					r[i++] = c & this.DM;
					c >>= this.DB;
				}
				c += this.s;
			} else {
				c += this.s;
				while (i < a.t) {
					c -= a[i];
					r[i++] = c & this.DM;
					c >>= this.DB;
				}
				c -= a.s;
			}
			r.s = (c < 0) ? -1 : 0;
			if (c < -1)
				r[i++] = this.DV + c;
			else if (c > 0)
				r[i++] = c;
			r.t = i;
			r.clamp();
		};

		// (protected) r = this * a, r != this,a (HAC 14.12)
		// "this" should be the larger one if appropriate.
		BigInteger.prototype.multiplyTo = function (a, r) {
			var x = this.abs(),
			y = a.abs();
			var i = x.t;
			r.t = i + y.t;
			while (--i >= 0)
				r[i] = 0;
			for (i = 0; i < y.t; ++i)
				r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
			r.s = 0;
			r.clamp();
			if (this.s != a.s)
				BigInteger.ZERO.subTo(r, r);
		};

		// (protected) r = this^2, r != this (HAC 14.16)
		BigInteger.prototype.squareTo = function (r) {
			var x = this.abs();
			var i = r.t = 2 * x.t;
			while (--i >= 0)
				r[i] = 0;
			for (i = 0; i < x.t - 1; ++i) {
				var c = x.am(i, x[i], r, 2 * i, 0, 1);
				if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
					r[i + x.t] -= x.DV;
					r[i + x.t + 1] = 1;
				}
			}
			if (r.t > 0)
				r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
			r.s = 0;
			r.clamp();
		};

		// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
		// r != q, this != m.  q or r may be null.
		BigInteger.prototype.divRemTo = function (m, q, r) {
			var pm = m.abs();
			if (pm.t <= 0)
				return;
			var pt = this.abs();
			if (pt.t < pm.t) {
				if (q != null)
					q.fromInt(0);
				if (r != null)
					this.copyTo(r);
				return;
			}
			if (r == null)
				r = nbi();
			var y = nbi(),
			ts = this.s,
			ms = m.s;
			var nsh = this.DB - nbits(pm[pm.t - 1]); // normalize modulus
			if (nsh > 0) {
				pm.lShiftTo(nsh, y);
				pt.lShiftTo(nsh, r);
			} else {
				pm.copyTo(y);
				pt.copyTo(r);
			}
			var ys = y.t;
			var y0 = y[ys - 1];
			if (y0 == 0)
				return;
			var yt = y0 * (1 << this.F1) + ((ys > 1) ? y[ys - 2] >> this.F2 : 0);
			var d1 = this.FV / yt,
			d2 = (1 << this.F1) / yt,
			e = 1 << this.F2;
			var i = r.t,
			j = i - ys,
			t = (q == null) ? nbi() : q;
			y.dlShiftTo(j, t);
			if (r.compareTo(t) >= 0) {
				r[r.t++] = 1;
				r.subTo(t, r);
			}
			BigInteger.ONE.dlShiftTo(ys, t);
			t.subTo(y, y); // "negative" y so we can replace sub with am later
			while (y.t < ys)
				y[y.t++] = 0;
			while (--j >= 0) {
				// Estimate quotient digit
				var qd = (r[--i] == y0) ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
				if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) { // Try it out
					y.dlShiftTo(j, t);
					r.subTo(t, r);
					while (r[i] < --qd)
						r.subTo(t, r);
				}
			}
			if (q != null) {
				r.drShiftTo(ys, q);
				if (ts != ms)
					BigInteger.ZERO.subTo(q, q);
			}
			r.t = ys;
			r.clamp();
			if (nsh > 0)
				r.rShiftTo(nsh, r); // Denormalize remainder
			if (ts < 0)
				BigInteger.ZERO.subTo(r, r);
		};

		// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
		// justification:
		//         xy == 1 (mod m)
		//         xy =  1+km
		//   xy(2-xy) = (1+km)(1-km)
		// x[y(2-xy)] = 1-k^2m^2
		// x[y(2-xy)] == 1 (mod m^2)
		// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
		// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
		// JS multiply "overflows" differently from C/C++, so care is needed here.
		BigInteger.prototype.invDigit = function () {
			if (this.t < 1)
				return 0;
			var x = this[0];
			if ((x & 1) == 0)
				return 0;
			var y = x & 3; // y == 1/x mod 2^2
			y = (y * (2 - (x & 0xf) * y)) & 0xf; // y == 1/x mod 2^4
			y = (y * (2 - (x & 0xff) * y)) & 0xff; // y == 1/x mod 2^8
			y = (y * (2 - (((x & 0xffff) * y) & 0xffff))) & 0xffff; // y == 1/x mod 2^16
			// last step - calculate inverse mod DV directly;
			// assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
			y = (y * (2 - x * y % this.DV)) % this.DV; // y == 1/x mod 2^dbits
			// we really want the negative inverse, and -DV < y < DV
			return (y > 0) ? this.DV - y : -y;
		};

		// (protected) true iff this is even
		BigInteger.prototype.isEven = function () {
			return ((this.t > 0) ? (this[0] & 1) : this.s) == 0;
		};

		// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
		BigInteger.prototype.exp = function (e, z) {
			if (e > 0xffffffff || e < 1)
				return BigInteger.ONE;
			var r = nbi(),
			r2 = nbi(),
			g = z.convert(this),
			i = nbits(e) - 1;
			g.copyTo(r);
			while (--i >= 0) {
				z.sqrTo(r, r2);
				if ((e & (1 << i)) > 0)
					z.mulTo(r2, g, r);
				else {
					var t = r;
					r = r2;
					r2 = t;
				}
			}
			return z.revert(r);
		};

		// (public) return string representation in given radix
		BigInteger.prototype.toString = function (b) {
			if (this.s < 0)
				return "-" + this.negate().toString(b);
			var k;
			if (b == 16)
				k = 4;
			else if (b == 8)
				k = 3;
			else if (b == 2)
				k = 1;
			else if (b == 32)
				k = 5;
			else if (b == 4)
				k = 2;
			else
				return this.toRadix(b);
			var km = (1 << k) - 1,
			d,
			m = false,
			r = "",
			i = this.t;
			var p = this.DB - (i * this.DB) % k;
			if (i-- > 0) {
				if (p < this.DB && (d = this[i] >> p) > 0) {
					m = true;
					r = int2char(d);
				}
				while (i >= 0) {
					if (p < k) {
						d = (this[i] & ((1 << p) - 1)) << (k - p);
						d |= this[--i] >> (p += this.DB - k);
					} else {
						d = (this[i] >> (p -= k)) & km;
						if (p <= 0) {
							p += this.DB;
							--i;
						}
					}
					if (d > 0)
						m = true;
					if (m)
						r += int2char(d);
				}
			}
			return m ? r : "0";
		};

		// (public) -this
		BigInteger.prototype.negate = function () {
			var r = nbi();
			BigInteger.ZERO.subTo(this, r);
			return r;
		};

		// (public) |this|
		BigInteger.prototype.abs = function () {
			return (this.s < 0) ? this.negate() : this;
		};

		// (public) return + if this > a, - if this < a, 0 if equal
		BigInteger.prototype.compareTo = function (a) {
			var r = this.s - a.s;
			if (r != 0)
				return r;
			var i = this.t;
			r = i - a.t;
			if (r != 0)
				return (this.s < 0) ? -r : r;
			while (--i >= 0)
				if ((r = this[i] - a[i]) != 0)
					return r;
			return 0;
		}

		// (public) return the number of bits in "this"
		BigInteger.prototype.bitLength = function () {
			if (this.t <= 0)
				return 0;
			return this.DB * (this.t - 1) + nbits(this[this.t - 1]^(this.s & this.DM));
		};

		// (public) this mod a
		BigInteger.prototype.mod = function (a) {
			var r = nbi();
			this.abs().divRemTo(a, null, r);
			if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0)
				a.subTo(r, r);
			return r;
		}

		// (public) this^e % m, 0 <= e < 2^32
		BigInteger.prototype.modPowInt = function (e, m) {
			var z;
			if (e < 256 || m.isEven())
				z = new Classic(m);
			else
				z = new Montgomery(m);
			return this.exp(e, z);
		};

		// "constants"
		BigInteger.ZERO = nbv(0);
		BigInteger.ONE = nbv(1);

		// Copyright (c) 2005-2009  Tom Wu
		// All Rights Reserved.
		// See "LICENSE" for details.
		// Extended JavaScript BN functions, required for RSA private ops.
		// Version 1.1: new BigInteger("0", 10) returns "proper" zero
		// Version 1.2: square() API, isProbablePrime fix


		// return index of lowest 1-bit in x, x < 2^31
		function lbit(x) {
			if (x == 0)
				return -1;
			var r = 0;
			if ((x & 0xffff) == 0) {
				x >>= 16;
				r += 16;
			}
			if ((x & 0xff) == 0) {
				x >>= 8;
				r += 8;
			}
			if ((x & 0xf) == 0) {
				x >>= 4;
				r += 4;
			}
			if ((x & 3) == 0) {
				x >>= 2;
				r += 2;
			}
			if ((x & 1) == 0)
				++r;
			return r;
		}

		// return number of 1 bits in x
		function cbit(x) {
			var r = 0;
			while (x != 0) {
				x &= x - 1;
				++r;
			}
			return r;
		}

		var lowprimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
		var lplim = (1 << 26) / lowprimes[lowprimes.length - 1];

		// (protected) return x s.t. r^x < DV
		BigInteger.prototype.chunkSize = function (r) {
			return Math.floor(Math.LN2 * this.DB / Math.log(r));
		};

		// (protected) convert to radix string
		BigInteger.prototype.toRadix = function (b) {
			if (b == null)
				b = 10;
			if (this.signum() == 0 || b < 2 || b > 36)
				return "0";
			var cs = this.chunkSize(b);
			var a = Math.pow(b, cs);
			var d = nbv(a),
			y = nbi(),
			z = nbi(),
			r = "";
			this.divRemTo(d, y, z);
			while (y.signum() > 0) {
				r = (a + z.intValue()).toString(b).substr(1) + r;
				y.divRemTo(d, y, z);
			}
			return z.intValue().toString(b) + r;
		};

		// (protected) convert from radix string
		BigInteger.prototype.fromRadix = function (s, b) {
			this.fromInt(0);
			if (b == null)
				b = 10;
			var cs = this.chunkSize(b);
			var d = Math.pow(b, cs),
			mi = false,
			j = 0,
			w = 0;
			for (var i = 0; i < s.length; ++i) {
				var x = intAt(s, i);
				if (x < 0) {
					if (s.charAt(i) == "-" && this.signum() == 0)
						mi = true;
					continue;
				}
				w = b * w + x;
				if (++j >= cs) {
					this.dMultiply(d);
					this.dAddOffset(w, 0);
					j = 0;
					w = 0;
				}
			}
			if (j > 0) {
				this.dMultiply(Math.pow(b, j));
				this.dAddOffset(w, 0);
			}
			if (mi)
				BigInteger.ZERO.subTo(this, this);
		};

		// (protected) alternate constructor
		BigInteger.prototype.fromNumber = function (a, b, c) {
			if ("number" == typeof b) {
				// new BigInteger(int,int,RNG)
				if (a < 2)
					this.fromInt(1);
				else {
					this.fromNumber(a, c);
					if (!this.testBit(a - 1)) // force MSB set
						this.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, this);
					if (this.isEven())
						this.dAddOffset(1, 0); // force odd
					while (!this.isProbablePrime(b)) {
						this.dAddOffset(2, 0);
						if (this.bitLength() > a)
							this.subTo(BigInteger.ONE.shiftLeft(a - 1), this);
					}
				}
			} else {
				// new BigInteger(int,RNG)
				var x = new Array(),
				t = a & 7;
				x.length = (a >> 3) + 1;
				b.nextBytes(x);
				if (t > 0)
					x[0] &= ((1 << t) - 1);
				else
					x[0] = 0;
				this.fromString(x, 256);
			}
		};

		// (protected) r = this op a (bitwise)
		BigInteger.prototype.bitwiseTo = function (a, op, r) {
			var i,
			f,
			m = Math.min(a.t, this.t);
			for (i = 0; i < m; ++i)
				r[i] = op(this[i], a[i]);
			if (a.t < this.t) {
				f = a.s & this.DM;
				for (i = m; i < this.t; ++i)
					r[i] = op(this[i], f);
				r.t = this.t;
			} else {
				f = this.s & this.DM;
				for (i = m; i < a.t; ++i)
					r[i] = op(f, a[i]);
				r.t = a.t;
			}
			r.s = op(this.s, a.s);
			r.clamp();
		};

		// (protected) this op (1<<n)
		BigInteger.prototype.changeBit = function (n, op) {
			var r = BigInteger.ONE.shiftLeft(n);
			this.bitwiseTo(r, op, r);
			return r;
		};

		// (protected) r = this + a
		BigInteger.prototype.addTo = function (a, r) {
			var i = 0,
			c = 0,
			m = Math.min(a.t, this.t);
			while (i < m) {
				c += this[i] + a[i];
				r[i++] = c & this.DM;
				c >>= this.DB;
			}
			if (a.t < this.t) {
				c += a.s;
				while (i < this.t) {
					c += this[i];
					r[i++] = c & this.DM;
					c >>= this.DB;
				}
				c += this.s;
			} else {
				c += this.s;
				while (i < a.t) {
					c += a[i];
					r[i++] = c & this.DM;
					c >>= this.DB;
				}
				c += a.s;
			}
			r.s = (c < 0) ? -1 : 0;
			if (c > 0)
				r[i++] = c;
			else if (c < -1)
				r[i++] = this.DV + c;
			r.t = i;
			r.clamp();
		};

		// (protected) this *= n, this >= 0, 1 < n < DV
		BigInteger.prototype.dMultiply = function (n) {
			this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
			++this.t;
			this.clamp();
		};

		// (protected) this += n << w words, this >= 0
		BigInteger.prototype.dAddOffset = function (n, w) {
			if (n == 0)
				return;
			while (this.t <= w)
				this[this.t++] = 0;
			this[w] += n;
			while (this[w] >= this.DV) {
				this[w] -= this.DV;
				if (++w >= this.t)
					this[this.t++] = 0;
				++this[w];
			}
		};

		// (protected) r = lower n words of "this * a", a.t <= n
		// "this" should be the larger one if appropriate.
		BigInteger.prototype.multiplyLowerTo = function (a, n, r) {
			var i = Math.min(this.t + a.t, n);
			r.s = 0; // assumes a,this >= 0
			r.t = i;
			while (i > 0)
				r[--i] = 0;
			var j;
			for (j = r.t - this.t; i < j; ++i)
				r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);
			for (j = Math.min(a.t, n); i < j; ++i)
				this.am(0, a[i], r, i, 0, n - i);
			r.clamp();
		};

		// (protected) r = "this * a" without lower n words, n > 0
		// "this" should be the larger one if appropriate.
		BigInteger.prototype.multiplyUpperTo = function (a, n, r) {
			--n;
			var i = r.t = this.t + a.t - n;
			r.s = 0; // assumes a,this >= 0
			while (--i >= 0)
				r[i] = 0;
			for (i = Math.max(n - this.t, 0); i < a.t; ++i)
				r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);
			r.clamp();
			r.drShiftTo(1, r);
		};

		// (protected) this % n, n < 2^26
		BigInteger.prototype.modInt = function (n) {
			if (n <= 0)
				return 0;
			var d = this.DV % n,
			r = (this.s < 0) ? n - 1 : 0;
			if (this.t > 0)
				if (d == 0)
					r = this[0] % n;
				else
					for (var i = this.t - 1; i >= 0; --i)
						r = (d * r + this[i]) % n;
			return r;
		};

		// (protected) true if probably prime (HAC 4.24, Miller-Rabin)
		BigInteger.prototype.millerRabin = function (t) {
			var n1 = this.subtract(BigInteger.ONE);
			var k = n1.getLowestSetBit();
			if (k <= 0)
				return false;
			var r = n1.shiftRight(k);
			t = (t + 1) >> 1;
			if (t > lowprimes.length)
				t = lowprimes.length;
			var a = nbi();
			for (var i = 0; i < t; ++i) {
				//Pick bases at random, instead of starting at 2
				a.fromInt(lowprimes[Math.floor(Math.random() * lowprimes.length)]);
				var y = a.modPow(r, this);
				if (y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
					var j = 1;
					while (j++ < k && y.compareTo(n1) != 0) {
						y = y.modPowInt(2, this);
						if (y.compareTo(BigInteger.ONE) == 0)
							return false;
					}
					if (y.compareTo(n1) != 0)
						return false;
				}
			}
			return true;
		};

		// (public)
		BigInteger.prototype.clone = function () {
			var r = nbi();
			this.copyTo(r);
			return r;
		};

		// (public) return value as integer
		BigInteger.prototype.intValue = function () {
			if (this.s < 0) {
				if (this.t == 1)
					return this[0] - this.DV;
				else if (this.t == 0)
					return -1;
			} else if (this.t == 1)
				return this[0];
			else if (this.t == 0)
				return 0;
			// assumes 16 < DB < 32
			return ((this[1] & ((1 << (32 - this.DB)) - 1)) << this.DB) | this[0];
		};

		// (public) return value as byte
		BigInteger.prototype.byteValue = function () {
			return (this.t == 0) ? this.s : (this[0] << 24) >> 24;
		};

		// (public) return value as short (assumes DB>=16)
		BigInteger.prototype.shortValue = function () {
			return (this.t == 0) ? this.s : (this[0] << 16) >> 16;
		};

		// (public) 0 if this == 0, 1 if this > 0
		BigInteger.prototype.signum = function () {
			if (this.s < 0)
				return -1;
			else if (this.t <= 0 || (this.t == 1 && this[0] <= 0))
				return 0;
			else
				return 1;
		};

		// (public) convert to bigendian byte array
		BigInteger.prototype.toByteArray = function () {
			var i = this.t,
			r = new Array();
			r[0] = this.s;
			var p = this.DB - (i * this.DB) % 8,
			d,
			k = 0;
			if (i-- > 0) {
				if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p)
					r[k++] = d | (this.s << (this.DB - p));
				while (i >= 0) {
					if (p < 8) {
						d = (this[i] & ((1 << p) - 1)) << (8 - p);
						d |= this[--i] >> (p += this.DB - 8);
					} else {
						d = (this[i] >> (p -= 8)) & 0xff;
						if (p <= 0) {
							p += this.DB;
							--i;
						}
					}
					if ((d & 0x80) != 0)
						d |= -256;
					if (k == 0 && (this.s & 0x80) != (d & 0x80))
						++k;
					if (k > 0 || d != this.s)
						r[k++] = d;
				}
			}
			return r;
		};

		BigInteger.prototype.equals = function (a) {
			return (this.compareTo(a) == 0);
		};
		BigInteger.prototype.min = function (a) {
			return (this.compareTo(a) < 0) ? this : a;
		};
		BigInteger.prototype.max = function (a) {
			return (this.compareTo(a) > 0) ? this : a;
		};

		// (public) this & a
		function op_and(x, y) {
			return x & y;
		}
		BigInteger.prototype.and = function (a) {
			var r = nbi();
			this.bitwiseTo(a, op_and, r);
			return r;
		};

		// (public) this | a
		function op_or(x, y) {
			return x | y;
		}
		BigInteger.prototype.or = function (a) {
			var r = nbi();
			this.bitwiseTo(a, op_or, r);
			return r;
		};

		// (public) this ^ a
		function op_xor(x, y) {
			return x^y;
		}
		BigInteger.prototype.xor = function (a) {
			var r = nbi();
			this.bitwiseTo(a, op_xor, r);
			return r;
		};

		// (public) this & ~a
		function op_andnot(x, y) {
			return x & ~y;
		}
		BigInteger.prototype.andNot = function (a) {
			var r = nbi();
			this.bitwiseTo(a, op_andnot, r);
			return r;
		};

		// (public) ~this
		BigInteger.prototype.not = function () {
			var r = nbi();
			for (var i = 0; i < this.t; ++i)
				r[i] = this.DM & ~this[i];
			r.t = this.t;
			r.s = ~this.s;
			return r;
		};

		// (public) this << n
		BigInteger.prototype.shiftLeft = function (n) {
			var r = nbi();
			if (n < 0)
				this.rShiftTo(-n, r);
			else
				this.lShiftTo(n, r);
			return r;
		};

		// (public) this >> n
		BigInteger.prototype.shiftRight = function (n) {
			var r = nbi();
			if (n < 0)
				this.lShiftTo(-n, r);
			else
				this.rShiftTo(n, r);
			return r;
		};

		// (public) returns index of lowest 1-bit (or -1 if none)
		BigInteger.prototype.getLowestSetBit = function () {
			for (var i = 0; i < this.t; ++i)
				if (this[i] != 0)
					return i * this.DB + lbit(this[i]);
			if (this.s < 0)
				return this.t * this.DB;
			return -1;
		};

		// (public) return number of set bits
		BigInteger.prototype.bitCount = function () {
			var r = 0,
			x = this.s & this.DM;
			for (var i = 0; i < this.t; ++i)
				r += cbit(this[i]^x);
			return r;
		};

		// (public) true iff nth bit is set
		BigInteger.prototype.testBit = function (n) {
			var j = Math.floor(n / this.DB);
			if (j >= this.t)
				return (this.s != 0);
			return ((this[j] & (1 << (n % this.DB))) != 0);
		};

		// (public) this | (1<<n)
		BigInteger.prototype.setBit = function (n) {
			return this.changeBit(n, op_or);
		};
		// (public) this & ~(1<<n)
		BigInteger.prototype.clearBit = function (n) {
			return this.changeBit(n, op_andnot);
		};
		// (public) this ^ (1<<n)
		BigInteger.prototype.flipBit = function (n) {
			return this.changeBit(n, op_xor);
		};
		// (public) this + a
		BigInteger.prototype.add = function (a) {
			var r = nbi();
			this.addTo(a, r);
			return r;
		};
		// (public) this - a
		BigInteger.prototype.subtract = function (a) {
			var r = nbi();
			this.subTo(a, r);
			return r;
		};
		// (public) this * a
		BigInteger.prototype.multiply = function (a) {
			var r = nbi();
			this.multiplyTo(a, r);
			return r;
		};
		// (public) this / a
		BigInteger.prototype.divide = function (a) {
			var r = nbi();
			this.divRemTo(a, r, null);
			return r;
		};
		// (public) this % a
		BigInteger.prototype.remainder = function (a) {
			var r = nbi();
			this.divRemTo(a, null, r);
			return r;
		};
		// (public) [this/a,this%a]
		BigInteger.prototype.divideAndRemainder = function (a) {
			var q = nbi(),
			r = nbi();
			this.divRemTo(a, q, r);
			return new Array(q, r);
		};

		// (public) this^e % m (HAC 14.85)
		BigInteger.prototype.modPow = function (e, m) {
			var i = e.bitLength(),
			k,
			r = nbv(1),
			z;
			if (i <= 0)
				return r;
			else if (i < 18)
				k = 1;
			else if (i < 48)
				k = 3;
			else if (i < 144)
				k = 4;
			else if (i < 768)
				k = 5;
			else
				k = 6;
			if (i < 8)
				z = new Classic(m);
			else if (m.isEven())
				z = new Barrett(m);
			else
				z = new Montgomery(m);

			// precomputation
			var g = new Array(),
			n = 3,
			k1 = k - 1,
			km = (1 << k) - 1;
			g[1] = z.convert(this);
			if (k > 1) {
				var g2 = nbi();
				z.sqrTo(g[1], g2);
				while (n <= km) {
					g[n] = nbi();
					z.mulTo(g2, g[n - 2], g[n]);
					n += 2;
				}
			}

			var j = e.t - 1,
			w,
			is1 = true,
			r2 = nbi(),
			t;
			i = nbits(e[j]) - 1;
			while (j >= 0) {
				if (i >= k1)
					w = (e[j] >> (i - k1)) & km;
				else {
					w = (e[j] & ((1 << (i + 1)) - 1)) << (k1 - i);
					if (j > 0)
						w |= e[j - 1] >> (this.DB + i - k1);
				}

				n = k;
				while ((w & 1) == 0) {
					w >>= 1;
					--n;
				}
				if ((i -= n) < 0) {
					i += this.DB;
					--j;
				}
				if (is1) { // ret == 1, don't bother squaring or multiplying it
					g[w].copyTo(r);
					is1 = false;
				} else {
					while (n > 1) {
						z.sqrTo(r, r2);
						z.sqrTo(r2, r);
						n -= 2;
					}
					if (n > 0)
						z.sqrTo(r, r2);
					else {
						t = r;
						r = r2;
						r2 = t;
					}
					z.mulTo(r2, g[w], r);
				}
				while (j >= 0 && (e[j] & (1 << i)) == 0) {
					z.sqrTo(r, r2);
					t = r;
					r = r2;
					r2 = t;
					if (--i < 0) {
						i = this.DB - 1;
						--j;
					}
				}
			}
			return z.revert(r);
		};

		// (public) 1/this % m (HAC 14.61)
		BigInteger.prototype.modInverse = function (m) {
			var ac = m.isEven();
			if ((this.isEven() && ac) || m.signum() == 0)
				return BigInteger.ZERO;
			var u = m.clone(),
			v = this.clone();
			var a = nbv(1),
			b = nbv(0),
			c = nbv(0),
			d = nbv(1);
			while (u.signum() != 0) {
				while (u.isEven()) {
					u.rShiftTo(1, u);
					if (ac) {
						if (!a.isEven() || !b.isEven()) {
							a.addTo(this, a);
							b.subTo(m, b);
						}
						a.rShiftTo(1, a);
					} else if (!b.isEven())
						b.subTo(m, b);
					b.rShiftTo(1, b);
				}
				while (v.isEven()) {
					v.rShiftTo(1, v);
					if (ac) {
						if (!c.isEven() || !d.isEven()) {
							c.addTo(this, c);
							d.subTo(m, d);
						}
						c.rShiftTo(1, c);
					} else if (!d.isEven())
						d.subTo(m, d);
					d.rShiftTo(1, d);
				}
				if (u.compareTo(v) >= 0) {
					u.subTo(v, u);
					if (ac)
						a.subTo(c, a);
					b.subTo(d, b);
				} else {
					v.subTo(u, v);
					if (ac)
						c.subTo(a, c);
					d.subTo(b, d);
				}
			}
			if (v.compareTo(BigInteger.ONE) != 0)
				return BigInteger.ZERO;
			if (d.compareTo(m) >= 0)
				return d.subtract(m);
			if (d.signum() < 0)
				d.addTo(m, d);
			else
				return d;
			if (d.signum() < 0)
				return d.add(m);
			else
				return d;
		};

		// (public) this^e
		BigInteger.prototype.pow = function (e) {
			return this.exp(e, new NullExp());
		};

		// (public) gcd(this,a) (HAC 14.54)
		BigInteger.prototype.gcd = function (a) {
			var x = (this.s < 0) ? this.negate() : this.clone();
			var y = (a.s < 0) ? a.negate() : a.clone();
			if (x.compareTo(y) < 0) {
				var t = x;
				x = y;
				y = t;
			}
			var i = x.getLowestSetBit(),
			g = y.getLowestSetBit();
			if (g < 0)
				return x;
			if (i < g)
				g = i;
			if (g > 0) {
				x.rShiftTo(g, x);
				y.rShiftTo(g, y);
			}
			while (x.signum() > 0) {
				if ((i = x.getLowestSetBit()) > 0)
					x.rShiftTo(i, x);
				if ((i = y.getLowestSetBit()) > 0)
					y.rShiftTo(i, y);
				if (x.compareTo(y) >= 0) {
					x.subTo(y, x);
					x.rShiftTo(1, x);
				} else {
					y.subTo(x, y);
					y.rShiftTo(1, y);
				}
			}
			if (g > 0)
				y.lShiftTo(g, y);
			return y;
		};

		// (public) test primality with certainty >= 1-.5^t
		BigInteger.prototype.isProbablePrime = function (t) {
			var i,
			x = this.abs();
			if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1]) {
				for (i = 0; i < lowprimes.length; ++i)
					if (x[0] == lowprimes[i])
						return true;
				return false;
			}
			if (x.isEven())
				return false;
			i = 1;
			while (i < lowprimes.length) {
				var m = lowprimes[i],
				j = i + 1;
				while (j < lowprimes.length && m < lplim)
					m *= lowprimes[j++];
				m = x.modInt(m);
				while (i < j)
					if (m % lowprimes[i++] == 0)
						return false;
			}
			return x.millerRabin(t);
		};

		// JSBN-specific extension

		// (public) this^2
		BigInteger.prototype.square = function () {
			var r = nbi();
			this.squareTo(r);
			return r;
		};

		// NOTE: BigInteger interfaces not implemented in jsbn:
		// BigInteger(int signum, byte[] magnitude)
		// double doubleValue()
		// float floatValue()
		// int hashCode()
		// long longValue()
		// static BigInteger valueOf(long val)


		// Copyright Stephan Thomas (start) --- //
		// https://raw.github.com/bitcoinjs/bitcoinjs-lib/07f9d55ccb6abd962efb6befdd37671f85ea4ff9/src/util.js
		// BigInteger monkey patching
		BigInteger.valueOf = nbv;

		/**
		 * Returns a byte array representation of the big integer.
		 *
		 * This returns the absolute of the contained value in big endian
		 * form. A value of zero results in an empty array.
		 */
		BigInteger.prototype.toByteArrayUnsigned = function () {
			var ba = this.abs().toByteArray();
			if (ba.length) {
				if (ba[0] == 0) {
					ba = ba.slice(1);
				}
				return ba.map(function (v) {
					return (v < 0) ? v + 256 : v;
				});
			} else {
				// Empty array, nothing to do
				return ba;
			}
		};

		/**
		 * Turns a byte array into a big integer.
		 *
		 * This function will interpret a byte array as a big integer in big
		 * endian notation and ignore leading zeros.
		 */
		BigInteger.fromByteArrayUnsigned = function (ba) {
			if (!ba.length) {
				return ba.valueOf(0);
			} else if (ba[0] & 0x80) {
				// Prepend a zero so the BigInteger class doesn't mistake this
				// for a negative integer.
				return new BigInteger([0].concat(ba));
			} else {
				return new BigInteger(ba);
			}
		};

		/**
		 * Converts big integer to signed byte representation.
		 *
		 * The format for this value uses a the most significant bit as a sign
		 * bit. If the most significant bit is already occupied by the
		 * absolute value, an extra byte is prepended and the sign bit is set
		 * there.
		 *
		 * Examples:
		 *
		 *      0 =>     0x00
		 *      1 =>     0x01
		 *     -1 =>     0x81
		 *    127 =>     0x7f
		 *   -127 =>     0xff
		 *    128 =>   0x0080
		 *   -128 =>   0x8080
		 *    255 =>   0x00ff
		 *   -255 =>   0x80ff
		 *  16300 =>   0x3fac
		 * -16300 =>   0xbfac
		 *  62300 => 0x00f35c
		 * -62300 => 0x80f35c
		 */
		BigInteger.prototype.toByteArraySigned = function () {
			var val = this.abs().toByteArrayUnsigned();
			var neg = this.compareTo(BigInteger.ZERO) < 0;

			if (neg) {
				if (val[0] & 0x80) {
					val.unshift(0x80);
				} else {
					val[0] |= 0x80;
				}
			} else {
				if (val[0] & 0x80) {
					val.unshift(0x00);
				}
			}

			return val;
		};

		/**
		 * Parse a signed big integer byte representation.
		 *
		 * For details on the format please see BigInteger.toByteArraySigned.
		 */
		BigInteger.fromByteArraySigned = function (ba) {
			// Check for negative value
			if (ba[0] & 0x80) {
				// Remove sign bit
				ba[0] &= 0x7f;

				return BigInteger.fromByteArrayUnsigned(ba).negate();
			} else {
				return BigInteger.fromByteArrayUnsigned(ba);
			}
		};
		// Copyright Stephan Thomas (end) --- //


		// ****** REDUCTION ******* //

		// Modular reduction using "classic" algorithm
		var Classic = globals.Classic = function Classic(m) {
			this.m = m;
		}
		Classic.prototype.convert = function (x) {
			if (x.s < 0 || x.compareTo(this.m) >= 0)
				return x.mod(this.m);
			else
				return x;
		};
		Classic.prototype.revert = function (x) {
			return x;
		};
		Classic.prototype.reduce = function (x) {
			x.divRemTo(this.m, null, x);
		};
		Classic.prototype.mulTo = function (x, y, r) {
			x.multiplyTo(y, r);
			this.reduce(r);
		};
		Classic.prototype.sqrTo = function (x, r) {
			x.squareTo(r);
			this.reduce(r);
		};

		// Montgomery reduction
		var Montgomery = globals.Montgomery = function Montgomery(m) {
			this.m = m;
			this.mp = m.invDigit();
			this.mpl = this.mp & 0x7fff;
			this.mph = this.mp >> 15;
			this.um = (1 << (m.DB - 15)) - 1;
			this.mt2 = 2 * m.t;
		}
		// xR mod m
		Montgomery.prototype.convert = function (x) {
			var r = nbi();
			x.abs().dlShiftTo(this.m.t, r);
			r.divRemTo(this.m, null, r);
			if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0)
				this.m.subTo(r, r);
			return r;
		}
		// x/R mod m
		Montgomery.prototype.revert = function (x) {
			var r = nbi();
			x.copyTo(r);
			this.reduce(r);
			return r;
		};
		// x = x/R mod m (HAC 14.32)
		Montgomery.prototype.reduce = function (x) {
			while (x.t <= this.mt2) // pad x so am has enough room later
				x[x.t++] = 0;
			for (var i = 0; i < this.m.t; ++i) {
				// faster way of calculating u0 = x[i]*mp mod DV
				var j = x[i] & 0x7fff;
				var u0 = (j * this.mpl + (((j * this.mph + (x[i] >> 15) * this.mpl) & this.um) << 15)) & x.DM;
				// use am to combine the multiply-shift-add into one call
				j = i + this.m.t;
				x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
				// propagate carry
				while (x[j] >= x.DV) {
					x[j] -= x.DV;
					x[++j]++;
				}
			}
			x.clamp();
			x.drShiftTo(this.m.t, x);
			if (x.compareTo(this.m) >= 0)
				x.subTo(this.m, x);
		};
		// r = "xy/R mod m"; x,y != r
		Montgomery.prototype.mulTo = function (x, y, r) {
			x.multiplyTo(y, r);
			this.reduce(r);
		};
		// r = "x^2/R mod m"; x != r
		Montgomery.prototype.sqrTo = function (x, r) {
			x.squareTo(r);
			this.reduce(r);
		};

		// A "null" reducer
		var NullExp = globals.NullExp = function NullExp() {}
		NullExp.prototype.convert = function (x) {
			return x;
		};
		NullExp.prototype.revert = function (x) {
			return x;
		};
		NullExp.prototype.mulTo = function (x, y, r) {
			x.multiplyTo(y, r);
		};
		NullExp.prototype.sqrTo = function (x, r) {
			x.squareTo(r);
		};

		// Barrett modular reduction
		var Barrett = globals.Barrett = function Barrett(m) {
			// setup Barrett
			this.r2 = nbi();
			this.q3 = nbi();
			BigInteger.ONE.dlShiftTo(2 * m.t, this.r2);
			this.mu = this.r2.divide(m);
			this.m = m;
		}
		Barrett.prototype.convert = function (x) {
			if (x.s < 0 || x.t > 2 * this.m.t)
				return x.mod(this.m);
			else if (x.compareTo(this.m) < 0)
				return x;
			else {
				var r = nbi();
				x.copyTo(r);
				this.reduce(r);
				return r;
			}
		};
		Barrett.prototype.revert = function (x) {
			return x;
		};
		// x = x mod m (HAC 14.42)
		Barrett.prototype.reduce = function (x) {
			x.drShiftTo(this.m.t - 1, this.r2);
			if (x.t > this.m.t + 1) {
				x.t = this.m.t + 1;
				x.clamp();
			}
			this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
			this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
			while (x.compareTo(this.r2) < 0)
				x.dAddOffset(1, this.m.t + 1);
			x.subTo(this.r2, x);
			while (x.compareTo(this.m) >= 0)
				x.subTo(this.m, x);
		};
		// r = x*y mod m; x,y != r
		Barrett.prototype.mulTo = function (x, y, r) {
			x.multiplyTo(y, r);
			this.reduce(r);
		};
		// r = x^2 mod m; x != r
		Barrett.prototype.sqrTo = function (x, r) {
			x.squareTo(r);
			this.reduce(r);
		};

	})(globals);

	/////////////////////////////////////
	(function (Peercoin, BigInteger) {
		Peercoin.Base58 = {
			alphabet : "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
			validRegex : /^[1-9A-HJ-NP-Za-km-z]+$/,
			base : BigInteger.valueOf(58),

			/**
			 * Convert a byte array to a base58-encoded string.
			 *
			 * Written by Mike Hearn for PeercoinJ.
			 *   Copyright (c) 2011 Google Inc.
			 *
			 * Ported to JavaScript by Stefan Thomas.
			 */
			encode : function (input) {
				var bi = BigInteger.fromByteArrayUnsigned(input);
				var chars = [];
				while (bi.compareTo(B58.base) >= 0) {
					var mod = bi.mod(B58.base);
					chars.unshift(B58.alphabet[mod.intValue()]);
					bi = bi.subtract(mod).divide(B58.base);
				}
				chars.unshift(B58.alphabet[bi.intValue()]);

				// Convert leading zeros too.
				for (var i = 0; i < input.length; i++) {
					if (input[i] == 0x00) {
						chars.unshift(B58.alphabet[0]);
					} else
						break;
				}

				return chars.join('');
			},

			/**
			 * Convert a base58-encoded string to a byte array.
			 *
			 * Written by Mike Hearn for BitcoinJ.
			 *   Copyright (c) 2011 Google Inc.
			 *
			 * Ported to JavaScript by Stefan Thomas.
			 */
			decode : function (input) {
				var bi = BigInteger.valueOf(0);
				var leadingZerosNum = 0;
				for (var i = input.length - 1; i >= 0; i--) {
					var alphaIndex = B58.alphabet.indexOf(input[i]);
					if (alphaIndex < 0) {
						throw "Invalid character";
					}
					bi = bi.add(BigInteger.valueOf(alphaIndex)
							.multiply(B58.base.pow(input.length - 1 - i)));

					// This counts leading zero bytes
					if (input[i] == "1")
						leadingZerosNum++;
					else
						leadingZerosNum = 0;
				}
				var bytes = bi.toByteArrayUnsigned();

				// Add leading zeros
				while (leadingZerosNum-- > 0)
					bytes.unshift(0);

				return bytes;
			}
		};

		var B58 = Peercoin.Base58;

	})(Peercoin, globals.BigInteger);

	/////////////////////////////////////////////////////////////////////////////////////////////
	// add Crypto stuff
	////////////////////////////////////////////////////////////////////////////////////////////
	(function (globals) {

		if (typeof Crypto == "undefined" || !Crypto.util) {
			(function () {

				var base64map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

				// Global Crypto object
				var Crypto = globals.Crypto = {};

				// Crypto utilities
				var util = Crypto.util = {

					// Bit-wise rotate left
					rotl : function (n, b) {
						return (n << b) | (n >>> (32 - b));
					},

					// Bit-wise rotate right
					rotr : function (n, b) {
						return (n << (32 - b)) | (n >>> b);
					},

					// Swap big-endian to little-endian and vice versa
					endian : function (n) {

						// If number given, swap endian
						if (n.constructor == Number) {
							return util.rotl(n, 8) & 0x00FF00FF |
							util.rotl(n, 24) & 0xFF00FF00;
						}

						// Else, assume array and swap all items
						for (var i = 0; i < n.length; i++)
							n[i] = util.endian(n[i]);
						return n;

					},

					// Generate an array of any length of random bytes
					randomBytes : function (n) {
						for (var bytes = []; n > 0; n--)
							bytes.push(Math.floor(Math.random() * 256));
						return bytes;
					},

					// Convert a byte array to big-endian 32-bit words
					bytesToWords : function (bytes) {
						for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)
							words[b >>> 5] |= (bytes[i] & 0xFF) << (24 - b % 32);
						return words;
					},

					// Convert big-endian 32-bit words to a byte array
					wordsToBytes : function (words) {
						for (var bytes = [], b = 0; b < words.length * 32; b += 8)
							bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
						return bytes;
					},

					// Convert a byte array to a hex string
					bytesToHex : function (bytes) {
						for (var hex = [], i = 0; i < bytes.length; i++) {
							hex.push((bytes[i] >>> 4).toString(16));
							hex.push((bytes[i] & 0xF).toString(16));
						}
						return hex.join("");
					},

					// Convert a hex string to a byte array
					hexToBytes : function (hex) {
						for (var bytes = [], c = 0; c < hex.length; c += 2)
							bytes.push(parseInt(hex.substr(c, 2), 16));
						return bytes;
					},

					// Convert a byte array to a base-64 string
					bytesToBase64 : function (bytes) {
						for (var base64 = [], i = 0; i < bytes.length; i += 3) {
							var triplet = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
							for (var j = 0; j < 4; j++) {
								if (i * 8 + j * 6 <= bytes.length * 8)
									base64.push(base64map.charAt((triplet >>> 6 * (3 - j)) & 0x3F));
								else
									base64.push("=");
							}
						}

						return base64.join("");
					},

					// Convert a base-64 string to a byte array
					base64ToBytes : function (base64) {
						// Remove non-base-64 characters
						base64 = base64.replace(/[^A-Z0-9+\/]/ig, "");

						for (var bytes = [], i = 0, imod4 = 0; i < base64.length; imod4 = ++i % 4) {
							if (imod4 == 0)
								continue;
							bytes.push(((base64map.indexOf(base64.charAt(i - 1)) & (Math.pow(2, -2 * imod4 + 8) - 1)) << (imod4 * 2)) |
								(base64map.indexOf(base64.charAt(i)) >>> (6 - imod4 * 2)));
						}

						return bytes;
					}

				};

				// Crypto character encodings
				var charenc = Crypto.charenc = {};

				// UTF-8 encoding
				var UTF8 = charenc.UTF8 = {

					// Convert a string to a byte array
					stringToBytes : function (str) {
						return Binary.stringToBytes(unescape(encodeURIComponent(str)));
					},

					// Convert a byte array to a string
					bytesToString : function (bytes) {
						return decodeURIComponent(escape(Binary.bytesToString(bytes)));
					}

				};

				// Binary encoding
				var Binary = charenc.Binary = {

					// Convert a string to a byte array
					stringToBytes : function (str) {
						for (var bytes = [], i = 0; i < str.length; i++)
							bytes.push(str.charCodeAt(i) & 0xFF);
						return bytes;
					},

					// Convert a byte array to a string
					bytesToString : function (bytes) {
						for (var str = [], i = 0; i < bytes.length; i++)
							str.push(String.fromCharCode(bytes[i]));
						return str.join("");
					}

				};

			})();
			////////////////////////

			(function (globalsCrypto) {

				// Shortcuts
				var C = globalsCrypto,
				util = C.util,
				charenc = C.charenc,
				UTF8 = charenc.UTF8,
				Binary = charenc.Binary;

				// Convert a byte array to little-endian 32-bit words
				util.bytesToLWords = function (bytes) {

					var output = Array(bytes.length >> 2);
					for (var i = 0; i < output.length; i++)
						output[i] = 0;
					for (var i = 0; i < bytes.length * 8; i += 8)
						output[i >> 5] |= (bytes[i / 8] & 0xFF) << (i % 32);
					return output;
				};

				// Convert little-endian 32-bit words to a byte array
				util.lWordsToBytes = function (words) {
					var output = [];
					for (var i = 0; i < words.length * 32; i += 8)
						output.push((words[i >> 5] >>> (i % 32)) & 0xff);
					return output;
				};

				// Public API
				var RIPEMD160 = C.RIPEMD160 = function (message, options) {
					var digestbytes = util.lWordsToBytes(RIPEMD160._rmd160(message));
					return options && options.asBytes ? digestbytes :
					options && options.asString ? Binary.bytesToString(digestbytes) :
					util.bytesToHex(digestbytes);
				};

				// The core
				RIPEMD160._rmd160 = function (message) {
					// Convert to byte array
					if (message.constructor == String)
						message = UTF8.stringToBytes(message);

					var x = util.bytesToLWords(message),
					len = message.length * 8;

					/* append padding */
					x[len >> 5] |= 0x80 << (len % 32);
					x[(((len + 64) >>> 9) << 4) + 14] = len;

					var h0 = 0x67452301;
					var h1 = 0xefcdab89;
					var h2 = 0x98badcfe;
					var h3 = 0x10325476;
					var h4 = 0xc3d2e1f0;

					for (var i = 0; i < x.length; i += 16) {
						var T;
						var A1 = h0,
						B1 = h1,
						C1 = h2,
						D1 = h3,
						E1 = h4;
						var A2 = h0,
						B2 = h1,
						C2 = h2,
						D2 = h3,
						E2 = h4;
						for (var j = 0; j <= 79; ++j) {
							T = safe_add(A1, rmd160_f(j, B1, C1, D1));
							T = safe_add(T, x[i + rmd160_r1[j]]);
							T = safe_add(T, rmd160_K1(j));
							T = safe_add(bit_rol(T, rmd160_s1[j]), E1);
							A1 = E1;
							E1 = D1;
							D1 = bit_rol(C1, 10);
							C1 = B1;
							B1 = T;
							T = safe_add(A2, rmd160_f(79 - j, B2, C2, D2));
							T = safe_add(T, x[i + rmd160_r2[j]]);
							T = safe_add(T, rmd160_K2(j));
							T = safe_add(bit_rol(T, rmd160_s2[j]), E2);
							A2 = E2;
							E2 = D2;
							D2 = bit_rol(C2, 10);
							C2 = B2;
							B2 = T;
						}
						T = safe_add(h1, safe_add(C1, D2));
						h1 = safe_add(h2, safe_add(D1, E2));
						h2 = safe_add(h3, safe_add(E1, A2));
						h3 = safe_add(h4, safe_add(A1, B2));
						h4 = safe_add(h0, safe_add(B1, C2));
						h0 = T;
					}
					return [h0, h1, h2, h3, h4];
				}

				function rmd160_f(j, x, y, z) {
					return (0 <= j && j <= 15) ? (x^y^z) :
					(16 <= j && j <= 31) ? (x & y) | (~x & z) :
					(32 <= j && j <= 47) ? (x | ~y)^z :
					(48 <= j && j <= 63) ? (x & z) | (y & ~z) :
					(64 <= j && j <= 79) ? x^(y | ~z) :
					"rmd160_f: j out of range";
				}
				function rmd160_K1(j) {
					return (0 <= j && j <= 15) ? 0x00000000 :
					(16 <= j && j <= 31) ? 0x5a827999 :
					(32 <= j && j <= 47) ? 0x6ed9eba1 :
					(48 <= j && j <= 63) ? 0x8f1bbcdc :
					(64 <= j && j <= 79) ? 0xa953fd4e :
					"rmd160_K1: j out of range";
				}
				function rmd160_K2(j) {
					return (0 <= j && j <= 15) ? 0x50a28be6 :
					(16 <= j && j <= 31) ? 0x5c4dd124 :
					(32 <= j && j <= 47) ? 0x6d703ef3 :
					(48 <= j && j <= 63) ? 0x7a6d76e9 :
					(64 <= j && j <= 79) ? 0x00000000 :
					"rmd160_K2: j out of range";
				}
				var rmd160_r1 = [
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
					7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
					3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
					1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
					4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
				];
				var rmd160_r2 = [
					5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
					6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
					15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
					8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
					12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
				];
				var rmd160_s1 = [
					11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
					7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
					11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
					11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
					9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
				];
				var rmd160_s2 = [
					8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
					9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
					9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
					15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
					8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
				];

				/*
				 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
				 * to work around bugs in some JS interpreters.
				 */
				function safe_add(x, y) {
					var lsw = (x & 0xFFFF) + (y & 0xFFFF);
					var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
					return (msw << 16) | (lsw & 0xFFFF);
				}

				/*
				 * Bitwise rotate a 32-bit number to the left.
				 */
				function bit_rol(num, cnt) {
					return (num << cnt) | (num >>> (32 - cnt));
				}

			})(globals.Crypto);

			/////////////////////////////////////////////////////////////////////////////////

			(function (globalsCrypto) {

				// Shortcuts
				var C = globalsCrypto,
				util = C.util,
				charenc = C.charenc,
				UTF8 = charenc.UTF8,
				Binary = charenc.Binary;

				// Constants
				var K = [0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
					0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
					0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
					0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
					0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
					0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
					0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
					0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
					0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
					0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
					0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
					0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
					0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
					0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
					0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
					0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2];

				// Public API
				var SHA256 = C.SHA256 = function (message, options) {
					var digestbytes = util.wordsToBytes(SHA256._sha256(message));
					return options && options.asBytes ? digestbytes :
					options && options.asString ? Binary.bytesToString(digestbytes) :
					util.bytesToHex(digestbytes);
				};

				// The core
				SHA256._sha256 = function (message) {

					// Convert to byte array
					if (message.constructor == String)
						message = UTF8.stringToBytes(message);
					/* else, assume byte array already */

					var m = util.bytesToWords(message),
					l = message.length * 8,
					H = [0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
						0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19],
					w = [],
					a,
					b,
					c,
					d,
					e,
					f,
					g,
					h,
					i,
					j,
					t1,
					t2;

					// Padding
					m[l >> 5] |= 0x80 << (24 - l % 32);
					m[((l + 64 >> 9) << 4) + 15] = l;

					for (var i = 0; i < m.length; i += 16) {

						a = H[0];
						b = H[1];
						c = H[2];
						d = H[3];
						e = H[4];
						f = H[5];
						g = H[6];
						h = H[7];

						for (var j = 0; j < 64; j++) {

							if (j < 16)
								w[j] = m[j + i];
							else {

								var gamma0x = w[j - 15],
								gamma1x = w[j - 2],
								gamma0 = ((gamma0x << 25) | (gamma0x >>> 7))^
								((gamma0x << 14) | (gamma0x >>> 18))^
								(gamma0x >>> 3),
								gamma1 = ((gamma1x << 15) | (gamma1x >>> 17))^
								((gamma1x << 13) | (gamma1x >>> 19))^
								(gamma1x >>> 10);

								w[j] = gamma0 + (w[j - 7] >>> 0) +
									gamma1 + (w[j - 16] >>> 0);

							}

							var ch = e & f^~e & g,
							maj = a & b^a & c^b & c,
							sigma0 = ((a << 30) | (a >>> 2))^
							((a << 19) | (a >>> 13))^
							((a << 10) | (a >>> 22)),
							sigma1 = ((e << 26) | (e >>> 6))^
							((e << 21) | (e >>> 11))^
							((e << 7) | (e >>> 25));

							t1 = (h >>> 0) + sigma1 + ch + (K[j]) + (w[j] >>> 0);
							t2 = sigma0 + maj;

							h = g;
							g = f;
							f = e;
							e = (d + t1) >>> 0;
							d = c;
							c = b;
							b = a;
							a = (t1 + t2) >>> 0;

						}

						H[0] += a;
						H[1] += b;
						H[2] += c;
						H[3] += d;
						H[4] += e;
						H[5] += f;
						H[6] += g;
						H[7] += h;

					}

					return H;

				};

				// Package private blocksize
				SHA256._blocksize = 16;

				SHA256._digestsize = 32;

			})(globals.Crypto);
			/////////////
		}

	})(globals);

	//////////////////extends with Address////////////////////////////////////////////////////////////

	//https://raw.github.com/bitcoinjs/bitcoinjs-lib/09e8c6e184d6501a0c2c59d73ca64db5c0d3eb95/src/address.js
	Peercoin.Address = function (bytes) {
		if ("string" == typeof bytes) {
			bytes = Peercoin.Address.decodeString(bytes);
		}
		this.hash = bytes;
		this.version = Peercoin.Address.networkVersion;
	};

	Peercoin.Address.networkVersion = 0x37; // Peercoin mainnet

	/**
	 * Serialize this object as a standard Peercoin address.
	 *
	 * Returns the address as a base58-encoded string in the standardized format.
	 */
	Peercoin.Address.prototype.toString = function () {
		// Get a copy of the hash
		var hash = this.hash.slice(0);

		// Version
		hash.unshift(this.version);
		var checksum = Crypto.SHA256(Crypto.SHA256(hash, {
					asBytes : true
				}), {
				asBytes : true
			});
		var bytes = hash.concat(checksum.slice(0, 4));
		return Peercoin.Base58.encode(bytes);
	};

	Peercoin.Address.prototype.getHashBase64 = function () {
		return Crypto.util.bytesToBase64(this.hash);
	};

	/**
	 * Parse a Peercoin address contained in a string.
	 */
	Peercoin.Address.decodeString = function (string) {
		var bytes = Peercoin.Base58.decode(string);
		var hash = bytes.slice(0, 21);
		var checksum = Crypto.SHA256(Crypto.SHA256(hash, {
					asBytes : true
				}), {
				asBytes : true
			});

		if (checksum[0] != bytes[21] ||
			checksum[1] != bytes[22] ||
			checksum[2] != bytes[23] ||
			checksum[3] != bytes[24]) {
			throw "Checksum validation failed!";
		}

		var version = hash.shift();

		if (version != Peercoin.Address.networkVersion) {
			throw "Version " + version + " not supported!";
		}

		return hash;
	};

	// Peercoin utility functions
	Peercoin.Util = {
		/**
		 * Cross-browser compatibility version of Array.isArray.
		 */
		isArray : Array.isArray || function (o) {
			return Object.prototype.toString.call(o) === '[object Array]';
		},
		/**
		 * Create an array of a certain length filled with a specific value.
		 */
		makeFilledArray : function (len, val) {
			var array = [];
			var i = 0;
			while (i < len) {
				array[i++] = val;
			}
			return array;
		},
		/**
		 * Turn an integer into a "var_int".
		 *
		 * "var_int" is a variable length integer used by Peercoin's binary format.
		 *
		 * Returns a byte array.
		 */
		numToVarInt : function (i) {
			if (i < 0xfd) {
				// unsigned char
				return [i];
			} else if (i <= 1 << 16) {
				// unsigned short (LE)
				return [0xfd, i >>> 8, i & 255];
			} else if (i <= 1 << 32) {
				// unsigned int (LE)
				return [0xfe].concat(Crypto.util.wordsToBytes([i]));
			} else {
				// unsigned long long (LE)
				return [0xff].concat(Crypto.util.wordsToBytes([i >>> 32, i]));
			}
		},
		/**
		 * Parse a Peercoin value byte array, returning a BigInteger.
		 */
		valueToBigInt : function (valueBuffer) {
			if (valueBuffer instanceof BigInteger)
				return valueBuffer;

			// Prepend zero byte to prevent interpretation as negative integer
			return BigInteger.fromByteArrayUnsigned(valueBuffer);
		},
		/**
		 * Format a Peercoin value as a string.
		 *
		 * Takes a BigInteger or byte-array and returns that amount of Peercoins in a
		 * nice standard formatting.
		 *
		 * Examples:
		 * 12.3555
		 * 0.1234
		 * 900.99998888
		 * 34.00
		 */
		formatValue : function (valueBuffer) {
			var value = this.valueToBigInt(valueBuffer).toString();
			var integerPart = value.length > 8 ? value.substr(0, value.length - 8) : '0';
			var decimalPart = value.length > 8 ? value.substr(value.length - 8) : value;
			while (decimalPart.length < 8)
				decimalPart = "0" + decimalPart;
			decimalPart = decimalPart.replace(/0*$/, '');
			while (decimalPart.length < 2)
				decimalPart += "0";
			return integerPart + "." + decimalPart;
		},
		/**
		 * Parse a floating point string as a Peercoin value.
		 *
		 * Keep in mind that parsing user input is messy. You should always display
		 * the parsed value back to the user to make sure we understood his input
		 * correctly.
		 */
		parseValue : function (valueString) {
			// TODO: Detect other number formats (e.g. comma as decimal separator)
			var valueComp = valueString.split('.');
			var integralPart = valueComp[0];
			var fractionalPart = valueComp[1] || "0";
			while (fractionalPart.length < 8)
				fractionalPart += "0";
			fractionalPart = fractionalPart.replace(/^0+/g, '');
			var value = BigInteger.valueOf(parseInt(integralPart));
			value = value.multiply(BigInteger.valueOf(100000000));
			value = value.add(BigInteger.valueOf(parseInt(fractionalPart)));
			return value;
		},
		/**
		 * Calculate RIPEMD160(SHA256(data)).
		 *
		 * Takes an arbitrary byte array as inputs and returns the hash as a byte
		 * array.
		 */
		sha256ripe160 : function (data) {
			return Crypto.RIPEMD160(Crypto.SHA256(data, {
					asBytes : true
				}), {
				asBytes : true
			});
		},
		// double sha256
		dsha256 : function (data) {
			return Crypto.SHA256(Crypto.SHA256(data, {
					asBytes : true
				}), {
				asBytes : true
			});
		}
	};
	//////////////////////////////////////////
	(function (globals) {

		var day = 60 * 60 * 24;
		var stakeMaxAge = 90 * day;
		var coin = 1000000;
		var coinDay = coin * day;

		function DiffToTarget(diff) {
      diff = (diff | 0); //floor it
      //todo: perhaps user BigDecimal.js istead...
			var mantissa = 0x0000ffff / diff;
			var exp = 1;
			var tmp = mantissa;
			while (tmp >= 256.0) {
				tmp /= 256.0;
				exp++;
			}
			for (var i = 0; i < exp; i++) {
				mantissa *= 256.0;
			}
			var bn = new BigInteger('' + (mantissa | 0), 10);
			bn = bn.shiftLeft((26 - exp) * 8);
			return bn;
		}
		function IncCompact(compact) {
			var mantissa = compact & 0x007fffff;
			var neg = compact & 0x00800000;
			var exponent = (compact >> 24);

			if (exponent <= 3) {
				mantissa += (1 << (8 * (3 - exponent)));
			} else {
				mantissa++;
			}

			if (mantissa >= 0x00800000) {
				mantissa >>= 8;
				exponent++;
			}
			return (exponent << 24) | mantissa | neg;
		}

		// BigToCompact converts a whole number N to a compact representation using
		// an unsigned 32-bit number.  The compact representation only provides 23 bits
		// of precision, so values larger than (2^23 - 1) only encode the most
		// significant digits of the number.  See CompactToBig for details.
		function BigToCompact(n) {
			// No need to do any work if it's zero.
			if (n.equals(BigInteger.ZERO)) {
				return 0;
			}

			// Since the base for the exponent is 256, the exponent can be treated
			// as the number of bytes.  So, shift the number right or left
			// accordingly.  This is equivalent to:
			// mantissa = mantissa / 256^(exponent-3)
			var mantissa; // uint32   var	mantissa = compact & 0x007fffff,

			var exponent = n.toByteArrayUnsigned().length;
			if (exponent <= 3) {
				mantissa = n.and(new BigInteger('4294967295', 10)).intValue();
				mantissa <<= 8 * (3 - exponent);
			} else {
				// Use a copy to avoid modifying the caller's original number.
				var tn = new BigInteger(n.toString(), 10);
				mantissa = tn.shiftRight(8 * (exponent - 3)).and(new BigInteger('4294967295', 10)).intValue();
			}

			// When the mantissa already has the sign bit set, the number is too
			// large to fit into the available 23-bits, so divide the number by 256
			// and increment the exponent accordingly.
			if ((mantissa & 0x00800000) != 0) {
				mantissa >>= 8;
				exponent++;
			}

			// Pack the exponent, sign bit, and mantissa into an unsigned 32-bit
			// int and return it.
			var compact = ((exponent << 24) | mantissa);

			if (n.compareTo(BigInteger.ZERO) < 0) {
				compact |= 0x00800000
			}
			return compact;
		}
		function CompactToDiff(bits) {
			var nShift = (bits >> 24) & 0xff;
			var diff = 1.0 * (0x0000ffff) / (bits & 0x00ffffff);
			for (var n = 0; nShift < 29; nShift++) {
				diff *= 256.0;
			}
			for (var n = 0; nShift > 29; nShift--) {
				diff /= 256.0;
			}
			return diff;
		}
		///////////////////////////////////////////////////////////////////////////////////////////////
		// CompactToBig converts a compact representation of a whole number N to an
		// unsigned 32-bit number.  The representation is similar to IEEE754 floating
		// point numbers.
		//
		// Like IEEE754 floating point, there are three basic components: the sign,
		// the exponent, and the mantissa.  They are broken out as follows:
		//
		//	* the most significant 8 bits represent the unsigned base 256 exponent
		// 	* bit 23 (the 24th bit) represents the sign bit
		//	* the least significant 23 bits represent the mantissa
		//
		//	-------------------------------------------------
		//	|   Exponent     |    Sign    |    Mantissa     |
		//	-------------------------------------------------
		//	| 8 bits [31-24] | 1 bit [23] | 23 bits [22-00] |
		//	-------------------------------------------------
		//
		// The formula to calculate N is:
		// 	N = (-1^sign) * mantissa * 256^(exponent-3)
		//
		// This compact form is only used in bitcoin to encode unsigned 256-bit numbers
		// which represent difficulty targets, thus there really is not a need for a
		// sign bit, but it is implemented here to stay consistent with bitcoind.
		function CompactToBig(compact) {
			// Extract the mantissa, sign bit, and exponent.
			var mantissa = compact & 0x007fffff,
			isNegative = (compact & 0x00800000) != 0,
			exponent = (compact >> 24) >>> 0;

			// Since the base for the exponent is 256, the exponent can be treated
			// as the number of bytes to represent the full 256-bit number.  So,
			// treat the exponent as the number of bytes and shift the mantissa
			// right or left accordingly.  This is equivalent to:
			// N = mantissa * 256^(exponent-3)
			var bn;
			if (exponent <= 3) {
				mantissa >>= 8 * (3 - exponent)
				bn = new BigInteger('' + mantissa, 10);
			} else {
				bn = new BigInteger('' + mantissa, 10);
				bn = bn.shiftLeft(8 * (exponent - 3));
			}
			// Make it negative if the sign bit is set.
			if (isNegative) {
				bn = bn.multiply(new BigInteger('-1', 10));
			}

			return bn;
		}

		globals.Mint = {
			DiffToTarget : DiffToTarget,
			IncCompact : IncCompact,
			BigToCompact : BigToCompact,
			CompactToDiff : CompactToDiff,
			CompactToBig : CompactToBig,
			Coin : coin
		};
	}
		(globals.Peercoin));
	/////////////////////////////////////////
	//kernel stuff
	//////////////////////////////////////////
	(function (globals) {

		var day = 60 * 60 * 24;
		var stakeMaxAge = 90 * day;
		var coin = 1000000;
		var coinDay = coin * day;
		var minStakeMinAge = 2592000;

		var Mint = globals.Mint;

		var StakeKernelTemplate = globals.StakeKernelTemplate = function StakeKernelTemplate(tpl, manager) {

			this.BlockFromTime = tpl.BlockFromTime; // int64
			this.StakeModifier = tpl.StakeModifier; //uint64  => BigInteger!!!
			this.PrevTxOffset = tpl.PrevTxOffset; //uint32
			this.PrevTxTime = tpl.PrevTxTime; //int64
			this.PrevTxOutIndex = tpl.PrevTxOutIndex; //uint32
			this.PrevTxOutValue = tpl.PrevTxOutValue; //int64
			this.UnspentOutputs = manager;
			this.IsProtocolV03 = ('IsProtocolV03' in tpl) ? tpl.IsProtocolV03 : true; //bool
			this.StakeMinAge = ('StakeMinAge' in tpl) ? tpl.StakeMinAge : minStakeMinAge; //int64
			this.Bits = ('Bits' in tpl) ? tpl.Bits : this.setBitsWithDifficulty(parseFloat("10.33")); //uint32
			//	this.TxTime = ('TxTime' in tpl) ? tpl.TxTime : (Date.now() / 1000 | 0); //int64
			//	this.StartTime = this.TxTime;
			//this.Stop = false;
			this.Results = [];
      this.maxResults = 7;
		};
 
		var UnspentOutputsToStake = globals.UnspentOutputsToStake = function UnspentOutputsToStake() {
			this.arrStakeKernelTemplates = []; //
			this.Bits = Mint.BigToCompact(Mint.DiffToTarget(parseFloat("15"))); //uint32
			this.TxTime = (Date.now() / 1000 | 0); //int64
			this.StartTime = this.TxTime;
			this.MaxTime = this.TxTime + 3600;
			this.Stop = false;
			this.Results = [];
      this.orgtpl=[];
		};
		UnspentOutputsToStake.prototype.add = function (tpldata) {
			var that = this;
			var addr = true;
			that.orgtpl.some(function (el) {

				if ((el.PrevTxOffset == tpldata.PrevTxOffset && el.PrevTxOutIndex == tpldata.PrevTxOutIndex &&
						el.PrevTxOutValue == tpldata.PrevTxOutValue &&
						el.StakeModifier.toString() == tpldata.StakeModifier.toString())) {
					addr = false;
					return true;
				}
			});

			if (addr) {
				that.orgtpl.push(tpldata);
				this.arrStakeKernelTemplates.push(new StakeKernelTemplate(tpldata, that));
			}
		};
		UnspentOutputsToStake.prototype.setBitsWithDifficulty = function (diff) {
			var that = this;
			that.Bits = Mint.BigToCompact(Mint.DiffToTarget(diff));
			this.arrStakeKernelTemplates.forEach(function (element, index, array) {
				element.Bits = that.Bits;
			});
		};
		UnspentOutputsToStake.prototype.setStartStop = function (start, stop) {
			var that = this;
			that.TxTime = start;
			that.StartTime = that.TxTime;
			that.MaxTime = stop;
		};

		UnspentOutputsToStake.prototype.stop = function () {
			this.Stop = true;
			/*this.arrStakeKernelTemplates.forEach(function (element, index, array) {
			element.Stop = true;
			});*/
		};

		UnspentOutputsToStake.prototype.findStakeAt = function () {
			var stakesfound = [],
			that = this;
      
      //filter out oudated templates
      var newarrKT=[];
			this.arrStakeKernelTemplates.forEach(function (element, index, array) {   
  
        if ((element.UnspentOutputs.TxTime < element.PrevTxTime) || 
            (element.BlockFromTime + element.StakeMinAge > element.UnspentOutputs.TxTime)) { // Transaction timestamp violation
         // console.log("CheckStakeKernelHash() : nTime violation");// Min age requirement

        }else{
          newarrKT.push(element);
        }     
      });
      this.arrStakeKernelTemplates=newarrKT;
      
			this.arrStakeKernelTemplates.forEach(function (element, index, array) {

				//if (!that.Stop && element.Results.length < element.maxResults) {
        if (!that.Stop) {
					var resultobj = element.CheckStakeKernelHash(); //{succes: succes, hash, minTarget:minTarget}

					if (resultobj.success) {
						var comp = Mint.IncCompact(Mint.BigToCompact(resultobj.minTarget));
						var diff = Mint.CompactToDiff(comp);
						if (diff < 0.25) {
							console.log('hmmm is this min diff ok: ' + diff);
              //element.maxResults=1;
              //debugger;
             // console.log(element)
						}
             
               var res = {
                "foundstake" : that.TxTime,
                "mindifficulty" : ((diff * 10) / 10)
              };
              element.Results.push(res);
              stakesfound.push(res);             
            
					}
				}
			});

			return stakesfound;
		};
		
		UnspentOutputsToStake.prototype.findStake = function (mintcallback, progresscallback) {

			var that = this;
			that.Results = [];
			var progressWhen = 0;

			var loop = function () {
				progressWhen++;
				that.TxTime++;

				var res = that.findStakeAt();
				if (res.length > 0) {
					mintcallback(res);
					that.Results.push(res);
				}
				if (progressWhen > 321 / that.arrStakeKernelTemplates.length) {
					progressWhen = 0;

					progresscallback(((that.TxTime - that.StartTime) / (1.0 * (that.MaxTime - that.StartTime))), ((that.MaxTime - that.TxTime) / 60.0).toFixed(1) + ' min remaining');

					if (!that.Stop && that.TxTime < that.MaxTime)
						setTimeout(loop, 50);
					else
						progresscallback(100, 'done');
				} else {
					if (!that.Stop && that.TxTime < that.MaxTime)
						setZeroTimeout(loop);
					else
						progresscallback(100, 'done');
				}
			};

			if (that.arrStakeKernelTemplates.length > 0)
				setZeroTimeout(loop);

		};
		////////////////////////////////////////////
		StakeKernelTemplate.prototype.setBitsWithDifficulty = function (diff) {
			this.Bits = Mint.BigToCompact(Mint.DiffToTarget(diff));
		};

		StakeKernelTemplate.prototype.arraysEqual = function arraysEqual(a, b) {
			if (a === b)
				return true;
			if (a == null || b == null)
				return false;
			if (a.length != b.length)
				return false;

			for (var i = 0; i < a.length; ++i) {
				if (a[i] !== b[i])
					return false;
			}
			return true;
		};

		StakeKernelTemplate.prototype.CheckStakeKernelHash = function () {
			var retobj = {};
			retobj.success = false;
			retobj.minTarget = 0;
			retobj.hash = [];

			if (this.UnspentOutputs.TxTime < this.PrevTxTime) { // Transaction timestamp violation
				console.log("CheckStakeKernelHash() : nTime violation");
        
				return retobj;
			}
			if (this.BlockFromTime + this.StakeMinAge > this.UnspentOutputs.TxTime) { // Min age requirement
				console.log("CheckStakeKernelHash() : min age violation");
      
				return retobj;
			}
			var bnTargetPerCoinDay = Mint.CompactToBig(this.Bits);
			var timeReduction = (this.IsProtocolV03) ? timeReduction = this.StakeMinAge : 0;
			var nTimeWeight = this.UnspentOutputs.TxTime - this.PrevTxTime; // int64
			if (nTimeWeight > stakeMaxAge) {
				nTimeWeight = stakeMaxAge;
			}
			nTimeWeight -= timeReduction;

			var bnCoinDayWeight; // *big.Int
			var valueTime = this.PrevTxOutValue * nTimeWeight;
			if (valueTime > 0) { // no overflow
				bnCoinDayWeight = new BigInteger('' + (Math.floor(valueTime / coinDay)), 10);
			} else {
				// overflow, calc w/ big.Int or return error?
				// err = errors.New("valueTime overflow")
				// return
				var t1 = new BigInteger('' + (24 * 60 * 60), 10);
				var t2 = new BigInteger('' + (coin), 10);
				var t3 = new BigInteger('' + (this.PrevTxOutValue), 10);
				var t4 = new BigInteger('' + (nTimeWeight), 10);
				bnCoinDayWeight = ((t3.multiply(t4)).divide(t2)).divide(t1);
			}
			var targetInt = bnCoinDayWeight.multiply(bnTargetPerCoinDay); // new(big.Int).Mul(bnCoinDayWeight, bnTargetPerCoinDay)
			var buf = [0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0];
			var o = 0;

			if (this.IsProtocolV03) { // v0.3 protocol
				var d = this.StakeModifier.toByteArrayUnsigned().reverse();
				for (var i = 0; i < 8; i++) {
					buf[o] = d[i];
					o++;
				}
			} else { // v0.2 protocol
				var d = t.Bits;
				for (var i = 0; i < 4; i++) {
					buf[o] = (d & 0xff);
					d >>= 8;
					o++;
				}
			}
			var data = [this.BlockFromTime, this.PrevTxOffset, this.PrevTxTime, this.PrevTxOutIndex, this.UnspentOutputs.TxTime];
			for (var k = 0, arrayLength = data.length; k < arrayLength; k++) {
				var d = data[k];
				for (var i = 0; i < 4; i++) {
					buf[o] = (d & 0xff);
					d >>= 8;
					o++;
				}
			}
			var hashProofOfStake = (Crypto.SHA256(Crypto.SHA256(buf, {
						asBytes : true
					}), {
					asBytes : true
				})).reverse();

			var hashProofOfStakeInt = BigInteger.fromByteArrayUnsigned(hashProofOfStake);
			if (hashProofOfStakeInt.compareTo(targetInt) > 0) {
				return retobj;
			}

			retobj.minTarget = hashProofOfStakeInt.divide(bnCoinDayWeight).subtract(BigInteger.ONE);
			retobj.success = true;
			retobj.hash = hashProofOfStake;
			return retobj;
		}

	}
		(globals.Peercoin));
	/////////////////////////////////////////

})(typeof exports === 'undefined' ? self : exports);
