var level = require('level')
var async = require('async');

var Settings = require('../config');
module.exports = (function() {

    var couch = null,
        StakeMinAge = 2592000,
        getDb = function() {
            if (couch != null) {
                return couch;
            }
            couch = level('./ppcdb', {
                'valueEncoding': 'json'
            });

            return couch;
        },
        closeDb = function() {
            if (couch != null && couch.isOpen()) {
                couch.close();
                couch = null;
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

    function mpoutIsEqual(mp1, mp2) { //{BlockFromTime:0, StakeModifier16:'', PrevTxOffset:0, PrevTxTime:0, PrevTxOutValue:0, PrevTxOutIndex:0};
        return mp1.BlockFromTime === mp2.BlockFromTime && mp1.StakeModifier16 === mp2.StakeModifier16 && mp1.PrevTxOffset === mp2.PrevTxOffset && mp1.PrevTxTime === mp2.PrevTxTime && mp1.PrevTxOutIndex === mp2.PrevTxOutIndex && mp1.PrevTxOutValue === mp2.PrevTxOutValue;
    }
    //;    



    var getUnspents = function(address, cbWhenDone) {
        var mpouts = {},
            returnval = [];

        async.waterfall([
                function(callback) {
                    getDb().get(address, callback);

                },
                function(arrtxo, callback) {
                    arrtxo.forEach(function(txo, index, array) {
                        mpouts[txo] = {
                            BlockFromTime: 0,
                            StakeModifier16: '',
                            PrevTxOffset: 0,
                            PrevTxTime: 0,
                            PrevTxOutValue: 0,
                            PrevTxOutIndex: 0
                        };
                    });

                    getTx(mpouts, callback);
                },
                getValues
            ],
            function(err, result) {
                closeDb();
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

    var getTx = function(mpouts, cbWhenDone) {

        var arrTxo = [];
        for (var property in mpouts) {
            if (mpouts.hasOwnProperty(property)) {
                arrTxo.push(property);
            }
        }

        async.eachSeries(arrTxo, function(txo, callback) {
            var tx = 'tx' + txo.slice(2, 66);
            mpouts[txo].PrevTxOutIndex = parseInt(txo.slice(67), 10);

            getDb().get(tx, function(err, val) {
                if (err) { // likely the key was not found
                    delete mpouts[txo];
                } else if ((val.t + StakeMinAge) > (Math.floor((new Date).getTime() / 1000))) {
                    delete mpouts[txo];
                } else {
                    mpouts[txo].PrevTxOffset = val.offst;
                    mpouts[txo].PrevTxTime = val.t;
                    //console.log('bh'+val.bh)
                    getDb().get('bh' + val.bh, function(errb, value) {
                        if (errb) {
                            delete mpouts[txo]; // likely the key was not found
                        } else {
                            //console.log(value)
                            if (!!mpouts[txo]) {
                                mpouts[txo].BlockFromTime = value.bt;
                                mpouts[txo].StakeModifier16 = value.smr;
                            }

                        }
                    })
                }
                callback();
            })
        }, function(err) {
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


    var getValues = function(mpouts, cbWhenDone) {

        var arrTxo = [];
        for (var property in mpouts) {
            if (mpouts.hasOwnProperty(property)) {
                arrTxo.push(property);
            }
        }

        async.eachSeries(arrTxo, function(txo, callback) {

            getDb().get(txo, function(err, val) {
                if (err) { // likely the key was not found
                    delete mpouts[txo];
                } else {
                    mpouts[txo].PrevTxOutValue = val.v;
                }

                callback();
            })
        }, function(err) {
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


    var getStakeModifiers = function(blockhlast, callback) {

        var resultArr = [],
            lastMr = '';
        var start = 'bh' + (blockhlast - (6 * 24 * 30));
        var end = 'bh' + blockhlast;


        getDb().createReadStream({
                gte: start // jump to first key with the prefix
                    ,
                lte: end // stop at the last key with the prefix
            })
            .on('data', function(data) {
                if (((Math.floor((new Date).getTime() / 1000)) - data.value.bt) < (3600 * 24 * 23)) {

                    if (lastMr != data.value.mr) {
                        lastMr = data.value.mr;

                        if (lastMr != '') resultArr.push([data.value.bt, data.value.mr]);
                    }

                }
            })
            .on('error', callback)
            .on('close', function() {

                var mpouts = {}; //[txo]
                mpouts['bmrs'] = resultArr;
                callback(mpouts);
            })
    }


    var getStatus = function(callback) {
        var returnval = {};
        getDb().get(Settings.config.db.dbmetakey, function(err, val) {
            if (err) { // likely the key was not found
                console.log('no metakey found?')
                callback(err, returnval);
            } else {

                getDb().get('bh' + val.MaxBH, function(err, blk) {
                    if (err) { // likely the key was not found
                        console.log('no block found?')
                        callback(err, returnval);
                    } else {

                        returnval['difficulty'] = val.Diff;
                        returnval['lastupdatedblock'] = blk.h;
                        returnval['lastupdatedblocktime'] = blk.bt;

                        getStakeModifiers(blk.h, function(mpouts) {

                            returnval['blockModifiers'] = mpouts['bmrs'];
                            closeDb();

                            callback(err, returnval);
                        });

                    }
                })
            }
        })
    }



    ////////////// public/////////////////
    return {
        getUnspents: getUnspents,
        getStatus: getStatus
    };

})();
