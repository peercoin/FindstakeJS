namespace WalletProxy;

public interface IDiscordBotClient
{
    Task AddThread(string title, string body);
}