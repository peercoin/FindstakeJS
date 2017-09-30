var bitcoin = require('bitcoin');
var config = require('./config');

var async = require('async');
var moment = require('moment');
var nano = require('nano')(config.config.db.url);
var db = nano.use(config.config.db.name);
var dbName = config.config.db.name;

//other globals:  
var metaData = null,
    MarginDistance = 4000,
    Coin = 1000000,
    BlockHeaderSize = 80,
    metaKey = config.config.db.dbmetakey,
    blksteps = 32,
    stakeModifierData = {
        min: 0,
        max: 0,
        step: 5000,
        last: 0,
        current: 0,
        mapblocks: {}
    };

var client = new bitcoin.Client({
    host: config.config.rpc.host,
    port: config.config.rpc.port,
    user: config.config.rpc.user,
    pass: config.config.rpc.pass
});

var getSizeVarInt = function (n) {
    if (n < 253)
        return 1;
    else if (n <= 65535)
        return 3;
    else if (n <= 4294967295)
        return 5;
    else
        return 9;
}



function insert_doc(mydoc, tried, cb) {

    db.insert(mydoc, mydoc['_id'], function (err, http_body, http_header) {

        if (err) {
            if (err.error === 'conflict' && tried < 5) {
                // get record _rev and retry
                return db.get(mydoc.doc_key, function (err, doc) {
                    mydoc['_rev'] = doc._rev;
                    insert_doc(mydoc, tried + 1, cb);
                });

            }
            cb(err);
        }
        else {
            cb(null);
        }
    });
}

function upsertDoc(mydoc, retried, cb) {
    db.get(mydoc['_id'], { revs_info: true }, function (err, body) {
        if (!err) {
            mydoc['_rev'] = body._rev;
            return insert_doc(mydoc, retried, cb);

        } else {
            return insert_doc(mydoc, retried, cb);
        }
    });
}


