using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SQLiteUpdater
{
    public class BlockChainParser
	{
		private readonly RpcClient client;
		private readonly TransactionRepository transactionRepository;
		private readonly BlockRepository blockRepository;

		public BlockChainParser(RpcClient client, BlockRepository blockRepository, TransactionRepository transactionRepository)
		{
			this.client = client;
			this.transactionRepository = transactionRepository;
			this.blockRepository = blockRepository;
        }


        public async Task UpdateDb(CancellationToken cancellationToken)
        {
            var blockcount = client.GetBlockCount();
			Console.WriteLine("blockcount: " + blockcount);
            var difficulty = client.GetDifficulty();
			Console.WriteLine("difficulty: " + difficulty.pos);
			var metaData = await blockRepository.GetMeta();

            metaData.Diff = difficulty.pos;
            metaData.CurBH = blockcount;
			Console.WriteLine("last block: " + metaData.MaxBH);
            while (!cancellationToken.IsCancellationRequested && metaData.MaxBH + 8 < 10 * (metaData.CurBH / 10))
            {
                var current = (uint)metaData.MaxBH + 1;
				Console.WriteLine("updating: " + current);
				var hash = GetHash(current);
                await Parse(hash);

                metaData.MaxBH = current;
                await blockRepository.SetMeta(metaData);
            }
			Console.WriteLine("end update");
        }


        public string GetBlockHash(string txId)
		{
			var tx = client.GetRawTransaction(txId, 1);
			return tx.blockhash;
		}


        public static long GetSizeVarInt(long n)
        {
            return n switch
            {
                < 253 => 1,
                <= 65535 => 3,
                <= 4294967295 => 5,
                _ => 9
            };
        }


		public async Task Parse(uint height, List<string> txIds, uint blocktime)
		{
			var sizeVarintTx = GetSizeVarInt(txIds.Count);
			var offset = PeercoinConstants.BlockHeaderSize + sizeVarintTx;

			for (var index = 0; index < txIds.Count; index++)
			{
				var tx = client.GetRawTransaction(txIds[index]);
				var txraw = client.DecodeRawTransaction(tx.hex);
				var rawsize = tx.hex.Length / 2; // 2 char is 1 byte

				await StoreTxState(blocktime, height, txraw, (uint)index, offset, (uint)rawsize);

                await DeleteSpentFromStore(txraw);
				await ParseVouts(txraw);

				offset += rawsize;
			}

		}


		private async Task ParseVouts(DecodeRawTransactionResponse txraw)
		{
            if (txraw.vout != null)
            {
                foreach (var txout in txraw.vout)
                {
                    if (txout.value <= 0) continue;

                    var outvalue = new VOutData(txout.value, txout.scriptPubKey);

                    await transactionRepository.UpsertRawTo(txraw.txid, txout.n, outvalue.v, new TransactionRepository.Pub
                    {
                        asm = outvalue.scriptPubKey?.asm,
                        hex = outvalue.scriptPubKey?.hex,
                        type = outvalue.scriptPubKey?.type
                    });
                }
            }
			
			if (txraw is { vout: { Length: > 0 } })
			{
				foreach (var txout in txraw.vout)
                {
                    await StoreAddresses(txraw.txid, txout);
                }
			}
		}


		private async Task StoreAddresses(string transactionid, Output txout)
		{
			if (txout is { scriptPubKey: { addresses: { Length: > 0 } } })
			{
                foreach (var address in txout.scriptPubKey.addresses)
				{
                    await transactionRepository.UpsertAddressTxo(address, transactionid, txout.n);
				}
			}
		}


        private async Task StoreTxState(uint blocktime, uint height, DecodeRawTransactionResponse txraw,
            uint index, long offset, uint rawsize)
        {
            var time = blocktime < PeercoinConstants.ProtocolV10SwitchTime && txraw.time.HasValue
                ? (uint)txraw.time.Value
                : blocktime;

            await transactionRepository.UpsertRawTx((int)height, time, index, txraw.txid, offset, rawsize);
        }


		private async Task DeleteSpentFromStore(DecodeRawTransactionResponse txraw)
		{
            if (txraw is { vin: { Length: > 0 } })
			{
				var inputs = txraw.vin.ToList().Where(tin => !string.IsNullOrWhiteSpace(tin.txid)).ToList();
				foreach (var txin in inputs)
				{
					await transactionRepository.DeleteSpentOutputState(txin.txid, txin.vout);
				}
			}
		}


		/// <summary>
		/// parse entire block including its tx
		/// </summary>
		/// <param name="hash"></param>
		/// <returns></returns>
        public async Task<uint> Parse(string hash)
        {
            var block = GetBlock(hash);

            await Store(block);

            if (block.nTx > 0)
            {
                await Parse((uint)block.height, block.tx.ToList(), (uint)block.time);
            }

            return (uint)block.height;
        }

		private async Task Store(BlockResponse block)
		{
			var newSate = new BlockState
			{
				h = (uint)block.height,
				hash = block.hash,
				f = block.flags == "proof-of-stake" ? "pos" : "pow",
				bt = (uint)block.time,
				mr = block.modifier,
				tx = block.tx.ToList(),
				nTx = (uint)block.nTx
			};
			await blockRepository.SetBlockState(newSate);
		}

		private string GetHash(uint index)
		{
			return client.GetBlockHash(index);
		}

		private BlockResponse GetBlock(string hash)
		{
			return client.GetBlock(hash);
		}

	}//class parser


	public class BlockState
	{
		public uint h { get; set; } //height

		public string f { get; set; } //pow, pos
		public uint bt { get; set; } //block unixtime
		public string mr { get; set; } //blocks are clustered by modifier
		public string hash { get; set; } //64 char
		public List<string> tx { get; set; }
		public uint nTx { get; set; } //length tx
	}

}
