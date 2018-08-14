var config = require("../config");
var mysql = require("mysql");
var async = require("async");
var metaKey = config.config.db.dbmetakey;

module.exports = (function() {
  var StakeMinAge = 2592000;

  function createConnection() {
    var connection = mysql.createConnection({
      host: config.config.db.host,
      user: config.config.db.user,
      password: config.config.db.password,
      database: config.config.db.database
    });
    connection.connect();
    return connection;
  }

  function getMetaDoc(connection, key, cb) {
    getMeta(connection, key, function(err, body) {
      if (!err) {
        cb(null, body);
      } else {
        cb(err);
      }
    });
  }

  function getMeta(connection, key, callback) {
    connection.query('SELECT * from Meta WHERE name="' + key + '"', function(
      error,
      results,
      fields
    ) {
      if (error) throw error;

      let data = results.length == 0 ? null : results[0].data;
      callback(error, JSON.parse(data));
    });
  }

  function getRawBlock(connection, key, callback) {
    connection.query(
      "SELECT * from RawBlock WHERE height=" + key + ";",
      function(error, results, fields) {
        if (error) throw error;

        let data = results.length == 0 ? null : results[0];
        callback(error, data);
      }
    );
  }

  var getStakeModifiers = function(connection, blockhlast, callback) {
    var resultArr = [],
      lastMr = "";
    var start = blockhlast - 6 * 24 * 31;
    var end = blockhlast;

    connection.query(
      "SELECT * from RawBlock WHERE height>" + start + " AND height <= " + end,
      function(error, results, fields) {
        if (error) throw error;

        results.forEach(function(data) {
          var blockdata = JSON.parse(data.data);
          if (
            Math.floor(new Date().getTime() / 1000) - blockdata.bt <
            3600 * 24 * 24
          ) {
            if (lastMr != blockdata.mr) {
              lastMr = blockdata.mr;

              if (lastMr != "") resultArr.push([blockdata.bt, blockdata.mr]);
            }
          }
        });
        resultArr.sort(function(a, b) {
          return a[0] - b[0];
        });
        var mpouts = {}; //[txo]
        mpouts["bmrs"] = resultArr;
        callback(mpouts);
      }
    );
  };

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

  function mpoutIsEqual(mp1, mp2) {
    //{BlockFromTime:0, StakeModifier16:'', PrevTxOffset:0, PrevTxTime:0, PrevTxOutValue:0, PrevTxOutIndex:0};
    return (
      mp1.BlockFromTime === mp2.BlockFromTime &&
      //mp1.StakeModifier16 === mp2.StakeModifier16 &&
      mp1.PrevTxOffset === mp2.PrevTxOffset &&
      mp1.PrevTxTime === mp2.PrevTxTime &&
      mp1.PrevTxOutIndex === mp2.PrevTxOutIndex &&
      mp1.PrevTxOutValue === mp2.PrevTxOutValue
    );
  }

  function getDataFromAddress(connection, address, callback) {
    let sqlquery =
      "SELECT AddressTxo.txo, AddressTxo.idx, RawTo.units, RawTx.data AS txdata, RawBlock.data AS blkdata from AddressTxo " +
      "LEFT JOIN RawTo ON AddressTxo.txo = RawTo.hash AND AddressTxo.idx = RawTo.idx " +
      "LEFT JOIN RawTx ON RawTx.hash = RawTo.hash " +
      "LEFT JOIN RawBlock ON RawBlock.height = RawTx.height " +
      "where RawTo.spent=0 and RawTo.units>0 AND AddressTxo.address='" +
      address +
      "';";
    connection.query(sqlquery, function(error, results, fields) {
      if (error) throw error;

      let data = results.length == 0 ? null : results;
      callback(error, data);
    });
  }

  var getUnspents = function(address, cbWhenDone) {
    var mpouts = {},
      returnval = [];

    var connection = createConnection();

    var closeup = function(err, returnval, callback) {
      connection.end();
      callback(err, returnval);
    };

    async.waterfall(
      [
        function(callback) {
          getDataFromAddress(connection, address, callback);
        },
        function(arrtxo, callback) {
          arrtxo.forEach(function(data) {
            var keyto = "to" + data.txo + "_" + data.idx;
            if (
              JSON.parse(data.txdata).t + StakeMinAge <
              Math.floor(new Date().getTime() / 1000)
            )
              mpouts[keyto] = {
                BlockFromTime: JSON.parse(data.blkdata).bt,

                PrevTxOffset: JSON.parse(data.txdata).offst,
                PrevTxTime: JSON.parse(data.txdata).t,
                PrevTxOutValue: data.units,
                PrevTxOutIndex: data.idx
              };
          });
          callback(null, mpouts);
        }
      ],
      function(err, result) {
        //dumb it down
        for (var property in mpouts) {
          if (mpouts.hasOwnProperty(property)) {
            returnval.push(mpouts[property]);
          }
        }
        returnval = removeDuplicates(returnval, mpoutIsEqual);

        closeup(err, returnval, cbWhenDone);
      }
    );
  };

  var getStatus = function(callback) {
    var returnval = {
      difficulty: 0,
      lastupdatedblock: 0,
      lastupdatedblocktime: 0,
      blockModifiers: []
    };
    var connection = createConnection();

    var closeup = function(err, returnval, callback) {
      connection.end();
      callback(err, returnval);
    };

    getMetaDoc(connection, metaKey, function(err, val) {
      if (!err) {
        getRawBlock(connection, val.MaxBH, function(err, blk) {
          if (!err) {
            returnval["difficulty"] = val.Diff;
            returnval["lastupdatedblock"] = blk.height;

            var blockdata = JSON.parse(blk.data);
            returnval["lastupdatedblocktime"] = blockdata.bt;

            getStakeModifiers(connection, blk.height, function(mpouts) {
              returnval["blockModifiers"] = mpouts["bmrs"];

              closeup(err, returnval, callback);
            });
          } else {
            console.log("no block found?");
            closeup(err, returnval, callback);
          }
        });
      } else {
        console.log("no metakey found?");
        closeup(err, returnval, callback);
      }
    });
  };

  ////////////// public/////////////////
  return {
    getUnspents: getUnspents,
    getStatus: getStatus
  };
})();
