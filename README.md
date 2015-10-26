FindstakeJS
=====
### Getting to know in advance when to mint your Peercoins (protocol version v.05 as to be switched on Jan 2016)

FindstakeJS originates from Kac-'s Findstake project, a tool written in Go to predict stakes but ported to JavaScript (and rewritten in TypeScript). 
UI, webserver and database all in one (preferably typed) language.

Most cryptocoin mining requires specialized hardware, but Peercoin minting can be done on any computer. Minting is energy-efficient, because it is based on the Peercoins you hold, rather than on your processing power.

**But Peercoin can even be more energy-efficient! **

With FindstakeJS, there is no need to leave Peerunity on 24-7 anymore. 
Find out in advance and turn on your wallet software just before it counts and help secure the network.

#### Features:

 * Easy to use interface. (But can be improved if you are a twitter bootstrap rockstar) 
 * Can be used without online data services, your Peerunity has already all the data it needs. 
 * A command line option to update its internal database via Peerunityd rpc-json interface.

Dependencies:
------------
 * installed Peerunity/PeercoinQT wallet with sync data
 * a modern browser [also a fast pc would not hurt, the browser is doing all the hard work, not the webserver]
 * nodejs (http://nodejs.org/)
    level 
      level down(LevelDOWN uses node-pre-gyp to support prebuilt binaries. For a list of supported prebuilt platform binaries see https://github.com/Level/leveldown/releases)
    
    
How to install
----------
cd the folder:
``` bash
$ npm install
```

How to (re)compile commonjs modules from the typescript source
----------    
cd lib
tsc --module commonjs BigInteger.ts Base58.ts  
tsc --module commonjs Peercoin.ts  

How to (re)build app.js with browserify
----------    
npm run build-js	
	
	
How to set up
----------
this set up is initially needed to update the database:

make sure to have the following in file ppcoin.conf:
 
listen=1
server=1
txindex=1
rpcssl=0
 
rpcuser=change_this_to_a_long_random_user
rpcpassword=change_this_to_a_long_random_password
rpctimeout=30
rpcport=8332

start peerunityd.exe:

``` bash
$ PATHTO\deamon peerunityd.exe -printtoconsole
```

configure the same rpc username and password in \app\config.js
test:
``` bash
$ node testrpc.js
```


How to use
----------
to update database, start up peerunityd with a configured ppcoin.conf
Optional: unplug internet to unhook peerunity from network.


``` bash
$ node updatedb.js
```
ps: first update takes about 2 hours to fill up 74Mb of data


stop peerunityd:
``` bash
$ PATHTO\deamon peerunityd.exe stop
```


Start the website:
``` bash
$ node webserver.js
```
 
Open http://localhost:3000/ with a modern browser.

------------

FindStakeJS is an **OPEN Open Source Project**. This means that:

> Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.


### Contributors
 

 
-------------------
 