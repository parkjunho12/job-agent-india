import { useState, useEffect } from 'react';
import { Award, TrendingUp, Clock, Target, Zap } from 'lucide-react';

export default function WeeklyReportCard({ analyses, jobs, applications }) {
  const [weeklyStats, setWeeklyStats] = useState(null);
  
  useEffect(() => {
    if (analyses && analyses.length > 0) {
      setWeeklyStats(calculateWeeklyStats(analyses, jobs, applications));
    }
  }, [analyses, jobs, applications]);
  
  if (!weeklyStats) {
    return (
      <div className="card">
        <h3 className="text-lg font-bold mb-2">📊 This Week's Performance</h3>
        <div className="text-center py-8">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No weekly data yet</p>
          <p className="text-sm text-gray-500">Start analyzing jobs to see your performance</p>
        </div>
      </div>
    );
  }
  
  const { grade, gradeColor, message } = getGradeInfo(weeklyStats);
  
  return (
    <div className={`card border-2 ${gradeColor.border} bg-gradient-to-br ${gradeColor.bg}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">📊 This Week's Performance</h3>
        
        <div className={`w-16 h-16 rounded-full ${gradeColor.badge} flex items-center justify-center shadow-lg`}>
          <span className="text-2xl font-bold text-white">{grade}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-primary-600" />
            <span className="text-xs text-gray-500">Analyzed</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{weeklyStats.analyzed}</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-500">Avg Match</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{weeklyStats.avgMatch}%</div>
          {weeklyStats.trend !== 0 && (
            <div className={`text-xs ${weeklyStats.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {weeklyStats.trend > 0 ? '+' : ''}{weeklyStats.trend}% vs last week
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-gray-500">Strong</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600">{weeklyStats.strongMatches}</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-gray-500">Time Saved</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{weeklyStats.timeSaved}h</div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full ${gradeColor.badge} flex items-center justify-center flex-shrink-0`}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">{message.title}</h4>
            <p className="text-sm text-gray-600">{message.description}</p>
          </div>
        </div>
      </div>
      
      {weeklyStats.nextGoal && (
        <div className="mt-3 text-sm text-gray-700 bg-white rounded-lg p-3 shadow-sm">
          <strong>Next Goal:</strong> {weeklyStats.nextGoal}
        </div>
      )}
    </div>
  );
}

function calculateWeeklyStats(analyses, jobs, applications) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  const thisWeek = analyses.filter(a => new Date(a.created_at) > oneWeekAgo);
  const lastWeek = analyses.filter(a => {
    const date = new Date(a.created_at);
    return date > twoWeeksAgo && date <= oneWeekAgo;
  });
  
  const analyzed = thisWeek.length;
  const avgMatch = analyzed > 0
    ? Math.round(thisWeek.reduce((sum, a) => sum + (a.match_score || 0), 0) / analyzed)
    : 0;
  
  const strongMatches = thisWeek.filter(a => (a.match_score || 0) >= 80).length;
  const timeSaved = thisWeek.filter(a => (a.match_score || 0) < 40).length * 2;
  
  const lastWeekAvg = lastWeek.length > 0
    ? Math.round(lastWeek.reduce((sum, a) => sum + (a.match_score || 0), 0) / lastWeek.length)
    : 0;
  
  const trend = lastWeekAvg > 0 ? avgMatch - lastWeekAvg : 0;
  
  let nextGoal = null;
  if (analyzed < 5) {
    nextGoal = `Analyze ${5 - analyzed} more jobs to unlock "Active Searcher" badge`;
  } else if (strongMatches === 0) {
    nextGoal = "Find your first strong match (80%+)";
  } else if (strongMatches < 3) {
    nextGoal = "Find 3 strong matches to unlock \"Match Master\" badge";
  }
  
  return { analyzed, avgMatch, strongMatches, timeSaved, trend, nextGoal };
}

function getGradeInfo(stats) {
  const score = (
    (stats.analyzed >= 5 ? 25 : stats.analyzed * 5) +
    (stats.avgMatch * 0.5) +
    (stats.strongMatches >= 3 ? 25 : stats.strongMatches * 8.33)
  );
  
  if (score >= 90) {
    return {
      grade: 'A+',
      gradeColor: {
        bg: 'from-green-50 to-emerald-50',
        border: 'border-green-300',
        badge: 'bg-gradient-to-r from-green-500 to-emerald-500'
      },
      message: {
        title: '🎉 Outstanding Performance!',
        description: 'You\'re crushing it this week! Keep up the excellent work.'
      }
    };
  } else if (score >= 80) {
    return {
      grade: 'A',
      gradeColor: {
        bg: 'from-green-50 to-green-100',
        border: 'border-green-300',
        badge: 'bg-green-500'
      },
      message: {
        title: '🌟 Great Work!',
        description: 'You\'re doing really well. Just a bit more to reach A+!'
      }
    };
  } else if (score >= 70) {
    return {
      grade: 'B+',
      gradeColor: {
        bg: 'from-blue-50 to-blue-100',
        border: 'border-blue-300',
        badge: 'bg-blue-500'
      },
      message: {
        title: '👍 Good Progress!',
        description: 'You\'re on the right track. Analyze a few more jobs!'
      }
    };
  } else if (score >= 60) {
    return {
      grade: 'B',
      gradeColor: {
        bg: 'from-yellow-50 to-yellow-100',
        border: 'border-yellow-300',
        badge: 'bg-yellow-500'
      },
      message: {
        title: '📈 Keep Going!',
        description: 'You\'re making progress. Try to find more strong matches.'
      }
    };
  } else if (score >= 50) {
    return {
      grade: 'C+',
      gradeColor: {
        bg: 'from-orange-50 to-orange-100',
        border: 'border-orange-300',
        badge: 'bg-orange-500'
      },
      message: {
        title: '💪 Room for Improvement',
        description: 'Analyze more jobs and focus on quality matches.'
      }
    };
  } else {
    return {
      grade: 'C',
      gradeColor: {
        bg: 'from-red-50 to-red-100',
        border: 'border-red-300',
        badge: 'bg-red-500'
      },
      message: {
        title: '🚀 Let\'s Get Started!',
        description: 'Time to ramp up! Analyze at least 5 jobs this week.'
      }
    };
  }
}