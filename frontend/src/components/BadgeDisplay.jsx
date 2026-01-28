import { Award, Lock } from 'lucide-react';
import { calculateUserStats, getEarnedBadges, getNextBadges } from '../utils/badges';

export default function BadgeDisplay({ analyses, applications }) {
  const stats = calculateUserStats(analyses, applications);
  const earnedBadges = getEarnedBadges(stats);
  const nextBadges = getNextBadges(stats);
  
  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-yellow-500" />
        Your Achievements
      </h3>
      
      {/* Earned badges */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Unlocked ({earnedBadges.length})
        </h4>
        
        {earnedBadges.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {earnedBadges.map(badge => (
              <div 
                key={badge.id}
                className={`p-3 rounded-lg border-2 bg-${badge.color}-50 border-${badge.color}-300 text-center hover:scale-105 transition-transform cursor-pointer`}
                title={badge.description}
              >
                <div className="text-3xl mb-1">{badge.icon}</div>
                <div className="text-xs font-semibold text-gray-900">
                  {badge.name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm">No badges yet. Start analyzing!</p>
          </div>
        )}
      </div>
      
      {/* Next badges */}
      {nextBadges.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Next to Unlock
          </h4>
          
          <div className="space-y-3">
            {nextBadges.map(badge => (
              <div 
                key={badge.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 relative">
                  <div className="text-2xl opacity-30">{badge.icon}</div>
                  <Lock className="w-4 h-4 text-gray-500 absolute top-1 right-1" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 mb-1">
                    {badge.name}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    {badge.description}
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`bg-${badge.color}-500 h-2 rounded-full transition-all`}
                      style={{ width: `${badge.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(badge.progress)}% complete
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}