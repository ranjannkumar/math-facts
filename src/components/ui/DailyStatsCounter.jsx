import { useMathGameSelector } from '../../store/mathGameBridgeStore.js';

const DailyStatsCounter = ({ style }) => {
  const dailyCorrect = useMathGameSelector((ctx) => ctx.correctCount ?? 0);

  return (
    <div style={style}>
      <div className="w-full min-w-0 bg-blue-500 text-white font-bold rounded-lg sm:rounded-xl shadow-lg px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 flex items-center sm:min-w-[180px] md:min-w-[200px] min-h-[40px] sm:min-h-[50px] md:min-h-[60px]">
        <div className="mr-1 sm:mr-2 md:mr-3 text-lg sm:text-xl md:text-2xl">{'\u{1F4DD}'}</div>
        <div className="min-w-0">
          <div className="text-xs sm:text-xs md:text-sm opacity-80">Today's Score</div>
          <div className="text-sm sm:text-base md:text-lg lg:text-xl leading-tight">{dailyCorrect}</div>
        </div>
      </div>
    </div>
  );
};

export default DailyStatsCounter;
