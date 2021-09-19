var config = require("./findstakeconfig");
var async = require("async");
var moment = require("moment");
var RpcClient = require("bitcoind-rpc");
const sqlite3 = require("sqlite3").verbose();
//const dbfile = "findstakejs.dat";

const dbfile = config.config.db.database;

let db = new sqlite3.Database(dbfile);

    db.run('PRAGMA synchronous=OFF', [], function(error) {
      if (error) throw error;
   
    });

    db.run('PRAGMA journal_mode=OFF', [], function(error) {
      if (error) throw error;
   
    });


const pool = {};

//other globals:
let metaData = null,
  Coin = 1000000,
  BlockHeaderSize = 80,
  metaKey = config.config.db.dbmetakey,
  blksteps = 24,
  nProtocolV10SwitchTime = 1635768000; // Mon  1 Nov 12:00:00 UTC 2021

var configrpc = {
  protocol: "http",
  host: config.config.rpc.host,
  port: config.config.rpc.port,
  user: config.config.rpc.user,
  pass: config.config.rpc.pass
};

var client = new RpcClient(configrpc);

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
    "INSERT OR REPLACE INTO AddressTxo (address, txo, idx) VALUES (?,?,?)";

  try {
    db.run(sqlquery, [key, to, indx], function(error) {
      if (error) throw error;
      //console.log(results);
      callback(error);
    });
  } catch (err) {
    console.log(err);
  } finally {
  }
};

const upsertT = function(value, retried, callback) {
  const prefix = value["_id"].substring(0, 2);
  const key = value["_id"].substring(2).split("_")[0];
  value = Object.assign({}, value);
  let sqlquery = "";
  let valarr = [];
  let units = 0,
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
      "INSERT OR REPLACE INTO RawTo (hash, idx, units, data, hasoptreturn) VALUES(?,?,?,?,?)";
    valarr = [key, indx, units, value, hasoptreturn];
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
      "INSERT OR REPLACE INTO RawTx (hash, data, height) VALUES(?,?,?)";
    valarr = [key, value, height];
  }

  try {
    db.run(sqlquery, valarr, function(error) {
      if (error) throw error;
      //console.log(results);
      callback(error);
    });
  } catch (err) {
    console.log(err);
  } finally {
  }
};

const deleteTo = function(key, retried, callback) {
  const hash = key.substring(2).split("_")[0];
  const idx = parseInt(key.substring(2).split("_")[1], 10);

  let data = [hash, idx];
  let sql = `UPDATE RawTo
              SET spent = 1 
              WHERE hash = ? and idx = ? `;

  try {
    db.run(sql, data, function(error) {
      if (error) throw error;
      //console.log(results);
      callback(error);
    });
  } catch (err) {
    console.log(err);
  } finally {
  }
};

