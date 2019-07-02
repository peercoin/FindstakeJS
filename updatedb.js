var bitcoin = require("bitcoin");
var config = require("./findstakeconfig");
var mysql = require("mysql");
var async = require("async");
var moment = require("moment");

const pool = mysql.createPool({
  connectionLimit: 1,
  host: config.config.db.host,
  user: config.config.db.user,
  password: config.config.db.password,
  database: config.config.db.database
});
//other globals:
let metaData = null,
  Coin = 1000000,
  BlockHeaderSize = 80,
  metaKey = config.config.db.dbmetakey,
  blksteps = 24;

const client = new bitcoin.Client({
  host: config.config.rpc.host,
  port: config.config.rpc.port,
  user: config.config.rpc.user,
  pass: config.config.rpc.pass
});

var getSizeVarInt = function(n) {
  if (n < 253) return 1;
  else if (n <= 65535) return 3;
  else if (n <= 4294967295) return 5;
  else return 9;
};

const upsertAddressTxo = function(key, value, callback) {
  const to = value.substring(2).split("_")[0];
  const indx = value.substring(2).split("_")[1];
  let sqlquery =
    "INSERT INTO AddressTxo (address, txo, idx) VALUES ('" +
    key +
    "', '" +
    to +
    "', " +
    indx +
    ") ON DUPLICATE KEY UPDATE idx=" +
    indx;
  //console.log(sqlquery);

  pool.query(sqlquery, function(error, results, fields) {
    if (error) throw error;
    //console.log(results);
    callback(error, results);
  });
};

const upsertT = function(value, retried, callback) {
  const prefix = value["_id"].substring(0, 2);
  const key = value["_id"].substring(2).split("_")[0];
  value = Object.assign({}, value);
  let sqlquery = "";
  let satoshi = 0,
    units = 0,
    hasoptreturn = 0;
  if (prefix === "to") {
    let indx = value["_id"].substring(2).split("_")[1];
    units = value["v"] || 0;
    if (typeof value === "object") {
      value = Object.assign({}, value);

      hasoptreturn = !!value["scriptPubKey"]
        ? value["scriptPubKey"]["asm"].slice(0, 9) === "OP_RETURN"
          ? 1
          : 0
        : 0;

      delete value["_id"];
      delete value["v"];
      value = JSON.stringify(value);
    }
    sqlquery =
      "INSERT INTO RawTo (hash, idx, units, data, hasoptreturn) VALUES('" +
      key +
      "', " +
      indx +
      "," +
      units +
      ",'" +
      value +
      "'," +
      hasoptreturn +
      ") ON DUPLICATE KEY UPDATE hasoptreturn=" +
      hasoptreturn +
      ", data='" +
      value +
      "'";
  } else {
    //console.log(value);
    var height = 0;
    if (typeof value === "object") {
      value = Object.assign({}, value);
      satoshi = value["v"] || 0;

      delete value["_id"];
      //delete value["v"];
      height = value["bh"] || 0;
      value = JSON.stringify(value);
    }
    sqlquery =
      "INSERT INTO RawTx (hash, data, height) VALUES('" +
      key +
      "','" +
      value +
      "'," +
      height +
      ") ON DUPLICATE KEY UPDATE height=" +
      height +
      ", data='" +
      value +
      "'";
  }

  // console.log(sqlquery);

  pool.query(sqlquery, function(error, results, fields) {
    if (error) throw error;
    //console.log(results);
    callback(error, results);
  });
};

const deleteTo = function(key, retried, cb) {
  const hash = key.substring(2).split("_")[0];
  const idx = parseInt(key.substring(2).split("_")[1], 10);
  const sql =
    'UPDATE RawTo SET spent = 1 WHERE hash="' + hash + '" AND idx=' + idx;
  //console.log(sql);
  pool.query(sql, function(error, results, fields) {
    if (error) throw error;
    //console.log(results);
    cb();
    //callback(JSON.parse(results[0].data))
  });
};

function getMetaDoc(key, cb) {
  getMeta(pool, key, function(err, body) {
    if (!err) {
      cb(null, body);
    } else {
      cb(err);
    }
  });
}

const getMeta = function(pool, key, callback) {
  pool.query('SELECT * from Meta WHERE name="' + key + '"', function(
    error,
    results,
    fields
  ) {
    if (error) throw error;

    let data = results.length == 0 ? null : results[0].data;
    callback(error, JSON.parse(data));
  });
};

