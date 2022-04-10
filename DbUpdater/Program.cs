using System.Reflection;
using Microsoft.Extensions.Configuration;

namespace SQLiteUpdater
{
    class Program
    {
        public static int Main(string[] args)
        {
            return new Program().Run();
        }

        private string? appSettingsFilename;
        private AppSettings? appSettings;

        private int Run()
        {
            var tokenSource = new CancellationTokenSource();
            LoadAppSettings();
            
            var blockRepository = new BlockRepository(appSettings!);
            var transactionRepository = new TransactionRepository(appSettings!);
            
            var rpcclient = new RPCClient("http://" + appSettings!.rpc.host + ":" + appSettings.rpc.port,
                appSettings.rpc.user, appSettings.rpc.pass);

            var blockChainParser = new BlockChainParser(rpcclient, blockRepository, transactionRepository);

            var scheduler = new JobScheduler(blockChainParser.UpdateDb);

            scheduler.Start(appSettings.syncTime);

            var cancellationToken = tokenSource.Token;
            while (!cancellationToken.IsCancellationRequested) // Loop indefinitely
            {
                Console.WriteLine("Enter exit: "); // Prompt
                var line = Console.ReadLine();
                if (line == "exit")
                {
                    scheduler.Dispose();

                    tokenSource.Cancel();
                    break;
                }
                Console.Write("You typed something else");
            }

            return 0;
        }


        private void LoadAppSettings()
        {
            var uri = new Uri(Assembly.GetExecutingAssembly().Location);
            var path = Path.GetDirectoryName(uri.LocalPath) ?? Directory.GetCurrentDirectory();
            appSettingsFilename = Path.Combine(path, "appsettings.json");

            var configuration = new ConfigurationBuilder()
                .AddJsonFile(appSettingsFilename)
                .Build();

            appSettings = configuration.Get<AppSettings>();
        }
    }
}
