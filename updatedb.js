

var bitcoin = require('bitcoin');
var config = require('./config');
var level = require('level');
var async = require('async');
var moment = require('moment');

// 1) Create our database, supply location and options.
//    This will create or open the underlying LevelDB store.
var db = level('./ppcdb', {
		'valueEncoding' : 'json'
	});
//other globals:  
var metaData = null, MarginDistance = 4000, Coin = 1000000, BlockHeaderSize = 80, 
metaKey='MetaDataPpcFindstakeDb', blksteps=90,
stakeModifierData = {
	min : 0,
	max : 0,
	step : 5000,
	last : 0,
	current : 0,
	mapblocks : {}
};

var client = new bitcoin.Client({
		host : config.config.rpc.host,
		port : config.config.rpc.port,
		user : config.config.rpc.user,
		pass : config.config.rpc.pass
	});

var getSizeVarInt= function (n){  
  if (n<253)
    return 1;
  else if (n <= 65535)
    return 3;
  else if (n <= 4294967295)
    return 5;
  else
    return 9;
}  
  
var updateMeta = function (callback) {
	db.put(metaKey, metaData, function (err) {
		if (err)
			return callback(err);

		callback(null, metaData);
	});
}

var updateAddresses = function (mapAdr, cbWhenDone) {

	var arrAddress = [],
	ops = [];
	for (var address in mapAdr) {
		if (mapAdr.hasOwnProperty(address)) {
      arrAddress.push({
        k : address,
        v : mapAdr[address]
      });     
    }
	}
	async.each(arrAddress, function (objkv, callback) {

		var adrkey = objkv.k,
		newadrarr = objkv.v,
    newval = [];
    
		//console.log('update mapAdr k ' + adrkey + ' v:' + newadrarr);

		db.get(adrkey, function (err, val) {
			if (err) { // likely the key was not found
        newval =newadrarr;
			} else {
				var mapT = {}
				newadrarr.forEach(function (txo, index, array) {
					mapT[txo] = 42;
				});

				val.forEach(function (txo, index, array) {
					mapT[txo] = 42;
				});

				for (var proptxo in mapT) {
					if (mapT.hasOwnProperty(proptxo)) {
						newval.push(proptxo);
					}
				}
			}
      ops.push({
        type : 'put',
        key : adrkey,
        value : newval
      })
			callback();
		})
	}, function (err) {
		// if any of the file processing produced an error, err would equal that error
		if (err) {
			// One of the iterations produced an error.
			// All processing will now stop.
			console.log('failed to process');
		} else {
			//batch ops:
			db.batch(ops, function (err) {
				if (err)
					return cbWhenDone(err);

				//console.log('Adr processed successfully');
				cbWhenDone(null, mapAdr);
			})
		}
	});
}

