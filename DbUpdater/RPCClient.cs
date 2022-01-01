using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using Newtonsoft.Json;

namespace SQLiteUpdater
{
    public class RpcClient
	{
		protected Uri uri;

		protected string user;
		protected string password;

		public RpcClient(string uri, string user, string password)
		{
			this.uri = new Uri(uri);
			this.user = user;
			this.password = password;
		}


		public bool CheckConnection()
		{
			try
			{
				var height = RpcCall<int>(new RpcRequest("getblockcount"));
				return height > 0;
			}
			catch (Exception)
			{
				return false;
			}
		}

		public RawTransactionResponse GetRawTransaction(string txId, int verbose = 0)
		{
			return RpcCall<RawTransactionResponse>(new RpcRequest("getrawtransaction", new Object[] { txId, verbose }));
		}

		public TransactionResponse GetTransaction(string txId)
		{
			return RpcCall<TransactionResponse>(new RpcRequest("gettransaction", new Object[] { txId }));
		}

		public DecodeRawTransactionResponse DecodeRawTransaction(string transaction)
		{
			return RpcCall<DecodeRawTransactionResponse>(new RpcRequest("decoderawtransaction", new Object[] { transaction }));
		}


		public BlockResponse GetBlock(string hash)
		{
			return RpcCall<BlockResponse>(new RpcRequest("getblock", new Object[] { hash }));
		}

		public uint GetBlockCount()
		{
			return RpcCall<uint>(new RpcRequest("getblockcount"));
		}

		public List<Unspent> GetUnspents()
		{
			return RpcCall<List<Unspent>>(new RpcRequest("listunspent"));
		}

		public DifficultyResponse GetDifficulty()
		{
			return RpcCall<DifficultyResponse>(new RpcRequest("getdifficulty"));
		}


		public string GetBlockHash(long index)
		{
			return RpcCall<string>(new RpcRequest("getblockhash", new Object[] { index }));
		}


		protected string HttpCall(string jsonRequest)
		{
			HttpWebRequest request = (HttpWebRequest)WebRequest.Create(uri);

			request.Method = "POST";
			request.ContentType = "application/json-rpc";

			// always send auth to avoid 401 response
			var auth = this.user + ":" + this.password;
			auth = Convert.ToBase64String(Encoding.UTF8.GetBytes(auth), Base64FormattingOptions.None);
			request.Headers.Add("Authorization", "Basic " + auth);

			request.ContentLength = jsonRequest.Length;

			using (StreamWriter sw = new StreamWriter(request.GetRequestStream()))
			{
				sw.Write(jsonRequest);
			}

			try
            {
                using var response = (HttpWebResponse)request.GetResponse();
                using var sr = new StreamReader(response.GetResponseStream());
                return sr.ReadToEnd();
            }
			catch (WebException wex)
            {
                using var response = (HttpWebResponse)wex.Response;
                using var sr = new StreamReader(response!.GetResponseStream());
                if (response.StatusCode != HttpStatusCode.InternalServerError)
                {
                    throw;
                }
                return sr.ReadToEnd();
            }
		}


		private T RpcCall<T>(RpcRequest rpcRequest)
		{
			/*this.uri = new Uri(settings.GetRpcUri());
			this.user = settings.GetRpcUser();
			this.password = settings.GetRpcPassword();*/

			var jsonRequest = JsonConvert.SerializeObject(rpcRequest);

			var result = HttpCall(jsonRequest);

			var rpcResponse = JsonConvert.DeserializeObject<RPCResponse<T>>(result);

			if (rpcResponse is { error: { } })
			{
				throw new RPCException(rpcResponse.error);
			}
			return rpcResponse!.result;
		}
	}





	[JsonObject(MemberSerialization = MemberSerialization.Fields)]
	public class RpcRequest
	{	
		string jsonrpc = "2.0";
 
        // ReSharper disable once ArrangeTypeMemberModifiers
        uint id = 1;

        // ReSharper disable once ArrangeTypeMemberModifiers
        string method;

		[JsonProperty(PropertyName = "params", NullValueHandling = NullValueHandling.Ignore)]
		IList<Object> requestParams = null;

		public RpcRequest(string method, IList<Object> requestParams = null, uint id = 1)
		{
			this.method = method;
			this.requestParams = requestParams;
			this.id = id;
        }
	}


	public class RPCResponse<T>
	{
		public T result;
		public RPCError error;
		public uint id;
	}


	public class RPCError
	{
		public int code;
		public string message;
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


	public class RawTransactionResponse
	{
		public string hex;
		public string blockhash;
		public long blocktime;

		public static implicit operator RawTransactionResponse(String s)
		{
			return new RawTransactionResponse() { hex = s };
		}
	}

	public class BlockResponse
	{
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
		public string[] addresses;
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
		public ScriptPubKey scriptPubKey;

	}

	public class DecodeRawTransactionResponse
	{
		public string txid;
		public int version;
		public int? time; // breaks at Tue Jan 19 2038 todo: make it a long?
		public int locktime;
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
}
