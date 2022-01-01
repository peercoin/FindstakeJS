using System;

namespace SQLiteUpdater
{
    public static class PeercoinConstants
    {
        public static readonly Int64 BlockHeaderSize = 80;
        public static readonly Int64 StakeMinAge = 2592000; // time to wait after stake
        public static readonly Int64 Coin = 1000000; //	1 PPC = 1.000 mPPC			
        public static readonly byte NetworkVersion = 0x37;
        public static readonly Int64 Day = 60 * 60 * 24;
        public static readonly Int64 StakeMaxAge = 90 * Day;
        public static readonly Int64 CoinDay = Coin * Day;
        public static readonly Int64 Findstakelimit = StakeMinAge - 761920;
        public static readonly Int64 ProtocolV10SwitchTime = 1635768000; // Mon  1 Nov 12:00:00 UTC 2021
    }
}
