## GO-PUSH-DISCORD

This is a microservie made wth gin in golang.

It has one endpoint to push a text message in a thread to a channel in Discord.

## How to compile:
* fill in the correct configuration in configs
go build gowebserver.go
or
docker build --tag local:gowebserver .

## How to run:
check the settings in appsettings.json
./gowebserver
or
docker run -d --name my_go_webserver -p 9009:9009 local:gowebserver


## endpoints:
port 9009 is defined in appsetting.json
```
GET http://127.0.0.1:9009/ping
POST http://127.0.0.1:9009/discord/thread/add    {Title:string, Body:string}
