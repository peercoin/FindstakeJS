FindstakeJS
=====
### Getting to know in advance when to mint your Peercoins (protocol version v.05 as to be switched on March 15 2016)

FindstakeJS originates from Kac-'s Findstake project, a tool written in Go to predict stakes but ported to JavaScript (and rewritten in TypeScript). 
UI, webserver and database all in one (preferably typed) language.

Most cryptocoin mining requires specialized hardware, but Peercoin minting can be done on any computer. Minting is energy-efficient, because it is based on the Peercoins you hold, rather than on your processing power.

**But Peercoin can even be more energy-efficient! **

With FindstakeJS, there is no need to leave Peerunity on 24-7 anymore. 
Find out in advance and turn on your wallet software just before it counts and help secure the network.

#### Features:

 * Easy to use interface. 
 * Can be used without online data services, your Peerunity has already all the data it needs. 
 * A command line option to update its internal database via Peerunityd rpc-json interface.

#### Screenshot:
![Alt text](https://i.imgur.com/Mhw27M9.png "FindstakeJS v0.5")

Dependencies:
------------
 * installed Peerunity wallet with sync data
 * a modern browser [also a fast pc would not hurt, the browser is doing all the hard work, not the webserver]
 * nodejs (http://nodejs.org/)
 * a couchdb instance
    
    
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
set up a new instance of couchdb
configure the same couch username and password in \app\config.js

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


### Coin age, the heart behind Proof of Stake

 Coin age is defined as the currency amount times the holding period [King and Nadal 2012].  For example, if
Alice transfers two coins to Bob and Bob held the coins for 90 days,  the coin age is 180 coin-days.  When Bob spends
the two coins, the coin age he accumulated is destroyed.

The idea to use the coin age to define the reward is known as proof of stake [King and Nadal 2012] (PoS).  Mining a proof-of-stake block requires to construct a so-called coinstake block (named after Bitcoin's coinbase transaction).

In a coinstake transaction, owners send coins in their possession  to  themselves  and  add  a  predefined  percentage  as
their reward.  Analogue to proof of work, a hash value below or  equal  to  a  target  value  is  required  to  successfully  mint a  block.   In  contrast  to  proof  of  work  (and  Bitcoin),  the dificulty is individually determined:  it is inversely proportional  to  the  coin  age.   Because  the  hash  is (except  for  a timestamp) calculated  on  static  data,  there  is  no  way  for miners to use their computational power to solve the puzzle faster than others. In particular, there is no nonce which can be modified.  Instead, every second the timestamp changes and  miners  have  a  new  chance  of  finding  the  solution.   If they find a solution, they broadcast the block including the coinstake transaction.  The coinstake transaction assigns the reward to the miner, but also resets the coin age.  Of course, new coin age can subsequently be accumulated again, slowly increasing the chances of solving the puzzle next time.

The floating stakemodifier (introduced in v.05)
----------

 As mentioned above, the  hash  is calculated  on  static  data. In short it means that it is possible to calculate when a stake can be found at a future point of time. This includes years into the future. This has led to discussions about a so-called long range attack. 
 To counter this long range attack, peercoin will be using a floating stakemodifier, making the hash calculation  dependend on less static data..... that changes once in a while. The new protocol with floating modifier allows findstakejs to calculate up to 1,830,080 seconds (21 days) ahead of last known block. 

Have fun!