const getMeta = function(pool, key, callback) {
  let sql = `SELECT name, data
FROM Meta
WHERE name  = ?`;

  try {
    db.get(sql, [key], (error, row) => {
      //if (error) throw error;

      let dat = !row ? null : JSON.parse(row.data);
      console.log(row);

      callback(error, dat);
    });
  } catch (err) {
    console.log(err);
  } finally {
  }
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

const upsertMeta = function(pool, key, value, callback) {
  if (typeof value === "object") {
    value = JSON.stringify(value);
  }
  let sql = "INSERT OR REPLACE INTO Meta (name, data) VALUES(?,?)";
  let data = [key, value];

  try {
    db.run(sql, data, function(error) {
      if (error) throw error;
      //console.log(results);
      callback(error);
    });
  } catch (err) {
    console.log(err);
  } finally {
  }
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
  let sql =
    "INSERT OR REPLACE INTO RawBlock (height, hash, data) VALUES(?,?,?)";
  let data = [key, hash, value];

  try {
    db.run(sql, data, function(error) {
      if (error) throw error;
      //console.log(results);
      callback(error);
    });
  } catch (err) {
    console.log(err);
  } finally {
  }
};

const updateBlockDb = function(mydoc, retried, callback) {
  //console.log('updateMeta');
  let height = mydoc["h"] || parseInt(mydoc["_id"].substring(2), 10);
  let hash = mydoc["hs"] || "";

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
  var arrAddress = [];
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

          metaData.Diff = parseFloat(difficulty.result["proof-of-stake"]);
          callback();
        });
      },
      function(callback) {
        client.getBlockCount(function(err, ht) {
          if (err) return callback(err);
          metaData.CurBH = ht.result;
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
  let blockheight = blk.h;
  let blocktime = blk.bt;
  var mpTx = {},
    sizeVarintTx = getSizeVarInt(blk.tx.length),
    genTx = function(i, bh, bt) {
      return {
        pos: i, //position in block
        t: -1, //timestamp
        bh: bh, //in block height
        sz: -1, //size
        offst: -1, //offset,
        bt: bt //block time
      };
    },
    isEven = function(n) {
      return n == parseFloat(n) ? !(n % 2) : void 0;
    };

  var getrawtransactions = function(callback) {
    var r = 0,
      batchtxids = [],
      arrtxraw = [];

    blk.tx.forEach(function(hash, index, array) {
      mpTx["tx" + hash] = genTx(index, blockheight, blocktime);
      batchtxids.push(hash);
    });

    let batchCallgetrawtransaction = () => {
      batchtxids.forEach(function(txid) {
        client.getRawTransaction(txid);
      });
    };

    const handelRaw = function(err, rawtxs) {
      if (err) {
        console.error(err);
      }

      rawtxs.map(function(rawtx) {
        let txraw = rawtx.result;
        if (!isEven(txraw.length)) {
          throw "length rawtx not even";
        }
        mpTx["tx" + blk.tx[r]].sz = txraw.length / 2; //1 byte is 2 char
        arrtxraw.push(txraw);
      }); //loop

      let offset = BlockHeaderSize + sizeVarintTx;
      blk.tx.forEach(function(hash) {
        mpTx["tx" + hash].offst = offset;
        offset += mpTx["tx" + hash].sz;
      }); //loop

      callback(null, blk, mpTx, arrtxraw);
    };

    client.batch(batchCallgetrawtransaction, handelRaw);
  };

  const decoderawtransactions = function(blk, mpTx, arrtxraw, callback) {
    let r = 0,
      batchrawhex = [...arrtxraw],
      arrvinkeys = [],
      mapvout = {},
      mapAdr = {};

    let batchCallDecode = () => {
      batchrawhex.forEach(function(raw) {
        client.decodeRawTransaction(raw);
      });
    };

    const handleDecoded = function(err, decoded) {
      if (err) {
        console.error(err);
      }

      decoded.forEach(function(txresult) {
        let tx = txresult.result;

        if (mpTx["tx" + tx.txid].bt < nProtocolV10SwitchTime && !!tx.time){
          mpTx["tx" + tx.txid].t = tx.time;
        }else{
          mpTx["tx" + tx.txid].t = mpTx["tx" + tx.txid].bt
        }
        
        tx.vin.forEach(function(txin) {
          if (txin.txid) arrvinkeys.push("to" + txin.txid + "_" + txin.vout);
        });

        tx.vout.forEach(function(txout) {
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
            txout.scriptPubKey.addresses.forEach(function(adr) {
              if (mapAdr[adr] == null) mapAdr[adr] = [];

              mapAdr[adr].push("to" + tx.txid + "_" + txout.n);
            });
          }
        });
      }); //loop
      callback(null, blk, mpTx, arrvinkeys, mapvout, mapAdr);
    };

    client.batch(batchCallDecode, handleDecoded);
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
      blockheights = [];
    for (var i = startbh; i < startbh + maxbh; i++) {
      mpBH["bh" + i] = genBH(i);
      blockheights.push(i);
    }

    let batchCallGetBlockHash = () => {
      blockheights.forEach(function(h) {
        client.getBlockHash(h);
      });
    };

    client.batch(batchCallGetBlockHash, function(err, blocks) {
      if (err) {
        console.error(err);
      }

      blocks.forEach(function(block) {
        let hash = block.result;
        mpBH["bh" + r].hs = hash;
        r++;
      });

      callback(null, mpBH);
    });
  };

  var getblocks = function(mpBH, callback) {
    var r = startbh,
      blockhashes = [];
    for (var i = startbh; i < startbh + maxbh; i++) {
      blockhashes.push(mpBH["bh" + i].hs);
    }

    let batchCallGetBlock = () => {
      blockhashes.forEach(function(h) {
        client.getBlock(h, 1);
      });
    };

    client.batch(batchCallGetBlock, function(err, blocks) {
      if (err) {
        console.error(err);
      }

      blocks.forEach(function(blockresult) {
        let block = blockresult.result;
        mpBH["bh" + r].h = block.height;
        mpBH["bh" + r].bt = Number.isInteger(block.time)
          ? block.time
          : moment(block.time, "YYYY-MM-DD HH:mm:ss Z").unix();
        mpBH["bh" + r].f = block.flags == "proof-of-stake" ? "pos" : "pow";
        mpBH["bh" + r].mr = block.modifier;
        mpBH["bh" + r].tx = block.tx;
        r++;
      }); //loop
      callback(null, mpBH);
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

        db.close();
      }
    }
  });
};

//start
(function() {
  repeatBlockupdate();
})();
