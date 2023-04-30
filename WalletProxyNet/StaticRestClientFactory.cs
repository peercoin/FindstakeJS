using System.Net.Http.Headers;
using System.Text;

namespace WalletProxy;

public class StaticRestClientFactory : IRpcClientFactory
{
    private static readonly Lazy<HttpClient> ClientInstance = new Lazy<HttpClient>(
        () =>
        {
            var client = new HttpClient
            {
                BaseAddress = new Uri(AppSettings.RpcUri)
            };
            var auth = AppSettings.RpcUser + ":" + AppSettings.RpcPassword;
            auth = Convert.ToBase64String(Encoding.UTF8.GetBytes(auth), Base64FormattingOptions.None);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", auth);

            return client;
        });


    public Uri GetUri()
    {
        return new Uri(AppSettings.RpcUri);
    }

    public HttpClient GetClient()
    {
        return ClientInstance.Value;
    }
}