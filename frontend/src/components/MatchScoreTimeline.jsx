import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MatchScoreTimeline({ analyses }) {
  const chartData = prepareChartData(analyses);
  const trend = calculateTrend(chartData);
  const average = calculateAverage(chartData);
  const best = chartData.length > 0 ? Math.max(...chartData.map(d => d.score)) : 0;
  
  if (chartData.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-bold mb-2">📈 Match Score Trend</h3>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-2">No analysis data yet</p>
          <p className="text-sm text-gray-500">Analyze jobs to see your match score trend</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">📈 Match Score Trend</h3>
        
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
          trend > 0 ? 'bg-green-100 text-green-700' : 
          trend < 0 ? 'bg-red-100 text-red-700' : 
          'bg-gray-100 text-gray-700'
        }`}>
          {trend > 0 ? (
            <>
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">+{trend}%</span>
            </>
          ) : trend < 0 ? (
            <>
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-semibold">{trend}%</span>
            </>
          ) : (
            <>
              <Minus className="w-4 h-4" />
              <span className="text-sm font-semibold">Stable</span>
            </>
          )}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          
          <YAxis 
            domain={[0, 100]}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Match %', angle: -90, position: 'insideLeft' }}
          />
          
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
            formatter={(value) => [`${Math.round(value)}%`, 'Match Score']}
          />
          
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="#7c3aed" 
            strokeWidth={3}
            fill="url(#colorScore)"
            dot={{ fill: '#7c3aed', r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{chartData.length}</div>
          <div className="text-xs text-gray-500">Analyses</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">{Math.round(average)}%</div>
          <div className="text-xs text-gray-500">Average</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{Math.round(best)}%</div>
          <div className="text-xs text-gray-500">Best</div>
        </div>
      </div>
    </div>
  );
}

function prepareChartData(analyses) {
  if (!analyses || analyses.length === 0) return [];
  
  const sorted = [...analyses]
    .filter(a => a.match_score != null)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  
  return sorted.map(analysis => ({
    date: new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: analysis.match_score || 0,
    title: analysis.jd_title || 'Job'
  }));
}

function calculateTrend(data) {
  if (data.length < 2) return 0;
  
  const recentCount = Math.min(3, data.length);
  const recent = data.slice(-recentCount);
  
  if (data.length < recentCount + 1) return 0;
  
  const previousCount = Math.min(3, data.length - recentCount);
  const previous = data.slice(-recentCount - previousCount, -recentCount);
  
  if (previous.length === 0) return 0;
  
  const recentAvg = recent.reduce((sum, d) => sum + d.score, 0) / recent.length;
  const previousAvg = previous.reduce((sum, d) => sum + d.score, 0) / previous.length;
  
  return Math.round(recentAvg - previousAvg);
}

function calculateAverage(data) {
  if (data.length === 0) return 0;
  return data.reduce((sum, d) => sum + d.score, 0) / data.length;
}