import { Flame } from 'lucide-react';

export default function StreakTracker({ analyses }) {
  const streak = calculateStreak(analyses);
  const last7Days = getLast7Days();
  const activityMap = getActivityMap(analyses);
  
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Analysis Streak
        </h3>
        
        {streak > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 rounded-full">
            <Flame className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-bold text-orange-600">
              {streak} {streak === 1 ? 'day' : 'days'}
            </span>
          </div>
        )}
      </div>
      
      {/* Calendar view */}
      <div className="flex justify-between gap-1">
        {last7Days.map((date, index) => {
          const dateStr = date.toISOString().split('T')[0];
          const hasActivity = activityMap[dateStr] || false;
          const isToday = index === last7Days.length - 1;
          
          return (
            <div key={index} className="flex-1 text-center">
              <div className={`w-full aspect-square rounded-lg flex items-center justify-center mb-1 ${
                hasActivity 
                  ? 'bg-orange-500' 
                  : 'bg-gray-200'
              }`}>
                {hasActivity && (
                  <Flame className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="text-xs text-gray-500">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              {isToday && (
                <div className="text-xs text-gray-400">Today</div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Motivation message */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
        <p className="text-sm text-gray-700">
          {streak === 0 ? (
            "Start your streak today! 🚀"
          ) : streak < 7 ? (
            <>Keep going! <strong>{7 - streak} more days</strong> to unlock "Week Warrior" 🏆</>
          ) : streak < 30 ? (
            <>Amazing! <strong>{30 - streak} more days</strong> to "Month Master" 👑</>
          ) : (
            "Incredible! You're a legend! 🌟"
          )}
        </p>
      </div>
    </div>
  );
}

// Helpers
function calculateStreak(analyses) {
  if (!analyses || analyses.length === 0) return 0;
  
  const sorted = [...analyses].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const analysis of sorted) {
    const analysisDate = new Date(analysis.created_at);
    analysisDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((currentDate - analysisDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === streak) {
      streak++;
    } else if (daysDiff > streak) {
      break;
    }
  }
  
  return streak;
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    days.push(date);
  }
  return days;
}

function getActivityMap(analyses) {
  const map = {};
  
  if (!analyses) return map;
  
  analyses.forEach(analysis => {
    const date = new Date(analysis.created_at);
    const dateStr = date.toISOString().split('T')[0];
    map[dateStr] = true;
  });
  
  return map;
}