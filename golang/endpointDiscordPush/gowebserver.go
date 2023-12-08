package main

import (
	"container/list"
	"fmt"
	"strconv"
	"sync"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
	"peercoin.net/go-push-discord-endpoint/commands"
)

type AppConfig struct {
	Port      int
	Debugging bool
	BotToken  string
	TagUsers  string
	ChannelId string
}

type DiscordRequest struct {
	Title string `json:"Title" binding:"required"`
	Body  string `json:"Body" binding:"required"`
}

func main() {
	var config AppConfig
	getAppsettings(&config)
	gl_messagesToPush := list.New()

	go popCache(gl_messagesToPush)

	if !config.Debugging {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong!",
		})
	})
	router.POST("/discord/thread/add", createPostMessageHandler(gl_messagesToPush))
	router.Use(cors.Default())
	router.Run(":" + strconv.Itoa(config.Port))
}

func getAppsettings(config *AppConfig) {
	viper.AddConfigPath("./configs")
	viper.SetConfigName("appsettings")
	viper.SetConfigType("json")
	viper.ReadInConfig()

	config.Port = viper.GetInt("web.port")
	config.Debugging = viper.GetBool("web.debug")
	config.BotToken = viper.GetString("discord.botToken")
	config.TagUsers = viper.GetString("discord.tagUsers")
	config.ChannelId = viper.GetString("discord.channelId")

	fmt.Println("listening to port " + strconv.Itoa(config.Port))
}

func createPostMessageHandler(messagesToPush *list.List) gin.HandlerFunc {
	fn := func(c *gin.Context) {
		fmt.Println("request to push: " + strconv.Itoa(messagesToPush.Len()))
		var messageRequest DiscordRequest

		if err := c.BindJSON(&messageRequest); err != nil {
			return
		}
		fmt.Println(messageRequest.Body)
		receivedRequest := new(DiscordRequest)
		receivedRequest.Title = messageRequest.Title
		receivedRequest.Body = messageRequest.Body

		messagesToPush.PushBack(receivedRequest)

		fmt.Println("requests left to process: " + strconv.Itoa(messagesToPush.Len()))
		c.IndentedJSON(200, messageRequest)
	}

	return gin.HandlerFunc(fn)
}

func logwithtime(name string) {
	message := fmt.Sprintf("Hi, %v", name)
	fmt.Println(message)
}

func pushOneDiscord(messagesToPush *list.List) {
	if messagesToPush.Len() > 0 {
		topmessage := messagesToPush.Front()
		title := topmessage.Value.(*DiscordRequest).Title
		body := topmessage.Value.(*DiscordRequest).Body
		fmt.Println(title)

		var config AppConfig
		getAppsettings(&config)

		commands.PushMessage(title, body,
			config.BotToken, config.ChannelId, config.TagUsers)

		messagesToPush.Remove(topmessage)
		logwithtime("push queue remaining: " + strconv.Itoa(messagesToPush.Len()))
	}
}

func popCache(messagesToPush *list.List) {
	var lock sync.Mutex
	timer1 := time.NewTicker(time.Second * 25)
	defer timer1.Stop()
	timer2 := time.NewTicker(time.Second * 500)
	defer timer2.Stop()
	for {
		/* run forever */
		select {
		case <-timer1.C:
			go func() {
				lock.Lock()
				defer lock.Unlock()
				/* do things I need done every 25 seconds */
				pushOneDiscord(messagesToPush)
			}()
		case <-timer2.C:
			go func() {
				lock.Lock()
				defer lock.Unlock()
				/* do things I need done every 500 seconds */
				logwithtime("I'm still alive!")
			}()
		}
	}
}
