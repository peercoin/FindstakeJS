
var bitcoin = require('bitcoin');
var config = require('./findstakeconfig');

var client = new bitcoin.Client({
		host : config.config.rpc.host,
		port : config.config.rpc.port,
		user : config.config.rpc.user,
		pass : config.config.rpc.pass
	});
  
client.getBlockCount(function (err, ht) {
  if (err)
    return console.log('Ooops!', err);
  
  console.log('BlockCount: '+ht)
}); 
  
  