const upsertMeta = function(pool, key, value, callback) {
  if (typeof value === "object") {
    value = JSON.stringify(value);
  }
  let sqlquery =
    "INSERT INTO Meta (name, data) VALUES('" +
    key +
    "', '" +
    value +
    "') ON DUPLICATE KEY UPDATE data='" +
    value +
    "'";
  //console.log(sqlquery);

  pool.query(sqlquery, callback);
};

const updateMetaDb = function(callback) {
  //console.log('updateMeta');
  metaData["_id"] = metaKey;

  upsertMeta(pool, metaKey, metaData, function(error, results, fields) {
    if (error) throw error;
    //console.log(results);
    callback();
  });
};

const upsertBlock = function(pool, key, hash, value, callback) {
  if (typeof value === "object") {
    value = Object.assign({}, value);
    delete value["h"];
    delete value["hs"];
    delete value["tx"];
    delete value["_id"];
    value = JSON.stringify(value);
  }
  let sqlquery =
    "INSERT INTO RawBlock (height, hash, data) VALUES(" +
    key +
    ", '" +
    hash +
    "', '" +
    value +
    "') ON DUPLICATE KEY UPDATE hash='" +
    hash +
    "', data='" +
    value +
    "'";
  //console.log(sqlquery);

  pool.query(sqlquery, callback);
};
const updateBlockDb = function(mydoc, retried, callback) {
  //console.log('updateMeta');
  let height = mydoc["h"] || parseInt(mydoc["_id"].substring(2), 10);
  let hash = mydoc["hs"] || "";
  /*     upsertDoc(metaData, 0, function (err) {
          if (err)
              console.log(err);
          callback();
      }); */
  upsertBlock(pool, height, hash, mydoc, function(error, results, fields) {
    if (error) throw error;
    //console.log(results);
    callback();
  });
};

var updateMeta = function(callback) {
  //console.log('updateMeta');
  callback();
};

var updateAddresses = function(mapAdr, cbWhenDone) {
  //
  var arrAddress = [],
    ops = [];
  for (var address in mapAdr) {
    if (mapAdr.hasOwnProperty(address)) {
      //console.log(address);
      arrAddress.push({
        k: address,
        v: mapAdr[address]
      });
    }
  }
  async.eachSeries(
    arrAddress,
    function(objkv, callback) {
      var adrkey = objkv.k,
        newadrarr = objkv.v;

      var bacthops = newadrarr.map(function(txo) {
        const to = txo;
        const f = function(cbk) {
          upsertAddressTxo(adrkey, to, function() {
            cbk();
          });
        };
        return f;
      });

      async.parallel(bacthops, function() {
        callback();
      });
    },
    function() {
      //console.log('Adr processed successfully');
      cbWhenDone(null, mapAdr);
    }
  );
};

var getLatestMeta = function(cbWhenDone) {
  //get starting point, by default it will choose May 2014 as that was an mandatory version upgrade (0.3) ~blockheight 110000
  async.waterfall(
    [
      function(callback) {
        getMetaDoc(metaKey, function(err, body) {
          if (!err && !!body) {
            metaData = body;
            callback();
          } else {
            metaData = {
              MaxBH: 1, //last synce block
              MaxTx: 1, //last synced tx in block

              Diff: 0, //last diff from rpc
              CurBH: 1 //last blockcount from rpc
            };
            callback();
          }
        });
      },
      function(callback) {
        client.getDifficulty(function(err, difficulty) {
          if (err) return callback(err);

          metaData.Diff = parseFloat(difficulty["proof-of-stake"]);
          callback();
        });
      },
      function(callback) {
        client.getBlockCount(function(err, ht) {
          if (err) return callback(err);
          metaData.CurBH = ht;
          callback();
        });
      },
      updateMeta
    ],
    function(err, result) {
      if (err) {
        console.error(err);
      } else {
        //console.log(metaData);
        console.log("sync from " + metaData.MaxBH);

        cbWhenDone(null, metaData);
      }
    }
  );
};

