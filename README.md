FindstakeJS
=====
### Getting to know in advance when to mint your Peercoins (protocol version v.05)

FindstakeJS originates from Kac-'s Findstake project, a tool written in Go to predict stakes but ported to JavaScript (and rewritten in TypeScript, vuejs and c#).  

Most cryptocoin mining requires specialized hardware, but Peercoin minting can be done on any computer. Minting is energy-efficient, because it is based on the Peercoins you hold, rather than on your processing power.

**But Peercoin can even be more energy-efficient! **

With FindstakeJS, there is no need to leave Peercoin wallet on 24-7 anymore. 
Find out in advance when to mint and startup your wallet just before it finds a block and help secure the network. 

 

Dependencies:
------------
 * installed Peercoin wallet with synced data
    or use docker with this command to run it behind port 9999:
    docker run -p 9999:9902 --name peercoind -d peercoin/peercoind \
        -rpcallowip=0.0.0.0/0 \
        -rpcpassword=my_unique_password \
        -rpcuser=my_secret_password \
        -rest=1 \
        -corsdomain=*
 * a modern browser like firefox
 

    
     
	
How to set up
----------
 
* make sure to have the following settings in peercoin.conf file:
``` bash
listen=1
server=1
txindex=1
rpcuser=change_this_to_a_long_random_user
rpcpassword=change_this_to_a_long_random_password
rpcport=9902
corsdomain=https://findstake.peercoin.net (or * to accept all domains)
rest=1
```

* start Peercoin wallet (or daemon):
 
## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn dev
```

### Compiles and minifies for production
```
yarn build
```

### Deploy

everything in the `dist` folder.  


  
Open http://localhost:3000/  

About
----------

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

Remove Transaction Timestamp (introduced in v.11)
----------

https://github.com/peercoin/rfcs/blob/master/text/0014-transaction-timestamp/0014-transaction-timestamp.md
 Transaction timestamp has long posed compatibility issues with many of the major Bitcoin infrastructures.

It has been generally agreed upon that transaction timestamp inside coinstake transactions carries some security purposes, especially in the light of cold minting and minting pools.


For the removal of the regular transaction timestamp, the following changes should be considered:

- Transaction signing and validation to be updated to not include the timestamp.
- Update CheckStakeKernelHash to validate against block timestamps of UTXO and coinstake.
- A hard fork incrementing the transaction version.
- ppcoin flag for rawtransaction RPC interface compatibility (whether to include transaction timestamp field)
- JSON RPC methods to determine transaction timestamps based on the block timestamp. (backwards compatibility) 

Have fun!
