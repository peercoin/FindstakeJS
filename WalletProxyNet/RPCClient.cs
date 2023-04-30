using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace WalletProxy;
// ReSharper disable InconsistentNaming

 

public class RPCClient : IRpcClient
{
    private readonly IRpcClientFactory rpcClientFactory;

    public RPCClient(IRpcClientFactory rpcClientFactory)
    {
        this.rpcClientFactory = rpcClientFactory;
    }

    public async Task<bool> CheckConnection()
    {
        try
        {
            var height = await RpcCall<int>(new RPCRequest("getblockcount"));
            return height > 0;
        }
        catch (Exception)
        {
            return false;
        }
    }

    public async Task<RawTransactionResponse> GetRawTransaction(string txId, int verbose = 0)
    {
        return await RpcCall<RawTransactionResponse>(new RPCRequest("getrawtransaction", new Object[] { txId, verbose }));
    }

    public async Task<TransactionResponse> GetTransaction(string txId)
    {
        return await RpcCall<TransactionResponse>(new RPCRequest("gettransaction", new Object[] { txId }));
    }

    public async Task<DecodeRawTransactionResponse> DecodeRawTransaction(string transaction)
    {
        return await RpcCall<DecodeRawTransactionResponse>(new RPCRequest("decoderawtransaction", new Object[] { transaction }));
    }

    public async Task<BlockResponse> GetBlock(string hash)
    {
        return await RpcCall<BlockResponse>(new RPCRequest("getblock", new Object[] { hash }));
    }

    public async Task<uint> GetBlockCount()
    {
        return await RpcCall<uint>(new RPCRequest("getblockcount"));
    }

    public async Task<List<Unspent>> GetUnspents()
    {
        return await RpcCall<List<Unspent>>(new RPCRequest("listunspent"));
    }

    public async Task<DifficultyResponse> GetDifficulty()
    {
        return await RpcCall<DifficultyResponse>(new RPCRequest("getdifficulty"));
    }

    public async Task<string> GetBlockHash(long index)
    {
        return await RpcCall<string>(new RPCRequest("getblockhash", new Object[] { index }));
    }

    public async Task<string> CreateRawCoinStakeTransaction(IReadOnlyList<RawTxStakeInputs> inputs, 
        IReadOnlyList<RawTxStakeOutput> outputs,
        long timestamp)
    {
        var param1 = inputs;
        var param2 = new JArray {JObject.FromObject(new { coinstake = 0 })};

        foreach (var output in outputs)
        {
            var jobj = new JObject {{output.Address, new JValue(output.Vout)}};
            param2.Add(jobj);
        }

        return await RpcCall<string>(new RPCRequest("createrawtransaction", new Object[] { param1, param2, 0, timestamp }));
    }

    public async Task<T> RpcCall<T>(RPCRequest rpcRequest)
    {
        //var test = JsonConvert.SerializeObject(rpcRequest);

        using var content = new StringContent(JsonConvert.SerializeObject(rpcRequest), Encoding.UTF8, "text/plain");
        var result = await rpcClientFactory.GetClient().PostAsync(rpcClientFactory.GetUri(), content);

        if (!result.IsSuccessStatusCode)
        {
            throw new RPCException(new RPCError() { code = 1042, message = "no dice" });
        }

        var returnValue = await result.Content.ReadAsStringAsync();
        if (string.IsNullOrEmpty(returnValue))
        {
            throw new RPCException(new RPCError() { code = 1043, message = "no result" });
        }

        var rpcResponse = JsonConvert.DeserializeObject<RPCResponse<T>>(returnValue);

        if (rpcResponse == null)
        {
            throw new RPCException(new RPCError() { code = 1044, message = "rpcResponse is null" });
        }

        if (rpcResponse.error != null)
        {
            throw new RPCException(rpcResponse.error);
        }
        return rpcResponse.result;
    }
}

[JsonObject(MemberSerialization = MemberSerialization.Fields)]
public class RPCRequest
{
#pragma warning disable CS0414
    string jsonrpc = "2.0";
    uint id;
    string method;
#pragma warning restore CS0414

    [JsonProperty(PropertyName = "params", NullValueHandling = NullValueHandling.Ignore)]
    IList<object>? requestParams;

    public RPCRequest(string method, IList<object>? requestParams = null, uint id = 1)
    {
        this.method = method;
        this.requestParams = requestParams;
        this.id = id;
    }
}


public class RPCResponse<T>
{
#pragma warning disable CS8618
    public T result;
    public RPCError error;
    public uint id;
#pragma warning restore CS8618
}


public class RPCError
{
#pragma warning disable CS8618
    public int code;
    public string message;
#pragma warning restore CS8618
}


public class RPCException : Exception
{
    public RPCError Error
    {
        get;
        private set;
    }

    public RPCException(RPCError rpcError)
        : base(rpcError.message)
    {
        Error = rpcError;
    }

    public RPCException(RPCError rpcError, Exception innerException)
        : base(rpcError.message, innerException)
    {
        Error = rpcError;
    }
}

#pragma warning disable CS8618
public class RawTransactionResponse
{

    public string hex;
    public string blockhash;
    public long blocktime;

    public static implicit operator RawTransactionResponse(string s)
    {
        return new RawTransactionResponse() { hex = s };
    }
}


public class BlockResponse
{
    // ReSharper disable UnusedMember.Global
    public string hash;
    public long confirmations;

    public int size;

    public long height;
    public int version;
    public string merkleroot;
    public IEnumerable<string> tx;
    public long time;
    public long nonce;
    public string bits;
    public decimal difficulty;
    public string previousblockhash;
    public string nextblockhash;
    public string flags;
    public string modifier;

    public int nTx;
    // ReSharper restore UnusedMember.Global
}


public class ScriptSig
{
    public string asm;
    public string hex;
}

public class ScriptPubKey
{
    public string asm;
    public string hex;
    public int reqSigs;
    public string type;
    public string[]? addresses;
}

public class Input
{
    public string txid;
    public int vout;
    public ScriptSig scriptSig;
    public long sequence;
}

public class Output
{
    public decimal value;
    public int n;
    public ScriptPubKey? scriptPubKey;

}

public class DecodeRawTransactionResponse
{
    public string txid;
    public int version;
    public long? time;
    public long locktime;
    public int size;
    public int vsize;

    public Input[] vin;
    public Output[] vout;
}


public class TransactionResponse
{
    public string blockhash;
    public long time;
    public string hex;
}

public class Unspent
{
    public string txid;
    public string address;
    public uint vout;
}

public class DifficultyResponse
{
    [JsonProperty("proof-of-stake")]
    public decimal pos { get; set; }

    [JsonProperty("proof-of-work")]
    public decimal pow { get; set; }

}
#pragma warning restore CS8618
 

public class RawTxStakeInputs
{
    public string txid { get; set; } = null!;
    public int vout { get; set; }

    public string redeemScript { get; set; } = null!;
}

public class RawTxStakeOutput
{
    public string Address { get; set; }
    public double Vout { get; set; }

    public RawTxStakeOutput(string address, double vout)
    {
        Address = address;
        Vout = Math.Round(vout, 6, MidpointRounding.ToZero);
    }
}