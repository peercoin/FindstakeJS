using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace SQLiteUpdater
{
    public delegate Task JobAction(CancellationToken cancellationToken);

    public class JobScheduler : IDisposable
    {
        private readonly JobAction jobAction;
        private readonly CancellationTokenSource cancellationTokenSource = new CancellationTokenSource();
        private TimeSpan[] orderedStartTimes = Array.Empty<TimeSpan>();
        private Timer timer;
      
        private readonly object statusLock = new object();
        private bool running;
        private readonly StringBuilder lastRunLog = new StringBuilder();
        
        public JobScheduler(JobAction jobAction)
        {
            this.jobAction = jobAction;
        }
        
        public void Dispose()
        {
            GC.SuppressFinalize(this);

            cancellationTokenSource.Cancel();
            timer?.Dispose();
        }
        
        public void Start(IEnumerable<TimeSpan> startTimes)
        {
            orderedStartTimes = startTimes.OrderBy(t => t.Hours).ToArray();

            if (orderedStartTimes.Length == 0)
            {
                timer?.Dispose();
                timer = null;
                return;
            }

            timer ??= new Timer(_ => OnTimer());

            UpdateTimer();
        }
         

        private void UpdateTimer()
        {
            if (timer == null) return;

            var localNow = DateTime.Now;
            var startOfDay = localNow.Subtract(localNow.TimeOfDay);

            var startTime = orderedStartTimes
                .Cast<TimeSpan?>()
                .FirstOrDefault(t => localNow.TimeOfDay < t);

            if (!startTime.HasValue)
            { 
                startOfDay = startOfDay.AddDays(1);
                startTime = orderedStartTimes.First();
            }

            var startDateTime = startOfDay.Add(startTime.Value);
            var timeRemaining = startDateTime - localNow;
            
            timer.Change(timeRemaining, Timeout.InfiniteTimeSpan);
        }


        private void OnTimer()
        {
            if (running) return;

            try
            {
                lock (statusLock)
                {
                    running = true;
                    lastRunLog.Clear();
                }

                Task.Run(() => jobAction(cancellationTokenSource.Token)).GetAwaiter().GetResult();
            }
            catch (OperationCanceledException)
            {
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                Console.WriteLine(e.ToString());
               
            }
            finally
            {
                lock (statusLock)
                {
                    running = false;
                }
                UpdateTimer();
            }
        }
    }

}
