var RpcClient = require("bitcoind-rpc");
var config = require("./findstakeconfig");

var configrpc = {
  protocol: "http",
  host: config.config.rpc.host,
  port: config.config.rpc.port,
  user: config.config.rpc.user,
  pass: config.config.rpc.pass,
};

var client = new RpcClient(configrpc);
 /*
client.getBlockCount(function (err, ht) {
  if (err) return console.error(err);

  console.log("BlockCount: " + ht.result);
});

client.getDifficulty(function (err, difficulty) {
  if (err) return console.error(err);

  let d = parseFloat(difficulty.result["proof-of-stake"]);
  console.log("difficulty: " + d);
});

///////////////getRawTransaction////////////////
let txids = [
  "972d192ee6ef1e70f11d68e98cd081c39d896d929624ccde385a63d1b6d7c3dd",
  "d93d3e9437565fb828c345a74361e2b572f057c22f3f95a61d9d112a9f47f61e",
];

let batchCallgetrawtransaction = () => {
  txids.forEach(function (txid) {
    client.getRawTransaction(txid);
  });
};

client.batch(batchCallgetrawtransaction, function (err, rawtxs) {
  if (err) {
    console.error(err);
  }

  rawtxs.forEach(function (rawtx) {
    console.log("hex: " + rawtx.result);
  });
});
*/
///////////////decodeRawTransaction////////////////
/*
let rawhex = [
  "01000000d28b8a5f0001010000000000000000000000000000000000000000000000000000000000000000ffffffff06033107080101ffffffff020000000000000000000000000000000000266a24aa21a9ed8ca171ca16f28611dc4326891e3e11689e64b2aa6e1c8499fc7278a3fdea06350120000000000000000000000000000000000000000000000000000000000000000000000000",
  "010000001d8c8a5f0001010000000000000000000000000000000000000000000000000000000000000000ffffffff06033207080101ffffffff020000000000000000000000000000000000266a24aa21a9edb546ff886c8fc6005cd9a111ea1f6b8b87c168c104e0e8b75eb17bdc64a1697b0120000000000000000000000000000000000000000000000000000000000000000000000000",
];

let batchCallDecode = () => {
  rawhex.forEach(function (raw) {
    client.decodeRawTransaction(raw);
  });
};

client.batch(batchCallDecode, function (err, decoded) {
	if (err) {
	  console.error(err);
	}
  
	decoded.map(function (tx) {
	  console.log("decodeRawTransaction", tx.result);
	});
  });
*/
   
///////////////getBlockHash////////////////
  let blockheights = [324532,324533];
  
  let batchCallGetBlockHash = () => {
	blockheights.forEach(function (h) {
	  client.getBlockHash(h);
	});
  };
  client.batch(batchCallGetBlockHash, function (err, blocks) {
	if (err) {
	  console.error(err);
	}
  
	blocks.map(function (block) {
	  console.log("getBlockHash", block.result);
	});
  });
 /*
   ///////////////getBlock////////////////
   let blockhashes = ["e45785cdaefdaab8db5a7e3a7d23c93d7164fbd791c6a60f67851404c97d55e2","d95adfb39993241becf1d70b0022801dd7564c6c5d155f4e97b3bc4aa013cee9"];
  
   let batchCallGetBlock = () => {
	blockhashes.forEach(function (h) {
	   client.getBlock(h, 1);
	 });
   };
   client.batch(batchCallGetBlock, function (err, blocks) {
	 if (err) {
	   console.error(err);
	 }
   
	 blocks.map(function (block) {
	   console.log("getBlock", block.result);
	 });
   });
*/