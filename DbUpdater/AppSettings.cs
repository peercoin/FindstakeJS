﻿using System;
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
        public string host { get; set; }
        public string user { get; set; }
        public string pass { get; set; }
        public int port { get; set; }
    }

    public class DbSettings
    {
        public string dbmetakey { get; set; }
        public string database { get; set; }
    }
}