var updateTxsOfBlock = function(blk, cbWhenDone) {
  var mpTx = {},
    sizeVarintTx = getSizeVarInt(blk.tx.length),
    genTx = function(i, bh) {
      return {
        pos: i, //position in block
        t: -1, //timestamp
        bh: bh, //in blocknr
        sz: -1, //size
        offst: -1 //offset
      };
    },
    isEven = function(n) {
      return n == parseFloat(n) ? !(n % 2) : void 0;
    };

  var getrawtransactions = function(callback) {
    var r = 0,
      batch = [],
      arrtxraw = [];
    blk.tx.forEach(function(hash, index, array) {
      mpTx["tx" + hash] = genTx(index, blk.h);
      batch.push({
        method: "getrawtransaction",
        params: [hash]
      });
    });

    client.cmd(batch, function(err, txraw, resHeaders) {
      if (err) return callback(err);

      if (!isEven(txraw.length)) {
        return callback("length rawtx not even");
      }
      mpTx["tx" + blk.tx[r]].sz = txraw.length / 2; //1 byte is 2 char
      arrtxraw.push(txraw);
      r++;

      if (r == batch.length) {
        var offset = BlockHeaderSize + sizeVarintTx;
        blk.tx.forEach(function(hash, index, array) {
          mpTx["tx" + hash].offst = offset;
          offset += mpTx["tx" + hash].sz;
        });

        callback(null, blk, mpTx, arrtxraw);
      }
    });
  };

  var decoderawtransactions = function(blk, mpTx, arrtxraw, callback) {
    var r = 0,
      batch = [],
      arrvinkeys = [],
      mapvout = {},
      mapAdr = {};

    arrtxraw.forEach(function(raw, index, array) {
      batch.push({
        method: "decoderawtransaction",
        params: [raw]
      });
    });

    client.cmd(batch, function(err, tx, resHeaders) {
      if (err) return callback(err);

      mpTx["tx" + tx.txid].t = tx.time;

      tx.vin.forEach(function(txin, index, array) {
        if (txin.txid) arrvinkeys.push("to" + txin.txid + "_" + txin.vout);
      });

      tx.vout.forEach(function(txout, index, array) {
        if (txout.value * Coin >= 0) {
          mapvout["to" + tx.txid + "_" + txout.n] = {
            v: Math.floor(txout.value * Coin),
            scriptPubKey: txout.scriptPubKey
          };
        }
        if (
          txout.scriptPubKey &&
          txout.scriptPubKey.addresses &&
          Array.isArray(txout.scriptPubKey.addresses)
        ) {
          txout.scriptPubKey.addresses.forEach(function(adr, index, array) {
            if (mapAdr[adr] == null) mapAdr[adr] = [];

            mapAdr[adr].push("to" + tx.txid + "_" + txout.n);
          });
        }
      });

      r++;

      if (r == batch.length) {
        callback(null, blk, mpTx, arrvinkeys, mapvout, mapAdr);
      }
    });
  };

  var updatetxs = function(blk, mpTx, arrvinkeys, mapvout, mapAdr, callback) {
    var ops = [];
    //store data about tx
    for (var property in mpTx) {
      if (mpTx.hasOwnProperty(property)) {
        var newval = mpTx[property];
        //delete newval["sz"]; //not needed anymore
        //delete newval["pos"]; //not needed anymore
        ops.push({
          type: "put",
          key: property,
          value: newval
        });
      }
    }
    //store data about txouts
    for (var property in mapvout) {
      if (mapvout.hasOwnProperty(property)) {
        ops.push({
          type: "put",
          key: property,
          value: mapvout[property]
        });
      }
    }
    //delete spent outs
    arrvinkeys.forEach(function(prevout, index, array) {
      ops.push({
        type: "del",
        key: prevout
      });
    });

    //console.log('update tx to ' + blk.h);
    var bacthops = [];
    ops.forEach(function(params) {
      var p = params;

      if (p.type === "del") {
        var k = p.key;
        if (p.key.substring(0, 2) === "to") {
          bacthops.push(function(cbk) {
            deleteTo(k, 0, function(error) {
              cbk(error);
            });
          });
        }
      } else if (
        p.type === "put" &&
        (p.key.substring(0, 2) === "to" || p.key.substring(0, 2) === "tx")
      ) {
        p.value["_id"] = p.key;
        var d = p.value;
        bacthops.push(function(cbk) {
          upsertT(d, 0, function(err) {
            if (err) console.log(err);
            cbk();
          });
        });
      }
    });

    async.parallel(bacthops, function(err, result) {
      metaData.MaxTx = blk.h;
      updateMeta(function() {
        //store mapping address to unspents
        callback(null, mapAdr);
      });
    });
  };

  async.waterfall(
    [getrawtransactions, decoderawtransactions, updatetxs, updateAddresses],
    function(err, result) {
      if (err) return console.error(err);

      cbWhenDone(null, 1);
    }
  );
};

