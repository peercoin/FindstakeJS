// Mirrors are highly appreciated!
// If you wish to help out, either set up a static hosting website or create a jsonp api with the nodejs backend. Tx never change. They might be spent somewhere later, but that is in another tx.
// this script is to create all json files from leveldb to upload somewhere


var level = require('level')
var async = require('async');
// 1) Create our database, supply location and options.
//    This will create or open the underlying LevelDB store.
var db = level('./ppcdb',{'valueEncoding':'json'})
var fs = require('fs');
//var path = require('path');
var StakeMinAge=2592000;

var writeTxo=function (txo, dataval, callback) {
        
         console.log(txo);
  //var txo=data.key, dataval=data.value;
  var mpouts={};//[txo]
  mpouts[txo]={};
  mpouts[txo].PrevTxOutValue = dataval.v;
  var tx = 'tx'+txo.slice(2, 66);
  mpouts[txo].PrevTxOutIndex = parseInt(txo.slice(67),10);

  db.get(tx, function (err, val) {
    if (err) { // likely the key was not found
      delete mpouts[txo];
      callback();
    } 
    else if ((val.t + StakeMinAge) > (Math.floor((new Date).getTime()/1000)) ){
      delete mpouts[txo];
      callback();
    }
    else {
      mpouts[txo].PrevTxOffset = val.offst;
      mpouts[txo].PrevTxTime = val.t;
      //console.log('bh'+val.bh)
      db.get('bh'+val.bh, function (err, value) {
        if (err) 
        {
          delete mpouts[txo];// likely the key was not found
          callback();
        }
        else{
          //console.log(value)
          mpouts[txo].BlockFromTime = value.bt;
          mpouts[txo].StakeModifier16 = value.smr;
          var key =txo;
          var str2write=key+'(' + JSON.stringify(mpouts[txo])  +');';  
 //need to create the folder first manually, for now let it crash...
      
          fs.writeFile('json/'+key+'.json', str2write, function (err,data) {
            if (err) {
              //return console.log(err);
            }
            callback();
            //console.log(data);
          });            
                    
        }           
      })  
    }
    
  })
}



var writeblktofile=function(callback){
    //get all tx outputs   
    var start='to';  
    var end='to~';
         
    db.createReadStream({
        gte : start          // jump to first key with the prefix
      , lte   : end // stop at the last key with the prefix
    })
    .on('data', function (data) {
      // console.log(data);
       if (!fs.existsSync('json/'+data.key+'.json')) writeTxo(data.key, data.value, function(){})
             
        
    })
    .on('error', callback)
    .on('close', function () {
            
      callback();
    })  
}  
  
 writeblktofile(function(err,data){if (err) console.log(err)});