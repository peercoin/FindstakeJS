
var bitcoin = require('bitcoin');
var config = require('./config');

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
  
  

/*var level = require('level')

// 1) Create our database, supply location and options.
//    This will create or open the underlying LevelDB store.
var db = level('./ppcdb',{'valueEncoding':'json'})

var ops = [
    { type: 'del', key: 'Test1' }
  , { type: 'de', key: 'Test3'}
  , { type: 'put', key: 'Test2', value: [11,22,33] }
]

db.batch(ops, function (err) {
  if (err) return console.log('Ooo222222ps!', err)
  console.log('Great success dear leader!')

  // 3) fetch by key
  db.get('Test2', function (err, value) {
    if (err) return console.log('Oo344334ops!', err) // likely the key was not found

    // ta da!
    console.log(value)
  })
})


// 2) put a key & value
db.put('MetaData', {MaxBH:1, MaxBStakemodifier:1, Diff:0}, function (err) {
  if (err) return console.log('Ooops!', err) // some kind of I/O error

  // 3) fetch by key
  db.get('MetaData', function (err, value) {
    if (err) return console.log('Ooops!', err) // likely the key was not found

    // ta da!
    console.log(value)
  })
})*/