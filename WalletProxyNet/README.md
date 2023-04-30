
## WalletProxy


This is a aspnet6.0 webservice that act as a REST endpoint for peercoin wallet.

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
The username and password can be changed accordingly in settings.json

## How to compile app:
dotnet publish WalletProxy.csproj -c Release --runtime linux-x64 --no-self-contained

(or use self-contained if there isnt a runtime net 6 installed)

## How to run:
~~build with Dockerfile~~  
~~then e.g.: sudo docker run -d -p 8332:8332 -p 9009:9009 nameofimage~~

(todo: needs testing)

or 

WalletProxy.exe 

or 

./WalletProxy (might need to chmod 777 first)

## endpoints:
port 9009 is hardcoded, todo: add port to settings.json
```
GET http://127.0.0.1:9009/ping
GET http://127.0.0.1:9009/difficulty
GET http://127.0.0.1:9009/block/count
GET http://127.0.0.1:9009/block/{index:long}
GET http://127.0.0.1:9009/block/hash/{hash}
GET http://127.0.0.1:9009/transaction/raw/{txId}
POST http://127.0.0.1:9009/transaction/raw/decode     {transaction:string}
GET http://127.0.0.1:9009/listunspents
``` 