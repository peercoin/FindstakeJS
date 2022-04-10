using System;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using Newtonsoft.Json;

namespace SQLiteUpdater
{
    public class VOutData
    {
        public VOutData(decimal outputvalue, ScriptPubKey? scriptPubKey)
        {
            v = Convert.ToInt64(Math.Floor(PeercoinConstants.Coin * outputvalue));
            this.scriptPubKey = scriptPubKey;

        }
        public long v { get; set; }
		public ScriptPubKey? scriptPubKey { get; set; }
    }

    public class DbRepostory
    {
        private readonly string connectionString;
        private readonly AppSettings appSettings;

        public DbRepostory(AppSettings appSettings)
        {
            this.appSettings = appSettings;
            connectionString = $"Filename={appSettings.db.database}";
        }

        public async Task<SqliteConnection> SetPragmas()
        {
            var sql = @" PRAGMA synchronous=OFF";

            var connection = new SqliteConnection(connectionString);
            connection.Open();
            var command = new SqliteCommand(sql, connection);
            await command.ExecuteNonQueryAsync();

            sql = @" PRAGMA journal_mode=OFF ";
			var command2 = new SqliteCommand(sql, connection);
            await command2.ExecuteNonQueryAsync();

            return connection;
        }


        public async Task SetMeta(MetaItem meta)
        {
            await using var connection = await SetPragmas();

            const string sql = @" INSERT OR REPLACE INTO Meta (name, data) VALUES(@name,@data)";
            var json = JsonConvert.SerializeObject(meta, Formatting.None);
			var command = new SqliteCommand(sql, connection);

            command.Parameters.AddWithValue("@name", this.appSettings.db.dbmetakey);
            command.Parameters.AddWithValue("@data", json);
			await command.ExecuteNonQueryAsync();
        }


        public async Task<MetaItem?> GetMeta()
        {
            await using var connection = await SetPragmas();

            const string sql = @" SELECT data FROM Meta WHERE name  = @name";
           
            var command = new SqliteCommand(sql, connection);

            command.Parameters.AddWithValue("@name", this.appSettings.db.dbmetakey);

            await using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                var json = reader["data"].ToString();

                if (!string.IsNullOrEmpty(json))
                {
                    return JsonConvert.DeserializeObject<MetaItem>(json);
                }
            }

            return new MetaItem
            {
                MaxBH = 589000, // last synce blockThu, 28 Oct 2021 20:38:20 UTC   Peercoin Network Activates Hard Fork on November 1, 2021
                MaxTx = 1, //not used
                Diff = 0, //last diff from rpc client
                CurBH = 1 //last blockcount from rpc client
            };
        }

		
        public class MetaItem
        {
            // ReSharper disable once InconsistentNaming
            public long MaxBH { get; set; }
            // ReSharper disable once InconsistentNaming
            public long MaxTx { get; set; }
            // ReSharper disable once InconsistentNaming
            public decimal Diff { get; set; }
            // ReSharper disable once InconsistentNaming
            public long CurBH { get; set; }
        };
    }
	

    public class BlockRepository: DbRepostory
    {
        public BlockRepository(AppSettings appSettings): base(appSettings)
        {
        }
		
		public async Task SetBlockState(BlockState block)
        {
            await using var connection = await SetPragmas();

			var sql = @" INSERT OR REPLACE INTO RawBlock (height, hash, data) VALUES(@height, @hash ,@data)";

            var command = new SqliteCommand(sql, connection);
            var json = JsonConvert.SerializeObject(new Blockdata
			{
                f = block.f,
                bt = block.bt,
                mr = block.mr,
                smr = "" //backwards support
            }, Formatting.None);
            command.Parameters.AddWithValue("@height", (int)block.h);
            command.Parameters.AddWithValue("@hash", block.hash);
            command.Parameters.AddWithValue("@data", json);
            await command.ExecuteNonQueryAsync();
        }
    }

	//{"f":"pow","bt":1345448181,"mr":"1eb8484c8bbe78e9","smr":""}
	public class Blockdata
    {
        public string f { get; set; } = null!; //pow,pos
        public uint bt { get; set; }
        public string mr { get; set; } = null!;
        public string smr { get; set; } = "";//old field
	}


    public class TransactionRepository: DbRepostory
	{
        public TransactionRepository(AppSettings appSettings):base(appSettings)
		{
		}

		public class ToDataEx  
        {
            public Pub? scriptPubKey { get; set; }
		}

        public class TxDataEx
        {
            public uint pos { get; set; }
            public long t { get; set; }
            public long bh { get; set; }
            public long sz { get; set; }
            public long offst { get; set; }
		}

		public class Pub
        {
            public string? asm { get; set; }
            public string? hex { get; set; }
            public string? type { get; set; }
		}


        public async Task DeleteSpentOutputState(string hash, int indx)
		{
            await using var connection = await SetPragmas();
            
            var sql = @" UPDATE RawTo SET spent = 1 WHERE hash = @hash and idx = @indx ";
            var command = new SqliteCommand(sql, connection);
            command.Parameters.AddWithValue("@hash", hash);
            command.Parameters.AddWithValue("@indx", indx); 

            await command.ExecuteNonQueryAsync();
        }


        public async Task UpsertAddressTxo(string address, string txo, int indx)
        {
            await using var connection = await SetPragmas();

            const string sql = "INSERT OR REPLACE INTO AddressTxo (address, txo, idx) VALUES (@address, @txo, @indx)"; 
            var command = new SqliteCommand(sql, connection);
            command.Parameters.AddWithValue("@address", address);
            command.Parameters.AddWithValue("@txo", txo);
            command.Parameters.AddWithValue("@indx", indx);

            await command.ExecuteNonQueryAsync();
        }

        public async Task UpsertRawTo(string hash, int indx, long units, Pub scriptPubKey)
        {
            await using var connection = await SetPragmas();

            var hasoptreturn = !string.IsNullOrEmpty(scriptPubKey?.asm) && scriptPubKey.asm.StartsWith("OP_RETURN");
            var sql =
                @"INSERT OR REPLACE INTO RawTo (hash, idx, units, data, hasoptreturn) VALUES (@hash,@idx,@units,@data,@hasoptreturn)";
            var data = JsonConvert.SerializeObject(new ToDataEx { scriptPubKey = scriptPubKey });
            var command = new SqliteCommand(sql, connection);
            command.Parameters.AddWithValue("@hash", hash);
            command.Parameters.AddWithValue("@idx", indx);
            command.Parameters.AddWithValue("@units", units);
            command.Parameters.AddWithValue("@data", data);
            command.Parameters.AddWithValue("@hasoptreturn", hasoptreturn ? 1 : 0);

            await command.ExecuteNonQueryAsync();
        }

  
		public async Task UpsertRawTx(int height, uint time, uint index, string hash, long offset, uint rawsize)
        {
            await using var connection = await SetPragmas();

            var data = JsonConvert.SerializeObject(new TxDataEx
            {
                pos = index,
                t = time,
                bh = height,
                sz = rawsize,
                offst = offset
			});

            var sql = @" INSERT OR REPLACE INTO RawTx (hash, data, height) VALUES (@hash,@data,@height)";
            
            var command = new SqliteCommand(sql, connection);
            command.Parameters.AddWithValue("@hash", hash);
            command.Parameters.AddWithValue("@data", data);
            command.Parameters.AddWithValue("@height", height);

            await command.ExecuteNonQueryAsync();
		}        
	}
}
