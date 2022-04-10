using System;
using System.Collections.Generic;

namespace SQLiteUpdater
{
    public class AppSettings
    {
        public List<TimeSpan> syncTime { get; set; } = null!;
        public DbSettings db { get; set; } = null!;
        
        public RpcSettings rpc { get; set; } = null!;
    }

    public class RpcSettings
    {
        public string host { get; set; } = null!;
        public string user { get; set; } = null!;
        public string pass { get; set; } = null!;
        public int port { get; set; }
    }

    public class DbSettings
    {
        public string dbmetakey { get; set; } = null!;
        public string database { get; set; } = null!;
    }
}
