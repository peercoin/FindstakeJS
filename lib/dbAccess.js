var config = require("../findstakeconfig");

var async = require("async");
var metaKey = config.config.db.dbmetakey;
var database = config.config.db.database;
const sqlite3 = require("sqlite3").verbose();

const path = require("path");
const dbfile = path.join(__dirname, "..", database);

const setUploaded = function (hash, idx, uploaded, callback) {
  let sqlquery = "UPDATE RawTo SET uploaded = ? WHERE hash=? and idx=?";
  let valarr = [uploaded ? 1 : 0, hash, idx];

  let db = null;

  try {
    db = new sqlite3.Database(dbfile);
    db.run(sqlquery, valarr, function (error) {
      if (error) throw error;
      //console.log(results);
      callback(error);
    });
  } catch (err) {
    console.log(err);
  } finally {
    if (!!db) db.close();
  }
};

const getUploadedForRemoval = function (callback) {
  let sql =
    "select hash, idx from RawTo where COALESCE(RawTo.uploaded,0) = 1 and RawTo.spent= 1";
  // let valarr = [];

  let db = null;
  try {
    db = new sqlite3.Database(dbfile);
    db.all(sql, [], (err, rows) => {
      if (err) {
        throw err;
      }
      let data = !rows || rows.length == 0 ? [] : rows;
      callback(err, data);
    });
  } catch (err) {
    console.log(err);
  } finally {
    if (!!db) db.close();
  }
};

const getToForUpload = function (callback) {
  let sql =
    "SELECT AddressTxo.txo, AddressTxo.idx, RawTo.units, RawTx.data AS txdata, RawBlock.data AS blkdata from AddressTxo " +
    "LEFT JOIN RawTo ON AddressTxo.txo = RawTo.hash AND AddressTxo.idx = RawTo.idx " +
    "LEFT JOIN RawTx ON RawTx.hash = RawTo.hash " +
    "LEFT JOIN RawBlock ON RawBlock.height = RawTx.height " +
    "where RawTo.spent=0 and RawTo.units>0 AND COALESCE(RawTo.uploaded,0) = 0  ";

  // let valarr = [];

  let db = null;
  try {
    db = new sqlite3.Database(dbfile);
    db.all(sql, [], (err, rows) => {
      if (err) {
        throw err;
      }
      let data = !rows || rows.length == 0 ? [] : rows;
      callback(err, data);
    });
  } catch (err) {
    console.log(err);
  } finally {
    if (!!db) db.close();
  }
};

module.exports = (function () {
  var StakeMinAge = 2592000;

  function getMetaDoc(db, key, cb) {
    getMeta(db, key, function (err, body) {
      if (!err) {
        cb(null, body);
      } else {
        cb(err);
      }
    });
  }

  const getMeta = function (db, key, callback) {
    let sql = `SELECT name, data
  FROM Meta
  WHERE name  = ?`;

    try {
      db.get(sql, [key], (error, row) => {
        if (error) throw error;
        console.log(row);
        let dat = !row ? null : JSON.parse(row.data);
        // console.log(row);

        callback(error, dat);
      });
    } catch (err) {
      console.log(err);
    } finally {
      //db.close();
    }
  };

  const getRawBlock = function (db, key, callback) {
    let sql = `SELECT height, data, hash
  FROM RawBlock
  WHERE height  = ?`;

    try {
      db.get(sql, [key], (error, row) => {
        if (error) throw error;
        console.log(row);

        callback(error, row);
      });
    } catch (err) {
      console.log(err);
    } finally {
    }
  };

  var getStakeModifiers = function (db, blockhlast, callback) {
    var resultArr = [],
      lastMr = "";
    var start = blockhlast - 6 * 24 * 31;
    var end = blockhlast;

    let sql = `SELECT height, data, hash FROM RawBlock
    where height> ? AND height <= ? `;

    try {
      db.all(sql, [start, end], (err, rows) => {
        if (err) {
          throw err;
        }
        rows.forEach((data) => {
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

        resultArr.sort(function (a, b) {
          return a[0] - b[0];
        });
        var mpouts = {}; //[txo]
        mpouts["bmrs"] = resultArr;
        callback(mpouts);
      });
    } catch (err) {
      console.log(err);
    } finally {
    }
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

  function getDataFromAddress(db, address, callback) {
    let sql =
      "SELECT AddressTxo.txo, AddressTxo.idx, RawTo.units, RawTx.data AS txdata, RawBlock.data AS blkdata from AddressTxo " +
      "LEFT JOIN RawTo ON AddressTxo.txo = RawTo.hash AND AddressTxo.idx = RawTo.idx " +
      "LEFT JOIN RawTx ON RawTx.hash = RawTo.hash " +
      "LEFT JOIN RawBlock ON RawBlock.height = RawTx.height " +
      "where RawTo.spent=0 and RawTo.units>0 AND AddressTxo.address = ?";

    try {
      db.all(sql, [address], (err, rows) => {
        if (err) {
          throw err;
        }
        let data = !rows || rows.length == 0 ? [] : rows;
        callback(err, data);
      });
    } catch (err) {
      console.log(err);
    } finally {
    }
  }

  var getUnspents = function (address, cbWhenDone) {
    var mpouts = {},
      returnval = [];

    let db = new sqlite3.Database(dbfile);

    var closeup = function (err, returnval, callback) {
      let ret = returnval;
      db.close();
      callback(err, ret);
    };

    async.waterfall(
      [
        function (callback) {
          getDataFromAddress(db, address, callback);
        },
        function (arrtxo, callback) {
          arrtxo.forEach(function (data) {
            var keyto = "to" + data.txo + "_" + data.idx;
            if (
              JSON.parse(data.txdata).t + StakeMinAge <
              Math.floor(new Date().getTime() / 1000)
            )
              mpouts[keyto] = {
                BlockFromTime: JSON.parse(data.blkdata).bt,
                //StakeModifier16: "",
                PrevTxOffset: JSON.parse(data.txdata).offst,
                PrevTxTime: JSON.parse(data.txdata).t,
                PrevTxOutValue: data.units,
                PrevTxOutIndex: data.idx,
              };
          });
          callback(null, mpouts);
        },
      ],
      function (err, result) {
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

  var getStatus = function (callback) {
    var returnval = {
      difficulty: 0,
      lastupdatedblock: 0,
      lastupdatedblocktime: 0,
      blockModifiers: [],
    };
    let db = new sqlite3.Database(dbfile);

    var closeup = function (err, returnval, callback) {
      let ret = returnval;
      db.close();
      callback(err, ret);
    };

    getMetaDoc(db, metaKey, function (err, val) {
      if (!err) {
        getRawBlock(db, val.MaxBH, function (err, blk) {
          if (!err) {
            returnval["difficulty"] = val.Diff;
            returnval["lastupdatedblock"] = blk.height;

            var blockdata = JSON.parse(blk.data);
            returnval["lastupdatedblocktime"] = blockdata.bt;

            getStakeModifiers(db, blk.height, function (mpouts) {
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
    getStatus: getStatus,
    setUploaded,
    getUploadedForRemoval,
    getToForUpload,
  };
})();
