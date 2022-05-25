## WalletProxy


This is a nestjs webservice that act as a REST endpoint for a (empty) peercoin wallet.

Your peercoin.conf should have the following config:
```
listen=1
server=1
 
testnet=0
debug=1
txindex=1
rpcuser=helloiamaproxy
rpcpassword=YcF7!&93YTs2Nhc@CJf
rpcport=8332
```
The username and password can be changed accordingly in .env file:
```
LOCAL_RPC_PORT=8332
LOCAL_RPC_USER=helloiamaproxy
LOCAL_RPC_PASSWORD=YcF7!&93YTs2Nhc@CJf
WEB_PORT=9009
```

## endpoints:
port 9009 is set in .env file
```
 
http://127.0.0.1:9009/block/count
http://127.0.0.1:9009/block/{index:long}
http://127.0.0.1:9009/block/hash/{hash}
http://127.0.0.1:9009/transaction/raw/{txId}   
http://127.0.0.1:9009/transaction/decode/{transaction}  

create a raw coinstake transaction:
POST http://127.0.0.1:9009/transaction/raw/coinstake
    txid: string, //unspent transaction
    vout: number, //index of unspent transaction
    redeemScript: string, e.g.: 532102633a97eab667d165b28b19ad0848cc4f3f3e06e6b19b15cdc910d4b13f4e611f21027260ccc4dba64b04c2c07bd02da5257058ad464857919789ad9c983025fd2cba2102b813e6335216f3ae8547d283f3ab600d08c1c444f5d34fa38cfd941d939001422103131f4fb6fdc603ad3859c2c5b3f246f1ee3ba5391600e960b9be4c59f609b3dd2103b12c1b22ebbdf8e7b1c19db701484fd6fdfb63e4b117800a6838c6eb0f0e881b55ae
    address: string, // the P2SH addresses, usually a multi-signature addresses
    futureOutput: number, // orginal input + stake reward
    futureTimestamp: number, //unix time
    minterPubkey: string //pubkey of the minter, const regex = /^pubkey:[a-fA-F0-9]{130}$/gm; 

``` 


<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install or yarn install
```

## Running the app

```bash
# development
$ npm run start or yarn start

# watch mode
$ npm run start:dev or yarn start:dev

# production mode
$ npm run start:prod or yarn start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