function deleteDoc(key, retried, cb) {
    db.get(key, { revs_info: true }, function (err, body) {
        if (!err) {
            //console.log(body)
            var rev = body['_rev'];
            db.destroy(key, rev, function (err, body) {
                if (!err) {
                    cb(null);
                }
                else if (retried < 5) {
                    deleteDoc(key, retried + 1, cb);
                } else
                    cb(err);
            });
        } else
            cb(null);
    });
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

var updateMetaDb = function (callback) {
    //console.log('updateMeta');
    metaData['_id'] = metaKey;

    upsertDoc(metaData, 0, function (err) {
        if (err)
            console.log(err);
        callback();
    });
};


var updateMeta = function (callback) {
    //console.log('updateMeta');
    callback();
};



var updateAddresses = function (mapAdr, cbWhenDone) {
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
    async.eachSeries(arrAddress, function (objkv, callback) {

        var adrkey = objkv.k,
            newadrarr = objkv.v,
            newval = [],
            _rev = '';

        getDoc(adrkey, function (err, body) {
            if (!err) {

                // console.log(body);

                var val = body.txos;
                var mapT = {}
                newadrarr.forEach(function (txo) {
                    mapT[txo] = 42;
                });

                val.forEach(function (txo) {
                    mapT[txo] = 42;
                });

                for (var proptxo in mapT) {
                    if (mapT.hasOwnProperty(proptxo)) {
                        newval.push(proptxo);
                    }
                }

                upsertDoc({
                    _id: adrkey,
                    txos: newval
                }, 0, function (err) {
                    if (err) console.log(err);
                    callback();
                });

            }
            else {
                upsertDoc({
                    _id: adrkey,
                    txos: newadrarr
                }, 0, function (err) {
                    if (err) console.log(err);
                    callback();
                });
            }
        });

    }, function (err) {
        //console.log('Adr processed successfully');
        cbWhenDone(null, mapAdr);
    });
}


var getLatestMeta = function (cbWhenDone) {
    //get starting point, by default it will choose May 2014 as that was an mandatory version upgrade (0.3) ~blockheight 110000
    async.waterfall([
        function (callback) {

            getDoc(metaKey, function (err, body) {
                if (!err) {
                    metaData = body;
                    callback();
                }
                else {
                    metaData = {
                        MaxBH: 110000, //last synce block
                        MaxTx: 110000, //last synced tx in block
                        MaxBStakemodifier: 110000, //last calculated stakemodifier
                        Diff: 0, //last diff from rpc
                        CurBH: 110000 //last blockcount from rpc
                    };
                    callback();
                }
            });

        },
        function (callback) {
            client.getDifficulty(function (err, difficulty) {

                if (err)
                    return callback(err);

                metaData.Diff = parseFloat(difficulty['proof-of-stake']);
                callback();
            });
        },
        function (callback) {
            client.getBlockCount(function (err, ht) {
                if (err)
                    return callback(err);
                metaData.CurBH = (ht);
                callback();
            });
        },
        updateMeta
    ],
        function (err, result) {
            if (err) {
                console.error(err);
            } else {
                //console.log(metaData);
                console.log('sync from ' + metaData.MaxBH);

                cbWhenDone(null, metaData);
            }
        })
}


var updateTxsOfBlock = function (blk, cbWhenDone) {
    var mpTx = {},
        sizeVarintTx = getSizeVarInt(blk.tx.length),
        genTx = function (i, bh) {
            return {
                pos: i, //position in block
                t: -1, //timestamp
                bh: bh, //in blocknr
                sz: -1, //size
                offst: -1 //offset
            }
        },
        isEven = function (n) {
            return n == parseFloat(n) ? !(n % 2) : void 0;
        };


    var getrawtransactions = function (callback) {

        var r = 0,
            batch = [],
            arrtxraw = [];
        blk.tx.forEach(function (hash, index, array) {
            mpTx['tx' + hash] = genTx(index, blk.h);
            batch.push({
                method: 'getrawtransaction',
                params: [hash]
            });
        });

        client.cmd(batch, function (err, txraw, resHeaders) {
            if (err)
                return callback(err);

            if (!isEven(txraw.length)) {
                return callback('length rawtx not even');
            }
            mpTx['tx' + blk.tx[r]].sz = txraw.length / 2; //1 byte is 2 char
            arrtxraw.push(txraw);
            r++;

            if (r == batch.length) {

                var offset = BlockHeaderSize + sizeVarintTx;
                blk.tx.forEach(function (hash, index, array) {
                    mpTx['tx' + hash].offst = offset;
                    offset += mpTx['tx' + hash].sz;
                });

                callback(null, blk, mpTx, arrtxraw);
            }
        })
    };

    var decoderawtransactions = function (blk, mpTx, arrtxraw, callback) {

        var r = 0,
            batch = [],
            arrvinkeys = [],
            mapvout = {},
            mapAdr = {};

        arrtxraw.forEach(function (raw, index, array) {
            batch.push({
                method: 'decoderawtransaction',
                params: [raw]
            });
        });

        client.cmd(batch, function (err, tx, resHeaders) {

            if (err)
                return callback(err);

            mpTx['tx' + tx.txid].t = tx.time

            tx.vin.forEach(function (txin, index, array) {
                if (txin.txid)
                    arrvinkeys.push('to' + txin.txid + '_' + txin.vout);
            });

            tx.vout.forEach(function (txout, index, array) {
                if ((txout.value * Coin) > 0) {
                    mapvout['to' + tx.txid + '_' + txout.n] = {
                        v: Math.floor(txout.value * Coin)
                    };
                }
                if (txout.scriptPubKey && txout.scriptPubKey.addresses && Array.isArray(txout.scriptPubKey.addresses)) {
                    txout.scriptPubKey.addresses.forEach(function (adr, index, array) {
                        if (mapAdr[adr] == null)
                            mapAdr[adr] = [];

                        mapAdr[adr].push('to' + tx.txid + '_' + txout.n);
                    })
                }
            });

            r++;

            if (r == batch.length) {
                callback(null, blk, mpTx, arrvinkeys, mapvout, mapAdr);
            }
        })
    };

    var updatetxs = function (blk, mpTx, arrvinkeys, mapvout, mapAdr, callback) {

        var ops = [];
        //store data about tx
        for (var property in mpTx) {
            if (mpTx.hasOwnProperty(property)) {
                var newval = mpTx[property];
                delete newval['sz']; //not needed anymore
                delete newval['pos']; //not needed anymore
                ops.push({
                    type: 'put',
                    key: property,
                    value: newval
                });
            }
        }
        //store data about txouts
        for (var property in mapvout) {
            if (mapvout.hasOwnProperty(property)) {
                ops.push({
                    type: 'put',
                    key: property,
                    value: mapvout[property]
                });
            }
        }
        //delete spent outs
        arrvinkeys.forEach(function (prevout, index, array) {
            ops.push({
                type: 'del',
                key: prevout
            });
        });

        //console.log('update tx to ' + blk.h);
        var bacthops = [];
        ops.forEach(function (params) {
            var p = params;

            if (p.type === 'del') {

                var k = p.key;
                bacthops.push(function (cbk) {
                    deleteDoc(k, 0, function (error) {
                        cbk(error);
                    });
                });
            } else if (p.type === 'put' && (p.key.substring(0, 2) === 'to' || p.key.substring(0, 2) === 'tx')) {

                p.value['_id'] = p.key;
                var d = p.value;
                bacthops.push(function (cbk) {
                    upsertDoc(d, 0, function (err) {
                        if (err)
                            console.log(err);
                        cbk();
                    });
                });
            }
        });

        async.parallel(bacthops, function (err, result) {

            metaData.MaxTx = blk.h;
            updateMeta(function () {
                //store mapping address to unspents 
                callback(null, mapAdr);
            });
        });

    };

    async.waterfall([getrawtransactions, decoderawtransactions, updatetxs, updateAddresses], function (err, result) {
        if (err)
            return console.error(err);

        cbWhenDone(null, 1);
    })
}



var updateBlocks = function (_metadata, cbWhenDone) {

    var startbh = metaData.MaxBH;
    var mpBH = {};
    var maxbh = (Math.abs(metaData.CurBH - metaData.MaxBH) > blksteps + 1) ? blksteps + 1 : Math.abs(metaData.CurBH - metaData.MaxBH) - 2;
    var genBH = function (i) {
        return {
            h: i, //height
            f: '', //flag
            hs: '', //hash
            bt: -1, //time
            mr: '', //modifier
            smr: '', //stakemodifier
            tx: [] //transactions
        }
    };

    if (maxbh < 2 || ((startbh + 8) > (10 * (metaData.CurBH / 10)))) {
        return cbWhenDone(null, metaData);
    }

    var getblockhashes = function (callback) {
        var r = startbh,
            batch = [];
        for (var i = startbh; i < startbh + maxbh; i++) {
            mpBH['bh' + i] = genBH(i);
            batch.push({
                method: 'getblockhash',
                params: [i]
            });
        }

        client.cmd(batch, function (err, hash, resHeaders) {
            if (err)
                return callback(err);
            mpBH['bh' + r].hs = hash;
            r++;

            if (r == i) {
                callback(null, mpBH)
            }
        });
    };


    var getblocks = function (mpBH, callback) {
        var r = startbh,
            batch = [];
        for (var i = startbh; i < startbh + maxbh; i++) {
            batch.push({
                method: 'getblock',
                params: [mpBH['bh' + i].hs, false]
            });
        }

        client.cmd(batch, function (err, block, resHeaders) {
            if (err)
                return callback(err);
            mpBH['bh' + r].h = block.height;
            mpBH['bh' + r].bt = moment(block.time, "YYYY-MM-DD HH:mm:ss Z").unix();
            mpBH['bh' + r].f = block.flags == "proof-of-stake" ? 'pos' : 'pow';
            mpBH['bh' + r].mr = block.modifier;
            mpBH['bh' + r].tx = block.tx;
            r++;

            if (r == i) {
                callback(null, mpBH);
            }
        })
    };

    var prepblocks = function (mpBH, callback) {

        var max = 0,
            ops = [];
        for (var property in mpBH) {
            if (mpBH.hasOwnProperty(property)) {
                if (mpBH[property].h > max) {
                    max = mpBH[property].h;
                }

                ops.push({
                    type: 'put',
                    key: property,
                    value: mpBH[property]
                });
            }
        }
        //   console.log('update blocks in batch to' + max);

        var bacthops = [];
        ops.forEach(function (params) {
            var p = params;
            p.value['_id'] = p.key;
            var d = p.value;
            bacthops.push(function (cbk) {
                upsertDoc(d, 0, function (err) {
                    if (err)
                        console.log(err);
                    cbk();
                });
            });
        });

        async.parallel(bacthops, function (err, result) {
            callback(null, mpBH);
        });
    };

    var processblock = function (mpBH, callback) {

        var arrBlk = [],
            max = 0;
        for (var bkkey in mpBH) {
            if (mpBH.hasOwnProperty(bkkey)) {
                if (mpBH[bkkey].h > max) {
                    max = mpBH[bkkey].h;
                }
                console.log('processing block ' + mpBH[bkkey].h);
                arrBlk.push(mpBH[bkkey]);
            }
        }

        var batchops = [];
        arrBlk.forEach(function (blk) {
            batchops.push(function (cb) {
                updateTxsOfBlock(blk, function () {
                    cb();
                });
            });
        });
        async.waterfall(batchops, function (err, result) {
            if (err) {
                // One of the iterations produced an error.
                // All processing will now stop.
                console.log('A blk failed to process');
                console.log(err);
            } else {
                console.log('All blocks have been processed successfully. Updating metadata.');

                metaData.MaxBH = max;

                updateMetaDb(function () {
                    callback(null, mpBH);
                });
            }
        });
    };

    async.waterfall([getblockhashes, getblocks, prepblocks, processblock], function (err, result) {
        if (err)
            return console.error(err);
        else
            cbWhenDone(null, result);
    })
};


var repeatBlockupdate = function () {

    async.waterfall([getLatestMeta, updateBlocks], function (err, result) {
        if (err) {
            console.error(err);
        } else {

            if ((metaData.MaxBH + 8) < (10 * (metaData.CurBH / 10))) {
                process.nextTick(repeatBlockupdate);
            } else {

                console.log('~~~~~~~~~~Finished!~~~~~~~~~');

            }
        }
    });
};





//start 
(function () {
    repeatBlockupdate();
})();
 
