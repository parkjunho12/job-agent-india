// Badge System Utility
// Defines all badges and provides helper functions

export const BADGES = {
    // Beginner badges
    FIRST_ANALYSIS: {
      id: 'first_analysis',
      name: 'First Analysis',
      description: 'Analyzed your first job',
      icon: '🎯',
      color: 'blue',
      requirement: (stats) => stats.totalAnalyses >= 1
    },
    
    ACTIVE_SEARCHER: {
      id: 'active_searcher',
      name: 'Active Searcher',
      description: 'Analyzed 5 jobs',
      icon: '🔍',
      color: 'green',
      requirement: (stats) => stats.totalAnalyses >= 5
    },
    
    ANALYSIS_PRO: {
      id: 'analysis_pro',
      name: 'Analysis Pro',
      description: 'Analyzed 20 jobs',
      icon: '⭐',
      color: 'yellow',
      requirement: (stats) => stats.totalAnalyses >= 20
    },
    
    ANALYSIS_MASTER: {
      id: 'analysis_master',
      name: 'Analysis Master',
      description: 'Analyzed 50 jobs',
      icon: '👑',
      color: 'purple',
      requirement: (stats) => stats.totalAnalyses >= 50
    },
    
    // Quality badges
    STRONG_MATCH_FINDER: {
      id: 'strong_match_finder',
      name: 'Match Finder',
      description: 'Found your first strong match (80%+)',
      icon: '🎯',
      color: 'green',
      requirement: (stats) => stats.strongMatches >= 1
    },
    
    MATCH_MASTER: {
      id: 'match_master',
      name: 'Match Master',
      description: 'Found 5 strong matches',
      icon: '🏆',
      color: 'yellow',
      requirement: (stats) => stats.strongMatches >= 5
    },
    
    PERFECTIONIST: {
      id: 'perfectionist',
      name: 'Perfectionist',
      description: 'Achieved 90%+ match score',
      icon: '💯',
      color: 'purple',
      requirement: (stats) => stats.bestMatch >= 90
    },
    
    // Streak badges
    WEEK_WARRIOR: {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: '7-day analysis streak',
      icon: '🔥',
      color: 'orange',
      requirement: (stats) => stats.currentStreak >= 7
    },
    
    MONTH_MASTER: {
      id: 'month_master',
      name: 'Month Master',
      description: '30-day analysis streak',
      icon: '🚀',
      color: 'red',
      requirement: (stats) => stats.currentStreak >= 30
    },
    
    // Time saver badges
    TIME_SAVER: {
      id: 'time_saver',
      name: 'Time Saver',
      description: 'Saved 10+ hours',
      icon: '⏰',
      color: 'blue',
      requirement: (stats) => stats.timeSaved >= 10
    },
    
    EFFICIENCY_EXPERT: {
      id: 'efficiency_expert',
      name: 'Efficiency Expert',
      description: 'Saved 50+ hours',
      icon: '⚡',
      color: 'yellow',
      requirement: (stats) => stats.timeSaved >= 50
    },
    
    // Application badges
    APPLICANT: {
      id: 'applicant',
      name: 'Applicant',
      description: 'Submitted first application',
      icon: '📝',
      color: 'green',
      requirement: (stats) => stats.applications >= 1
    },
    
    JOB_HUNTER: {
      id: 'job_hunter',
      name: 'Job Hunter',
      description: 'Submitted 10 applications',
      icon: '🎣',
      color: 'blue',
      requirement: (stats) => stats.applications >= 10
    }
  };
  
  // Calculate user stats from data
  export function calculateUserStats(analyses, applications) {
    const totalAnalyses = analyses ? analyses.length : 0;
    const strongMatches = analyses ? analyses.filter(a => (a.match_score || 0) >= 80).length : 0;
    const bestMatch = analyses && analyses.length > 0 
      ? Math.max(...analyses.map(a => a.match_score || 0))
      : 0;
    
    const currentStreak = calculateStreak(analyses);
    const timeSaved = analyses 
      ? analyses.filter(a => (a.match_score || 0) < 40).length * 2
      : 0;
    
    return {
      totalAnalyses,
      strongMatches,
      bestMatch,
      currentStreak,
      timeSaved,
      applications: applications ? applications.length : 0
    };
  }
  
  // Calculate current streak
  export function calculateStreak(analyses) {
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
  
  // Get earned badges
  export function getEarnedBadges(stats) {
    const earned = [];
    
    for (const [key, badge] of Object.entries(BADGES)) {
      if (badge.requirement(stats)) {
        earned.push(badge);
      }
    }
    
    return earned;
  }
  
  // Get next badges to unlock
  export function getNextBadges(stats) {
    const next = [];
    
    for (const [key, badge] of Object.entries(BADGES)) {
      if (!badge.requirement(stats)) {
        next.push({
          ...badge,
          progress: calculateProgress(badge, stats)
        });
      }
    }
    
    return next.sort((a, b) => b.progress - a.progress).slice(0, 3);
  }
  
  // Calculate progress towards badge
  function calculateProgress(badge, stats) {
    const id = badge.id.toLowerCase();
    
    // Analysis count badges
    if (id.includes('first_analysis')) {
      return Math.min((stats.totalAnalyses / 1) * 100, 99);
    }
    if (id.includes('active_searcher')) {
      return Math.min((stats.totalAnalyses / 5) * 100, 99);
    }
    if (id.includes('analysis_pro')) {
      return Math.min((stats.totalAnalyses / 20) * 100, 99);
    }
    if (id.includes('analysis_master')) {
      return Math.min((stats.totalAnalyses / 50) * 100, 99);
    }
    
    // Match badges
    if (id.includes('strong_match_finder')) {
      return Math.min((stats.strongMatches / 1) * 100, 99);
    }
    if (id.includes('match_master')) {
      return Math.min((stats.strongMatches / 5) * 100, 99);
    }
    if (id.includes('perfectionist')) {
      return Math.min((stats.bestMatch / 90) * 100, 99);
    }
    
    // Streak badges
    if (id.includes('week_warrior')) {
      return Math.min((stats.currentStreak / 7) * 100, 99);
    }
    if (id.includes('month_master')) {
      return Math.min((stats.currentStreak / 30) * 100, 99);
    }
    
    // Time saver badges
    if (id.includes('time_saver')) {
      return Math.min((stats.timeSaved / 10) * 100, 99);
    }
    if (id.includes('efficiency_expert')) {
      return Math.min((stats.timeSaved / 50) * 100, 99);
    }
    
    // Application badges
    if (id.includes('applicant')) {
      return Math.min((stats.applications / 1) * 100, 99);
    }
    if (id.includes('job_hunter')) {
      return Math.min((stats.applications / 10) * 100, 99);
    }
    
    return 0;
  }