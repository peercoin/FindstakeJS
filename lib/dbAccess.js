
var config = require('../config');
var async = require('async');
var nano = require('nano')(config.config.db.url);
var db = nano.use(config.config.db.name);
var dbName = config.config.db.name;
var metaKey = config.config.db.dbmetakey;

module.exports = (function () {
  var StakeMinAge = 2592000;



  function arrayContains(arr, val, equals) {
    var i = arr.length;
    while (i--) {
      if (equals(arr[i], val)) {
        return true;
      }
    }
    return false;
  }

  function removeDuplicates(originalArr, equals) {

    var i, len, j, val;
    var arr = [];

    for (i = 0, len = originalArr.length; i < len; ++i) {
      val = originalArr[i];
      if (!arrayContains(arr, val, equals)) {
        arr.push(val);
      }
    }
    return arr;
  }

  function mpoutIsEqual(mp1, mp2) { //{BlockFromTime:0, StakeModifier16:'', PrevTxOffset:0, PrevTxTime:0, PrevTxOutValue:0, PrevTxOutIndex:0};
    return mp1.BlockFromTime === mp2.BlockFromTime
      && mp1.StakeModifier16 === mp2.StakeModifier16
      && mp1.PrevTxOffset === mp2.PrevTxOffset
      && mp1.PrevTxTime === mp2.PrevTxTime
      && mp1.PrevTxOutIndex === mp2.PrevTxOutIndex
      && mp1.PrevTxOutValue === mp2.PrevTxOutValue;
  }
  //;    
  function getDocs(keystart,keyend, cb) {
    db.list({ startkey: keystart, endkey: keyend, limit: 900000, include_docs: true }, cb);
  }

  function getDoc(key, cb) {
    db.get(key, function (err, body) {
      if (!err) {
        cb(null, body)

      } else {
        cb(err);
      }
    });
  }

  var getUnspents = function (address, cbWhenDone) {
    var mpouts = {}, returnval = [];

    async.waterfall([
      function (callback) {

        getDoc(address, callback);

      },
      function (body, callback) {

        var arrtxo = body.txos;
        arrtxo.forEach(function (txo, index, array) {
          mpouts[txo] = { BlockFromTime: 0, StakeModifier16: '', PrevTxOffset: 0, PrevTxTime: 0, PrevTxOutValue: 0, PrevTxOutIndex: 0 };
        });

        getTx(mpouts, callback);
      },
      getValues
    ],
      function (err, result) {

        //dumb it down
        for (var property in mpouts) {
          if (mpouts.hasOwnProperty(property)) {
            returnval.push(mpouts[property]);
          }
        }
        returnval = removeDuplicates(returnval, mpoutIsEqual);
        cbWhenDone(err, returnval);
      });
  };

  var getTx = function (mpouts, cbWhenDone) {

    var arrTxo = [];
    for (var property in mpouts) {
      if (mpouts.hasOwnProperty(property)) {
        arrTxo.push(property);
      }
    }





    async.each(arrTxo, function (txo, callback) {
      var tx = 'tx' + txo.slice(2, 66);
      mpouts[txo].PrevTxOutIndex = parseInt(txo.slice(67), 10);

      getDoc(tx, function (err, val) {
        if (err) { // likely the key was not found
          delete mpouts[txo];
          callback();
        }
        else if ((val.t + StakeMinAge) > (Math.floor((new Date).getTime() / 1000))) {
          delete mpouts[txo];
          callback();
        }
        else {
          mpouts[txo].PrevTxOffset = val.offst;
          mpouts[txo].PrevTxTime = val.t;
          //console.log('bh'+val.bh)


          getDoc('bh' + val.bh, function (err, value) {
            if (err) {
              delete mpouts[txo];// likely the key was not found
            }
            else {
              //console.log(value)
              mpouts[txo].BlockFromTime = value.bt;
              mpouts[txo].StakeModifier16 = value.smr;
            }
            callback();
          });
        }

      });

    }, function (err) {
      // if any produced an error, err would equal that error
      if (err) {
        // One of the iterations produced an error.
        // All processing will now stop.
        //cbWhenDone('no values found');

        cbWhenDone(null, mpouts);
      } else {
        cbWhenDone(null, mpouts);
      }
    });


  }


  var getValues = function (mpouts, cbWhenDone) {

    var arrTxo = [];
    for (var property in mpouts) {
      if (mpouts.hasOwnProperty(property)) {
        arrTxo.push(property);
      }
    }

    async.each(arrTxo, function (txo, callback) {
      var _txo = txo;

      getDoc(_txo, function (err, val) {
        if (err) { // likely the key was not found
          delete mpouts[_txo];
        } else {
          mpouts[_txo].PrevTxOutValue = val.v;
        }

        callback();
      });

    }, function (err) {
      // if any produced an error, err would equal that error
      if (err) {
        // One of the iterations produced an error.
        // All processing will now stop.

        //cbWhenDone('no values found');
        cbWhenDone(null, mpouts);
      } else {
        cbWhenDone(null, mpouts);
      }
    });
  }


  var getStakeModifiers = function (blockhlast, callback) {

    var resultArr = [], lastMr = '';
    var start = 'bh' + (blockhlast - (6 * 24 * 30));
    var end = 'bh' + blockhlast;

    getDocs(start, end, function (err, body) {
      if (!err) { 
        body.rows.forEach(function (data) {  
          if (((Math.floor((new Date).getTime() / 1000)) - data.doc.bt) < (3600 * 24 * 23)) {

            if (lastMr != data.doc.mr) {
              lastMr = data.doc.mr;

              if (lastMr != '') resultArr.push([data.doc.bt, data.doc.mr]);
            }

          }
        });
        var mpouts = {};//[txo]
        mpouts['bmrs'] = resultArr;
        callback(mpouts);
      }
    });

  }


  var getStatus = function (callback) {
    var returnval = {};

    getDoc(metaKey, function (err, val) {
      if (!err) {

        getDoc('bh' + val.MaxBH, function (err, blk) {
          if (!err) {

            returnval['difficulty'] = val.Diff;
            returnval['lastupdatedblock'] = blk.h;
            returnval['lastupdatedblocktime'] = blk.bt;

            getStakeModifiers(blk.h, function (mpouts) {

              returnval['blockModifiers'] = mpouts['bmrs'];


              callback(err, returnval);
            });
          }
          else {
            console.log('no block found?')
            callback(err, returnval);
          }
        });
      }
      else {
        console.log('no metakey found?')
        callback(err, returnval);
      }
    });


  };




  ////////////// public/////////////////
  return {
    getUnspents: getUnspents,
    getStatus: getStatus
  };

})();

