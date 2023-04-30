    namespace WalletProxy; 

    public interface IRpcClientFactory
    {
        Uri GetUri();
        HttpClient GetClient();
    }