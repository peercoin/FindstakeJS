// ReSharper disable InconsistentNaming

 
namespace WalletProxy;

public interface IRpcClient
{
    Task<RawTransactionResponse> GetRawTransaction(string txId, int verbose = 0);
    Task<TransactionResponse> GetTransaction(string txId);
    Task<DecodeRawTransactionResponse> DecodeRawTransaction(string transaction);
    Task<BlockResponse> GetBlock(string hash);
    Task<uint> GetBlockCount();
    Task<List<Unspent>> GetUnspents();
    Task<DifficultyResponse> GetDifficulty();
    Task<string> GetBlockHash(long index);

    Task<string> CreateRawCoinStakeTransaction(IReadOnlyList<RawTxStakeInputs> inputs,
        IReadOnlyList<RawTxStakeOutput> outputs, long timestamp);
}