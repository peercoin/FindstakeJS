FindStakeJS
=====
### Getting to know in advance when your Peercoins stake

FindStakeJS originates from Kac-'s Findstake project, a tool written in Go to predict stakes but ported to JavaScript. UI, webserver and database all in one language.

Most cryptocoin mining requires specialized hardware, but Peercoin minting can be done on any computer. Minting is energy-efficient, because it is based on the Peercoins you hold, rather than on your processing power.

**But Peercoin can even be more energy-efficient! **

With FindStakeJS, there is no need to leave Peerunity on 24-7 anymore. 
Find out in advance and turn on your wallet software just before it counts and help secure the network.

#### Features:

 * Easy to use interface. (But can be improved if you are a twitter bootstrap rockstar) 
 * Can be used without online data services, your Peerunity has already all the date it needs. 
 * A command line option to update its internal database via Peerunityd rpc-json interface.

Dependencies:
------------
 * installed Peerunity/PeercoinQT wallet with sync data
 * a modern browser [also a fast pc would not hurt, the browser is doing all the hard work, not the webserver]
 * nodejs (http://nodejs.org/)
    level 
      level down, 
        requires node-gyp to compile c++ stuff (please read https://www.npmjs.com/package/node-gyp)
    
    
How to install
----------
cd the folder:
``` bash
$ npm install
```
    
How to set up
----------
this set up is initially needed to update the database:

make sure to have the following in file ppcoin.conf:
#Server mode allows Qt to accept JSON-RPC commands
listen=1
server=1
txindex=1
rpcssl=0
# You must set rpcuser and rpcpassword to secure the JSON-RPC api
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
 