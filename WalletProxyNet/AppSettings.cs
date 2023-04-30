using Newtonsoft.Json;

namespace WalletProxy;

public class AppSettings
{
    public static string RpcUri { get; private set; }
    public static string RpcUser { get; private set;}
    public static string RpcPassword { get; private set; }
    public static AppSettingsDiscord DiscordSettings { get; private set; }

    private class Settings
    {
        public string Rpcuri { get; set; } = null!;
        public string Rpcuser { get; set; } = null!;
        public string Rpcpassword { get; set; } = null!;
        public AppSettingsDiscord Discord { get; set; } = null!;
    }

    //Static constructor
    static AppSettings() 
    {  
        var strExeFilePath = System.Reflection.Assembly.GetExecutingAssembly().Location;
        var strWorkPath = Path.GetDirectoryName(strExeFilePath);
        var filename = Path.Combine(strWorkPath!, "settings.json");        
        var settings = JsonConvert.DeserializeObject<Settings>(File.ReadAllText(filename));
        AppSettings.RpcUri = settings!.Rpcuri;
        AppSettings.RpcUser = settings.Rpcuser;
        AppSettings.RpcPassword = settings.Rpcpassword;
        AppSettings.DiscordSettings = settings.Discord;
    }  
}

public class AppSettingsDiscord
{
    public string BotToken { get; set; } = null!;
    public string? TagUsers { get; set; }
    public ulong ChannelId { get; set; }
}