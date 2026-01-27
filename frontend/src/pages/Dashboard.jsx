import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { jobsApi, applicationsApi, experiencesApi, analysisApi } from '../services/api';
import { 
  TrendingUp, Briefcase, FileText, CheckCircle, Clock, 
  Zap, ArrowRight, Target, User, AlertCircle, Sparkles,
  Plus, ChevronRight, Calendar, Award, Loader2, RefreshCw
} from 'lucide-react';
import WelcomeModal from '../components/WelcomeModal';
import CVSetupWizard from '../components/CVSetupWizards';
import OnboardingChecklist from '../components/OnboardingChecklist';

/**
 * Dashboard - Analysis-First Version
 * 
 * Concept: Analysis (not Verdict)
 * - Analysis = CV-to-Job matching result
 * - Preview (free): match score, top fixes
 * - Full (premium): cover letter, interview Q&A, bullets
 * 
 * Features:
 * - Smart onboarding flow
 * - Analysis-centric metrics
 * - Recent analysis timeline
 * - Quick actions for analysis
 */
function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // ===================================
  // State Management
  // ===================================
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCVSetup, setShowCVSetup] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState('');
  
  // ===================================
  // Data Fetching
  // ===================================
  
  const { 
    data: jobsData, 
    isLoading: jobsLoading,
    refetch: refetchJobs 
  } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.list({ limit: 100 }),
    staleTime: 1000 * 60 * 5,
  });
  
  const { 
    data: applicationsData,
    isLoading: appsLoading 
  } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.list({ limit: 100 }),
    staleTime: 1000 * 60 * 5,
  });
  
  const { 
    data: experiencesData,
    isLoading: expLoading 
  } = useQuery({
    queryKey: ['experiences'],
    queryFn: () => experiencesApi.getAll(),
    staleTime: 1000 * 60 * 10,
  });
  
  // ✅ NEW: Analysis list (main data source)
  const {
    data: analysesData,
    isLoading: analysesLoading
  } = useQuery({
    queryKey: ['analyses'],
    queryFn: () => analysisApi.listAnalyses({ limit: 100 }),
    staleTime: 1000 * 60 * 5,
  });
  
  // ===================================
  // Computed Data
  // ===================================
  
  const jobs = jobsData?.data || [];
  const applications = applicationsData?.data || [];
  const experiences = experiencesData?.data || [];
  const analyses = analysesData || [];
  
  const hasExperience = experiences.length > 0;
  const isLoading = jobsLoading || appsLoading || expLoading || analysesLoading;
  
  // ✅ Analysis-based stats
  const stats = {
    totalJobs: jobs.length,
    totalApplications: applications.length,
    totalAnalyses: analyses.length,
    
    // Analysis quality metrics
    strongMatches: analyses.filter(a => 
      (a.match_score || 0) >= 80
    ).length,
    
    averageMatch: analyses.length > 0
      ? Math.round(
          analyses.reduce((sum, a) => sum + (a.match_score || 0), 0) / analyses.length
        )
      : 0,
    
    // Premium unlocked
    unlockedAnalyses: analyses.filter(a => a.is_unlocked).length,
    
    // Time estimation
    timeSaved: Math.round(
      analyses.filter(a => (a.match_score || 0) < 40).length * 2
    ),
    
    // Recent activity
    thisWeek: analyses.filter(a => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(a.created_at) > weekAgo;
    }).length,
  };
  
  // Recent items
  const recentJobs = jobs
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);
    
  const recentApplications = applications
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);
    
  const recentAnalyses = analyses
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);
  
  // ===================================
  // AI Insights
  // ===================================
  
  const getInsights = () => {
    const insights = [];
    
    // No experience
    if (!hasExperience) {
      insights.push({
        type: 'critical',
        icon: AlertCircle,
        title: 'Setup your profile to get started',
        description: 'Add your CV to receive accurate job match analysis',
        action: { label: 'Setup Now', onClick: () => setShowCVSetup(true) },
        color: 'yellow'
      });
    }
    
    // No jobs
    if (hasExperience && jobs.length === 0) {
      insights.push({
        type: 'info',
        icon: Briefcase,
        title: 'Add jobs to analyze',
        description: 'Save jobs you\'re interested in to get AI-powered match analysis',
        action: { label: 'Add Job', onClick: () => navigate('/jobs') },
        color: 'blue'
      });
    }
    
    // Jobs but no analyses
    if (jobs.length > 0 && analyses.length === 0 && hasExperience) {
      insights.push({
        type: 'tip',
        icon: Zap,
        title: 'Start analyzing your jobs',
        description: `You have ${jobs.length} saved jobs. Analyze them to see match scores!`,
        action: { label: 'Analyze Jobs', onClick: () => navigate('/analysis-history') },
        color: 'purple'
      });
    }
    
    // Many jobs, few analyzed
    if (jobs.length > 5 && analyses.length > 0 && analyses.length < jobs.length * 0.5) {
      insights.push({
        type: 'tip',
        icon: Target,
        title: 'Analyze more jobs',
        description: `${jobs.length - analyses.length} jobs pending analysis`,
        action: { label: 'Analyze More', onClick: () => navigate('/analysis-history') },
        color: 'purple'
      });
    }
    
    // Strong matches
    if (stats.strongMatches > 0) {
      insights.push({
        type: 'success',
        icon: Target,
        title: `🎯 ${stats.strongMatches} strong ${stats.strongMatches === 1 ? 'match' : 'matches'} found!`,
        description: 'You have excellent matches. Consider applying soon.',
        action: { label: 'View Analyses', onClick: () => navigate('/analysis-history') },
        color: 'green'
      });
    }
    
    // Time saved milestone
    if (stats.timeSaved >= 10) {
      insights.push({
        type: 'achievement',
        icon: Award,
        title: `🎉 You saved ${stats.timeSaved} hours!`,
        description: 'By skipping low-match jobs, you\'ve saved valuable time',
        color: 'green'
      });
    }
    
    return insights;
  };
  
  const insights = getInsights();
  
  // ===================================
  // Quick Actions
  // ===================================
  
  const getQuickActions = () => {
    const actions = [];
    
    // Priority: Setup profile
    if (!hasExperience) {
      actions.push({
        icon: User,
        title: 'Setup Profile',
        description: 'Add CV for analysis',
        badge: '⭐ Start Here',
        onClick: () => setShowCVSetup(true),
        color: 'primary',
        priority: 1
      });
    }
    
    // New analysis
    if (hasExperience) {
      const pendingCount = jobs.length - analyses.length;
      actions.push({
        icon: Sparkles,
        title: 'New Analysis',
        description: 'Analyze job match',
        badge: pendingCount > 0 ? `${pendingCount} pending` : null,
        onClick: () => navigate('/analysis-history'),
        color: 'purple',
        priority: 1
      });
    }
    
    // Add job
    actions.push({
      icon: Plus,
      title: 'Add Job',
      description: 'Save to analyze',
      onClick: () => navigate('/jobs'),
      color: 'blue',
      priority: 2
    });
    
    // View analyses
    if (analyses.length > 0) {
      actions.push({
        icon: Target,
        title: 'View Analyses',
        description: `${analyses.length} completed`,
        onClick: () => navigate('/analysis-history'),
        color: 'green',
        priority: 2
      });
    }
    
    // Applications
    if (applications.length > 0) {
      actions.push({
        icon: FileText,
        title: 'Applications',
        description: `${applications.length} total`,
        onClick: () => navigate('/applications'),
        color: 'orange',
        priority: 3
      });
    }
    
    // Manage profile
    actions.push({
      icon: User,
      title: 'Manage Profile',
      description: 'Update CV',
      onClick: () => navigate('/experiences'),
      color: 'gray',
      priority: 4
    });
    
    return actions.sort((a, b) => a.priority - b.priority).slice(0, 4);
  };
  
  const quickActions = getQuickActions();
  
  // ===================================
  // Effects
  // ===================================
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 18) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  }, []);
  
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('welcome_completed');
    const hasSetupCV = localStorage.getItem('cv_setup_completed');
    
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    } else if (!hasSetupCV && !hasExperience) {
      setShowCVSetup(true);
    }
  }, [hasExperience]);
  
  // ===================================
  // Handlers
  // ===================================
  
  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    localStorage.setItem('welcome_completed', 'true');
    
    const hasSetupCV = localStorage.getItem('cv_setup_completed');
    if (!hasSetupCV && !hasExperience) {
      setShowCVSetup(true);
    }
  };
  
  const handleWelcomeSkip = () => {
    setShowWelcome(false);
    localStorage.setItem('welcome_completed', 'true');
  };
  
  const handleCVSetupComplete = () => {
    setShowCVSetup(false);
    localStorage.setItem('cv_setup_completed', 'true');
    navigate('/jobs');
  };
  
  const handleCVSetupSkip = () => {
    setShowCVSetup(false);
    localStorage.setItem('cv_setup_completed', 'true');
  };
  
  // ===================================
  // Render Helpers
  // ===================================
  
  const getGreeting = () => {
    const greetings = {
      morning: '🌅 Good morning',
      afternoon: '☀️ Good afternoon',
      evening: '🌙 Good evening'
    };
    return greetings[timeOfDay] || 'Welcome back';
  };
  
  // ✅ NEW: Match score badge (replacing verdict)
  const getMatchBadge = (score) => {
    if (!score && score !== 0) {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
          Pending
        </span>
      );
    }
    
    const scoreNum = Math.round(score);
    let color = 'bg-gray-100 text-gray-700';
    let emoji = '📊';
    
    if (scoreNum >= 80) {
      color = 'bg-green-100 text-green-700';
      emoji = '🎯';
    } else if (scoreNum >= 60) {
      color = 'bg-blue-100 text-blue-700';
      emoji = '✅';
    } else if (scoreNum >= 40) {
      color = 'bg-orange-100 text-orange-700';
      emoji = '⚠️';
    } else {
      color = 'bg-red-100 text-red-700';
      emoji = '❌';
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
        {emoji} {scoreNum}%
      </span>
    );
  };
  
  // ===================================
  // Loading State
  // ===================================
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  // ===================================
  // Render
  // ===================================
  
  return (
    <>
      {/* Modals */}
      {showWelcome && (
        <WelcomeModal 
          onComplete={handleWelcomeComplete}
          onSkip={handleWelcomeSkip}
        />
      )}
      
      {showCVSetup && (
        <CVSetupWizard 
          onComplete={handleCVSetupComplete}
          onSkip={handleCVSetupSkip}
        />
      )}
      
      <div className="max-w-7xl mx-auto">
        {/* ===================================
            HEADER
            =================================== */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {getGreeting()}, {user?.full_name || 'User'}!
              </h1>
              <p className="text-gray-600">
                {hasExperience 
                  ? analyses.length > 0 
                    ? `You have ${analyses.length} job ${analyses.length === 1 ? 'analysis' : 'analyses'}` 
                    : "Let's analyze your first job match"
                  : "Let's get you started with your job search"
                }
              </p>
            </div>
            
            <button
              onClick={() => {
                refetchJobs();
                window.location.reload();
              }}
              className="btn btn-outline btn-sm self-start md:self-center"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
        
        {/* ===================================
            ONBOARDING
            =================================== */}
        <OnboardingChecklist />
        
        {/* ===================================
            INSIGHTS
            =================================== */}
        {insights.length > 0 && (
          <div className="mb-6 space-y-3">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              const colorClasses = {
                yellow: 'bg-yellow-50 border-yellow-300 text-yellow-900',
                blue: 'bg-blue-50 border-blue-300 text-blue-900',
                purple: 'bg-purple-50 border-purple-300 text-purple-900',
                green: 'bg-green-50 border-green-300 text-green-900',
              };
              
              return (
                <div 
                  key={index}
                  className={`border-2 rounded-xl p-6 ${colorClasses[insight.color]}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      insight.color === 'yellow' ? 'bg-yellow-100' :
                      insight.color === 'blue' ? 'bg-blue-100' :
                      insight.color === 'purple' ? 'bg-purple-100' :
                      'bg-green-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        insight.color === 'yellow' ? 'text-yellow-600' :
                        insight.color === 'blue' ? 'text-blue-600' :
                        insight.color === 'purple' ? 'text-purple-600' :
                        'text-green-600'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold mb-1">
                        {insight.title}
                      </h3>
                      <p className="text-sm opacity-90 mb-3">
                        {insight.description}
                      </p>
                      
                      {insight.action && (
                        <button
                          onClick={insight.action.onClick}
                          className={`btn btn-sm ${
                            insight.color === 'yellow' ? 'btn-warning' :
                            insight.color === 'blue' ? 'btn-primary' :
                            insight.color === 'purple' ? 'bg-purple-600 text-white hover:bg-purple-700' :
                            'btn-success'
                          }`}
                        >
                          {insight.action.label}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* ===================================
            STATS CARDS (Analysis-focused)
            =================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {/* Total Jobs */}
          <Link to="/jobs">
            <div className="card hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Saved</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalJobs}</h3>
              <p className="text-sm text-gray-600">Jobs Saved</p>
            </div>
          </Link>
          
          {/* Total Analyses */}
          <Link to="/analysis-history">
            <div className="card hover:shadow-lg transition-all hover:scale-105 cursor-pointer bg-gradient-to-br from-primary-50 to-purple-50 border-primary-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary-600" />
                </div>
                <span className="text-xs text-primary-600 font-medium uppercase tracking-wide">Analyzed</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalAnalyses}</h3>
              <p className="text-sm text-gray-700">
                Analyses
                {stats.averageMatch > 0 && (
                  <span className="ml-2 text-xs text-primary-600">
                    • Avg {stats.averageMatch}%
                  </span>
                )}
              </p>
            </div>
          </Link>
          
          {/* Strong Matches */}
          <Link to="/analysis-history">
            <div className="card hover:shadow-lg transition-all hover:scale-105 cursor-pointer bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-xs text-green-600 font-medium uppercase tracking-wide">Strong</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.strongMatches}</h3>
              <p className="text-sm text-gray-700">
                Strong Matches
                {stats.strongMatches > 0 && stats.totalAnalyses > 0 && (
                  <span className="ml-2 text-xs text-green-600">
                    • {Math.round((stats.strongMatches / stats.totalAnalyses) * 100)}% of total
                  </span>
                )}
              </p>
            </div>
          </Link>
          
          {/* Time Saved */}
          <div className="card hover:shadow-lg transition-all hover:scale-105 cursor-pointer bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-xs text-orange-600 font-medium uppercase tracking-wide">Saved</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.timeSaved}h</h3>
            <p className="text-sm text-gray-700">
              Time Saved
              {stats.thisWeek > 0 && (
                <span className="ml-2 text-xs text-orange-600">
                  • {stats.thisWeek} this week
                </span>
              )}
            </p>
          </div>
        </div>
        
        {/* ===================================
            QUICK ACTIONS
            =================================== */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-600" />
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const colorClasses = {
                primary: 'bg-primary-50 border-primary-300 hover:bg-primary-100',
                blue: 'bg-blue-50 border-blue-300 hover:bg-blue-100',
                purple: 'bg-purple-50 border-purple-300 hover:bg-purple-100',
                green: 'bg-green-50 border-green-300 hover:bg-green-100',
                orange: 'bg-orange-50 border-orange-300 hover:bg-orange-100',
                gray: 'bg-gray-50 border-gray-300 hover:bg-gray-100',
              };
              
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`card border-2 transition-all hover:scale-105 hover:shadow-lg cursor-pointer text-left ${colorClasses[action.color]}`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      action.color === 'primary' ? 'bg-primary-100' :
                      action.color === 'blue' ? 'bg-blue-100' :
                      action.color === 'purple' ? 'bg-purple-100' :
                      action.color === 'green' ? 'bg-green-100' :
                      action.color === 'orange' ? 'bg-orange-100' :
                      'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        action.color === 'primary' ? 'text-primary-600' :
                        action.color === 'blue' ? 'text-blue-600' :
                        action.color === 'purple' ? 'text-purple-600' :
                        action.color === 'green' ? 'text-green-600' :
                        action.color === 'orange' ? 'text-orange-600' :
                        'text-gray-600'
                      }`} />
                    </div>
                    
                    {action.badge && (
                      <span className="px-2 py-1 bg-white rounded-full text-xs font-bold">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {action.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* ===================================
            RECENT ACTIVITY
            =================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Jobs */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Recent Jobs
              </h2>
              <Link 
                to="/jobs" 
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            {recentJobs.length > 0 ? (
              <div className="space-y-2">
                {recentJobs.map(job => {
                  // Find matching analysis
                  const analysis = analyses.find(a => a.job_id === job.id);
                  
                  return (
                    <Link 
                      key={job.id} 
                      to={analysis ? `/analysis-history/${analysis.id}` : `/jobs/${job.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate mb-1">
                            {job.title}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {job.company}
                          </p>
                          {job.location && (
                            <p className="text-xs text-gray-500 mt-1">
                              📍 {job.location}
                            </p>
                          )}
                        </div>
                        
                        {analysis ? (
                          getMatchBadge(analysis.match_score)
                        ) : (
                          <Link
                            to="/analysis-history"
                            className="px-2 py-1 bg-primary-100 text-primary-600 rounded-full text-xs font-semibold hover:bg-primary-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Analyze
                          </Link>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No saved jobs yet</p>
                <Link to="/jobs" className="btn btn-primary btn-sm">
                  <Plus className="w-4 h-4" />
                  Add Your First Job
                </Link>
              </div>
            )}
          </div>
          
          {/* Recent Analyses */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-600" />
                Recent Analyses
              </h2>
              <Link 
                to="/analysis-history" 
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            {recentAnalyses.length > 0 ? (
              <div className="space-y-2">
                {recentAnalyses.map(analysis => (
                  <Link
                    key={analysis.id}
                    to={`/analysis-history/${analysis.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate mb-1">
                          {analysis.jd_title || 'Job Analysis'}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {analysis.jd_company || 'Company'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {getMatchBadge(analysis.match_score)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No analyses yet</p>
                {hasExperience ? (
                  <Link to="/analysis-history" className="btn btn-primary btn-sm">
                    <Sparkles className="w-4 h-4" />
                    Start Analyzing
                  </Link>
                ) : (
                  <button 
                    onClick={() => setShowCVSetup(true)}
                    className="btn btn-primary btn-sm"
                  >
                    <User className="w-4 h-4" />
                    Setup Profile First
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;