using Carter;
using Serilog;
using WalletProxy;

var logger = new LoggerConfiguration()
    .MinimumLevel.Verbose()
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors();

builder.Services.AddEndpointsApiExplorer();
//builder.Services.AddSingleton<Logger>(logger);
builder.Services.AddSingleton<IRpcClient>(new RPCClient(new StaticRestClientFactory()));
builder.Services.AddSingleton<IDiscordBotClient>(new DiscordClient(new StaticDiscordSocketClientFactory(logger, AppSettings.DiscordSettings)));
builder.Services.AddCarter();
 
await using var app = builder.Build();

// global cors policy
app.UseCors(x => x
    .AllowAnyMethod()
    .AllowAnyHeader()
    .SetIsOriginAllowed(origin => true) // allow any origin
    .AllowCredentials()); // allow credentials

//config endpoints with Carter:
//app.MapGet("/", () => "Hello! This is .NET 6 Minimal API App Service").ExcludeFromDescription();
app.MapCarter();

//Run the application.
app.Run("http://127.0.0.1:9009");