var updateBlocks = function(_metadata, cbWhenDone) {
  var startbh = metaData.MaxBH;
  var mpBH = {};
  var maxbh =
    Math.abs(metaData.CurBH - metaData.MaxBH) > blksteps + 1
      ? blksteps + 1
      : Math.abs(metaData.CurBH - metaData.MaxBH) - 2;
  var genBH = function(i) {
    return {
      h: i, //height
      f: "", //flag
      hs: "", //hash
      bt: -1, //time
      mr: "", //modifier
      smr: "", //stakemodifier
      tx: [] //transactions
    };
  };

  if (maxbh < 2 || startbh + 8 > 10 * (metaData.CurBH / 10)) {
    return cbWhenDone(null, metaData);
  }

  var getblockhashes = function(callback) {
    var r = startbh,
      batch = [];
    for (var i = startbh; i < startbh + maxbh; i++) {
      mpBH["bh" + i] = genBH(i);
      batch.push({
        method: "getblockhash",
        params: [i]
      });
    }

    client.cmd(batch, function(err, hash, resHeaders) {
      if (err) return callback(err);
      mpBH["bh" + r].hs = hash;
      r++;

      if (r == i) {
        callback(null, mpBH);
      }
    });
  };

  var getblocks = function(mpBH, callback) {
    var r = startbh,
      batch = [];
    for (var i = startbh; i < startbh + maxbh; i++) {
      batch.push({
        method: "getblock",
        params: [mpBH["bh" + i].hs, true]
      });
    }

    client.cmd(batch, function(err, block, resHeaders) {
      if (err) return callback(err);
      mpBH["bh" + r].h = block.height;
      mpBH["bh" + r].bt = Number.isInteger(block.time)
        ? block.time
        : moment(block.time, "YYYY-MM-DD HH:mm:ss Z").unix();
      mpBH["bh" + r].f = block.flags == "proof-of-stake" ? "pos" : "pow";
      mpBH["bh" + r].mr = block.modifier;
      mpBH["bh" + r].tx = block.tx;
      r++;

      if (r == i) {
        callback(null, mpBH);
      }
    });
  };

  var prepblocks = function(mpBH, callback) {
    var max = 0,
      ops = [];
    for (var property in mpBH) {
      if (mpBH.hasOwnProperty(property)) {
        if (mpBH[property].h > max) {
          max = mpBH[property].h;
        }

        ops.push({
          type: "put",
          key: property,
          value: mpBH[property]
        });
      }
    }
    //   console.log('update blocks in batch to' + max);

    const bacthops = ops.map(function(params) {
      let p = params;
      p.value["_id"] = p.key;
      const d = p.value;
      const fun = function(cbk) {
        updateBlockDb(d, 0, function(err) {
          if (err) console.log(err);
          cbk();
        });
      };
      return fun;
    });
    /*     ops.forEach(function(params) {
      var p = params;
      p.value["_id"] = p.key;
      var d = p.value;
      bacthops.push(function(cbk) {
        updateBlockDb(d, 0, function(err) {
          if (err) console.log(err);
          cbk();
        });
      });
    }); */

    async.parallel(bacthops, function(err, result) {
      callback(null, mpBH);
    });
  };

  var processblock = function(mpBH, callback) {
    var arrBlk = [],
      max = 0;
    for (var bkkey in mpBH) {
      if (mpBH.hasOwnProperty(bkkey)) {
        if (mpBH[bkkey].h > max) {
          max = mpBH[bkkey].h;
        }
        console.log("processing block " + mpBH[bkkey].h);
        arrBlk.push(mpBH[bkkey]);
      }
    }

    var batchops = [];
    arrBlk.forEach(function(blk) {
      batchops.push(function(cb) {
        updateTxsOfBlock(blk, function() {
          cb();
        });
      });
    });
    async.waterfall(batchops, function(err, result) {
      if (err) {
        // One of the iterations produced an error.
        // All processing will now stop.
        console.log("A blk failed to process");
        console.log(err);
      } else {
        console.log(
          "All blocks have been processed successfully. Updating metadata."
        );

        metaData.MaxBH = max;

        updateMetaDb(function() {
          callback(null, mpBH);
        });
      }
    });
  };

  async.waterfall(
    [getblockhashes, getblocks, prepblocks, processblock],
    function(err, result) {
      if (err) return console.error(err);
      else cbWhenDone(null, result);
    }
  );
};

var repeatBlockupdate = function() {
  async.waterfall([getLatestMeta, updateBlocks], function(err, result) {
    if (err) {
      console.error(err);
    } else {
      if (metaData.MaxBH + 8 < 10 * (metaData.CurBH / 10)) {
        process.nextTick(repeatBlockupdate);
      } else {
        console.log("~~~~~~~~~~Finished!~~~~~~~~~");
        pool.end(function(err) {
          // all connections in the pool have ended
        });
      }
    }
  });
};

//start
(function() {
  repeatBlockupdate();
})();
