using Discord;

namespace WalletProxy;

public class DiscordClient : IDiscordBotClient
{
    private readonly IDiscordClientFactory discordClientFactory;

    public DiscordClient(IDiscordClientFactory discordClientFactory)
    {
        this.discordClientFactory = discordClientFactory;
    }

    public async Task AddThread(string title, string body)
    {
        var client = await discordClientFactory.GetClient();

        var channel = await client.GetChannelAsync(discordClientFactory.SettingsDiscord.ChannelId) as ITextChannel;

        var newThread = await channel!.CreateThreadAsync(
            name: title,
            autoArchiveDuration: ThreadArchiveDuration.OneWeek,
            invitable: false,
            type: ThreadType.PublicThread
        );

        await newThread.SendMessageAsync(body);

        //tag everyone with permission
        if (!string.IsNullOrEmpty(discordClientFactory.SettingsDiscord.TagUsers))
            await newThread.SendMessageAsync(discordClientFactory.SettingsDiscord.TagUsers);
    }
}