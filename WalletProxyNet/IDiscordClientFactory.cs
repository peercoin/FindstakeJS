using Discord.WebSocket;

namespace WalletProxy; 

public interface IDiscordClientFactory
{
    Task<DiscordSocketClient> GetClient();
    AppSettingsDiscord SettingsDiscord { get; }
}