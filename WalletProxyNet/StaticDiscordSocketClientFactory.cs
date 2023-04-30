using Discord;
using Discord.WebSocket;
using Serilog;
using Serilog.Events;
using ILogger = Serilog.ILogger;

namespace WalletProxy;

public class StaticDiscordSocketClientFactory : IDiscordClientFactory
{
    private static readonly Lazy<DiscordSocketClient> ClientInstance = new Lazy<DiscordSocketClient>(
        () =>
        {
            var client = new DiscordSocketClient();

            return client;
        });

    public AppSettingsDiscord SettingsDiscord { get; private set; }
    private readonly ILogger logger;

    public StaticDiscordSocketClientFactory(ILogger logger, AppSettingsDiscord appSettingsDiscord)
    {
        this.logger = logger;
        this.SettingsDiscord = appSettingsDiscord;
    }

    public async Task<DiscordSocketClient> GetClient()
    {
        if (ClientInstance.IsValueCreated) return ClientInstance.Value;

        //init
        var client = ClientInstance.Value;
        client.Log += LogAsync;
        await client.LoginAsync(TokenType.Bot, SettingsDiscord.BotToken);

        return ClientInstance.Value;
    }

    private async Task LogAsync(LogMessage message)
    {
        var severity = message.Severity switch
        {
            LogSeverity.Critical => LogEventLevel.Fatal,
            LogSeverity.Error => LogEventLevel.Error,
            LogSeverity.Warning => LogEventLevel.Warning,
            LogSeverity.Info => LogEventLevel.Information,
            LogSeverity.Verbose => LogEventLevel.Verbose,
            LogSeverity.Debug => LogEventLevel.Debug,
            _ => LogEventLevel.Information
        };
        logger.Write(severity, message.Exception, "[{Source}] {Message}", message.Source, message.Message);
        await Task.CompletedTask;
    }
}