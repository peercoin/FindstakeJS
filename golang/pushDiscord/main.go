package main

import (
    "fmt"
    "flag"
    "github.com/bwmarrin/discordgo"
)

type AppConfig struct {
	BotToken string
	TagUsers string
	ChannelId string
}

type CreateThreadInput struct {
	Title  string
	Body  string
}

type DiscordClient struct {
    botToken string
}

func NewDiscordClient(botToken string) *DiscordClient {
    return &DiscordClient{
        botToken: botToken,
    }
}

func (client *DiscordClient) SendMessages(channelID string, tags string, blob *CreateThreadInput) error {
    session, err := discordgo.New("Bot " + client.botToken)
    if err != nil {
        return err
    }

    defer session.Close()
 
      firstmessage, err := session.ChannelMessageSend(channelID, blob.Body)
      if err != nil {
          return err
      }
      fmt.Println(blob.Title)
      //create a thread:
      thread, err := session.MessageThreadStartComplex(channelID, firstmessage.ID, &discordgo.ThreadStart{
        Name:                blob.Title,
        AutoArchiveDuration: 60,
        Invitable:           false,
        RateLimitPerUser:    100,
      })
 
      _, err = session.ChannelMessageSend(thread.ID, tags)
      if err != nil {
          return err
      }
 
    return nil
}

//./main -title="opt" -body="body" -bot=atoken -channel=1234567 -tags=<@12344>
func main() {
    titlePtr := flag.String("title", "<title>", "title of thread")
    bodyPtr := flag.String("body", "<body>", "body of message")
    botPtr := flag.String("bot", "sometoken", "dicord bot token")
    channelidPtr := flag.String("channel", "123456789", "channelId the start a thread in")
    tagsPtr := flag.String("tags", "", "message to tag people")
    flag.Parse()
    fmt.Println("title:", *titlePtr)
    fmt.Println("body:", *bodyPtr)
    title := *titlePtr
    body := *bodyPtr
    botToken := *botPtr
    channelID := *channelidPtr
    tags := *tagsPtr
    client := NewDiscordClient(botToken)
    receivedRequest := new(CreateThreadInput)
    receivedRequest.Title = title
    receivedRequest.Body = body
    err := client.SendMessages(channelID, tags, receivedRequest)
    if err != nil {
        fmt.Println("Error sending message:", err)
        return
    }
    fmt.Println("sent message: " + title)
}
