using Carter;

namespace WalletProxy;

public class DiscordModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/discord/thread/add", async (DiscordThread message, IDiscordBotClient discordBotClient) =>
            await discordBotClient.AddThread(message?.Title ?? "", message?.Body ?? "")
        ).Produces<AddThreadResponse>(StatusCodes.Status200OK);
    }

    public class DiscordThread
    {
        public string Title { get; set; } = null!;
        public string Body { get; set; } = null!;
    }

    public class AddThreadResponse
    {
        public int code;
    }
}