var getLatestMeta = function (cbWhenDone) {
	//get starting point, by default it will choose May 2014 as that was an mandatory version upgrade (0.3) ~blockheight 110000
	async.waterfall([
			function (callback) {
				db.get(metaKey, function (err, value) {
					if (err)
						metaData = {
							MaxBH : 110000,              //last synce block
							MaxTx : 110000,              //last synced tx in block
							MaxBStakemodifier : 110000,  //last calculated stakemodifier
							Diff : 0,                    //last diff from rpc
							CurBH : 110000               //last blockcount from rpc
						};
					else
						metaData = value;

					callback();
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
			updateMeta],
		function (err, result) {
		if (err) {
			console.error(err);
		}
    else {
      console.log(metaData);
      console.log('sync from '+metaData.MaxBH);

      cbWhenDone(null, metaData);
    }
	})
}


var updateTxsOfBlock = function (blk, cbWhenDone) {
	var mpTx = {}, sizeVarintTx =  getSizeVarInt(blk.tx.length),
	genTx = function (i, bh) {
		return {
			pos : i,    //position in block
			t : -1,     //timestamp
			bh : bh,    //in blocknr
			sz : -1,    //size
			offst : -1  //offset
		}
	},
	isEven = function (n) {
		return n == parseFloat(n)? !(n%2) : void 0;
	};
    
	async.waterfall([
			function (callback) {

				var r = 0,
				batch = [],
				arrtxraw = [];
				blk.tx.forEach(function (hash, index, array) {
					mpTx['tx' + hash] = genTx(index, blk.h);
					batch.push({
						method : 'getrawtransaction',
						params : [hash]
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
			},
			function (blk, mpTx, arrtxraw, callback) {
       // console.log('start decoderawtransactions:'+JSON.stringify(blk.h));
        
				var r = 0,
				batch = [],
				arrvinkeys = [],
				mapvout = {},
				mapAdr = {};
				arrtxraw.forEach(function (raw, index, array) {
					batch.push({
						method : 'decoderawtransaction',
						params : [raw]
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
            if ((txout.value * Coin)>0){  
              mapvout['to' + tx.txid + '_' + txout.n] = {
                v : Math.floor(txout.value * Coin)
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
			},
			function (blk, mpTx, arrvinkeys, mapvout, mapAdr, callback) {

				var ops = [];
        //store data about tx
				for (var property in mpTx) {
					if (mpTx.hasOwnProperty(property)) {
            var newval=mpTx[property];
            delete newval['sz']; //not needed anymore
            delete newval['pos']; //not needed anymore
						ops.push({
							type : 'put',
							key : property,
							value : newval
						});
					}
				}
        //store data about txouts
				for (var property in mapvout) {
					if (mapvout.hasOwnProperty(property)) {
						ops.push({
							type : 'put',
							key : property,
							value : mapvout[property]
						});
					}
				}
        //delete spent outs
				arrvinkeys.forEach(function (prevout, index, array) {
					ops.push({
						type : 'del',
						key : prevout
					});
				});
				 
				console.log('update tx to ' + blk.h);
				db.batch(ops, function (err) {
					if (err)
						return callback(err);

					metaData.MaxTx = blk.h;
					updateMeta(function () {
            //store mapping address to unspents 
						callback(null, mapAdr);
					})
				})
			},
			updateAddresses
		], function (err, result) {
		if (err)
			return console.error(err);

		cbWhenDone(null, 1);
	})
}



var updateBlocks = function (_metadata, cbWhenDone) {
  //redo last block, coz why not...
	var startbh = metaData.MaxBH-1,
	mpBH = {},
	maxbh = (Math.abs(metaData.CurBH-metaData.MaxBH)>blksteps+1) ? blksteps + 1 : Math.abs(metaData.CurBH-metaData.MaxBH)-2,
	genBH = function (i) {
		return {
			h : i, //height
			f : '', //flag
			hs : '', //hash
			bt : -1, //time
			mr : '', //modifier
			smr : '', //stakemodifier
			tx : []//transactions
		}
	};

	if (maxbh<2 || ((startbh + 8) > (10 * (metaData.CurBH / 10))))
		return  cbWhenDone(null, metaData);

	async.waterfall([
			function (callback) {
				var r = startbh,
				batch = [];
				for (var i = startbh; i < startbh + maxbh; i++) {
					mpBH['bh' + i] = genBH(i);
					batch.push({
						method : 'getblockhash',
						params : [i]
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
			},
			function (mpBH, callback) {
				var r = startbh,
				batch = [];
				for (var i = startbh; i < startbh + maxbh; i++) {
					batch.push({
						method : 'getblock',
						params : [mpBH['bh' + i].hs, false]
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
			},
			function (mpBH, callback) {

				var max = 0,
				ops = [];
				for (var property in mpBH) {
					if (mpBH.hasOwnProperty(property)) {
						if (mpBH[property].h > max) {
							max = mpBH[property].h;
						}

						ops.push({
							type : 'put',
							key : property,
							value : mpBH[property]
						});
					}
				}
				console.log('update blocks in batch to' + max);
				db.batch(ops, function (err) {
					if (err)
						return callback(err);

          callback(null, mpBH);          
				})
			},
      function(mpBH, callback){
        
        var arrBlk = [],
        max = 0;
        for (var bkkey in mpBH) {
          if (mpBH.hasOwnProperty(bkkey)) {
            if (mpBH[bkkey].h > max) {
                max = mpBH[bkkey].h;
            }
            console.log('tx in h '+mpBH[bkkey].h);
            arrBlk.push(mpBH[bkkey]);
          }          
        }                      
                      
        async.each(arrBlk, updateTxsOfBlock, function(err){
            // if any of the blk processing produced an error, err would equal that error
            if( err ) {
              // One of the iterations produced an error.
              // All processing will now stop.
              console.log('A blk failed to process');
              console.log(err);
            } else {
              console.log('All blocks have been processed successfully. Updating metadata.');
               
              metaData.MaxBH = max;        
              
              updateMeta(function () {
                callback(null, mpBH);
              })
            }
        });

      }
		], function (err, result) {
       
		if (err)
			return console.error(err);
    else
      cbWhenDone(null, result);
	})
};

var putBlocksInMemory=function(callback){
  
    //cleanup
    for (var i = stakeModifierData.min; i < stakeModifierData.current; i++){
      if (stakeModifierData.mapblocks['bh' +  i] != null) delete stakeModifierData.mapblocks['bh' +  i];
      stakeModifierData.min = i;      
    }  
    
    if (stakeModifierData.current+MarginDistance <  stakeModifierData.max){
      callback(null, metaData);
      return;
    }
        
    var start='bh' + stakeModifierData.last;
    stakeModifierData.max += stakeModifierData.step;        
    var end='bh' + stakeModifierData.max;
        
    stakeModifierData.last = stakeModifierData.max;
    db.createReadStream({
        gte : start          // jump to first key with the prefix
      , lte   : end // stop at the last key with the prefix
    })
    .on('data', function (data) {
        stakeModifierData.mapblocks[data.key] = {f:data.value.f, h:data.value.h, bt: data.value.bt, mr: data.value.mr};
    })
    .on('error', callback)
    .on('close', function () {
            console.log('retrieved blks from '+start+' to '+end);
      callback(null, stakeModifierData)
    })  
}


 // find first block that:
 //  - is a pos block
 //  - has a blocktime 761920 seconds later than current blocktime 
 //  - modifiers changes per (time?) interval; a change in modifier has to happen too
 var getBlockStakeModifier = function(blk) {
   
    var min = blk.h;
    var max = min+MarginDistance;
    var mapdataobj=stakeModifierData.mapblocks;  
    
    if (min>max)
    {
      console.log('getBlockStakeModifier min>max !!! ' + min + ' max ' + max)
      return;
    }
    var guess = blk.h+1400;
    var item = blk.bt+761920;

    while (min <= max) {
        guess = ((min + max) >> 1);        //guess = Math.floor((min + max) / 2);
        var btguess = mapdataobj['bh' + guess].bt; 
 
        if (btguess < item) {
            min = guess + 1;
        }
        else if (btguess > item){
            max = guess - 1;
        } 
        else{
            guess++;
            min=max+1;         
        }
    }
    //first pos block; are blocktimes in seq order btw? who gets to decide when it happened?
    var retSMR='', refSMR='', prevSMR='', foundpos=false;
    for (var i = guess-15; i < blk.h+MarginDistance; i++) {        
      if ((mapdataobj['bh' + i].bt > item) && mapdataobj['bh' + i].f=='pos') {
        
         if (!foundpos){
           foundpos=true;
           refSMR = mapdataobj['bh' + i].mr;               
         }       
         
         if (foundpos){
           //now stakemodifier has to change once too
           retSMR = mapdataobj['bh' + i].mr;
           if (retSMR!='' && ((prevSMR!='' && retSMR!=prevSMR) || retSMR!=refSMR))
           {
             console.log('bh'+blk.h+' smr:'+retSMR+ ' of bh'+i+' delta:'+(i-blk.h));
             break;
           }
         }                   
      }   
      prevSMR=mapdataobj['bh' + i].mr;      
    }
    
    return retSMR;
}
var repeatUpdateStakeModifier = function () {
  
	async.waterfall([
   
    putBlocksInMemory,
    function (_meta, callback) {
      db.get('bh'+metaData.MaxBStakemodifier, callback);
    },
    function (block, callback) {
        //if (err) return callback('block not found in db: '+ metaData.MaxBStakemodifier) // likely the key was not found

      //var smr = getBlockStakeModifier(block);
      block.smr = '';//smr;
         
      db.put('bh'+block.h, block, callback);          
    },
    function (callback) {        
      metaData.MaxBStakemodifier++;        
        
      updateMeta(function () {
        stakeModifierData.current=metaData.MaxBStakemodifier;
        callback(null, metaData);
      })        
    }        
  ], 
  function (err, result) {
    if (err) {
      console.log('repeatUpdateStakeModifier error!');  
      console.error(err);
			if (db.isOpen())
				db.close();
    } else {
      
  
      if (metaData.MaxBStakemodifier+MarginDistance < metaData.MaxBH){
     
        process.nextTick(repeatUpdateStakeModifier);
      }else{
        console.log('~~~~~~~~~~Finished!~~~~~~~~~');   
        if (db.isOpen())
				  db.close();
      }
    }
  });	  
}

var doUpdateStakeModifiers = function () {
 
	stakeModifierData.max = stakeModifierData.current = stakeModifierData.min = stakeModifierData.last = metaData.MaxBStakemodifier;

	if (metaData.MaxBStakemodifier + MarginDistance > metaData.MaxBH)
		return; 
 
  repeatUpdateStakeModifier();
}
    
var repeatBlockupdate = function () {

	async.waterfall([
			getLatestMeta,
			updateBlocks
		], function (err, result) {
		if (err) {
			console.error(err);
			if (db.isOpen())
				db.close();
		} else {
			      
      if ((metaData.MaxBH + 8) < (10 * (metaData.CurBH / 10))){        
         process.nextTick(repeatBlockupdate);
      }else{
        //start update stakemodifiers
 		console.log('skipping calc stake modifiers !!!!!');   
        //  doUpdateStakeModifiers();         

        console.log('~~~~~~~~~~Finished!~~~~~~~~~');   
        if (db.isOpen())  db.close();

      }     
		}
	});
};





//start 
function main(){
  repeatBlockupdate();
};
main();


