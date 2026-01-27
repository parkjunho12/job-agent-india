import { Check, ArrowRight, Zap, Menu, X, Download, Star, FileText, MessageSquare, TrendingUp, Target } from 'lucide-react'
import { useState } from 'react'

function Landing2() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">J</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Job Agent</span>
              </a>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#demo" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Try Demo
              </a>
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Pricing
              </a>
              <button className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all">
                Get Started Free
              </button>
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col gap-4">
                <a href="#demo" className="text-gray-600 hover:text-gray-900 font-medium" onClick={() => setMobileMenuOpen(false)}>Try Demo</a>
                <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
                <button className="px-6 py-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg font-semibold">
                  Get Started Free
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-4 pt-16 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 via-white to-white -z-10"></div>
        
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold mb-6 animate-bounce">
              🎯 For International Students & Career Switchers
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Don't Know What to land
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600">
                Your Dream Job?
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              AI analyzes your CV against any job posting and tells you <span className="font-semibold text-gray-900">exactly what to change</span> in 30 seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button className="px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center gap-2 w-full sm:w-auto">
                Start Free - 3 Analyses
                <ArrowRight className="w-5 h-5" />
              </button>
              <a href="#demo" className="text-gray-600 hover:text-gray-900 font-medium inline-flex items-center gap-2">
                or try the demo below
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                30-second results
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Works globally
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto mb-16">
            <div className="text-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-primary-600 mb-1">78%</div>
              <div className="text-sm text-gray-600">Avg Match Score</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-primary-600 mb-1">30s</div>
              <div className="text-sm text-gray-600">Analysis Time</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-primary-600 mb-1">$2</div>
              <div className="text-sm text-gray-600">Per Full Analysis</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo - PRIORITY #1 */}
      <section id="demo" className="py-20 bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
              ⚡ Try It Now - No Signup Required
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              See the Full Experience
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Click "Analyze Match" to see the free preview, then "Unlock" to see the complete analysis with rewritten bullets, cover letter, and interview prep.
            </p>
          </div>

          <FullDemoCard />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Land the Job
            </h2>
            <p className="text-xl text-gray-600">
              AI-powered tools that actually help you get hired
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Target className="w-8 h-8" />}
              title="Instant Match Score"
              description="See exactly how well you fit the role in seconds. No guessing, just data."
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Rewritten Bullets"
              description="AI rewrites your resume bullets to highlight impact and match role keywords."
            />
            <FeatureCard
              icon={<FileText className="w-8 h-8" />}
              title="Custom Cover Letters"
              description="Get a complete, tailored cover letter that connects your experience to the role."
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8" />}
              title="Interview Prep"
              description="Practice 10 role-specific interview questions with suggested answers."
            />
            <FeatureCard
              icon={<Star className="w-8 h-8" />}
              title="Gap Analysis"
              description="See which skills you're missing and how to position what you have."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="30-Second Results"
              description="No waiting. Paste your job and CV, get your verdict instantly."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Try 3 analyses free. Unlock full details for $2 per job.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-lg">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-5xl font-bold text-gray-900 mb-2">$0</div>
                <p className="text-gray-600">3 analyses included</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <PricingFeature text="Match score (e.g., 85%)" />
                <PricingFeature text="Rejection risk verdict" />
                <PricingFeature text="Top 3 specific fixes" />
                <PricingFeature text="Cover letter preview (first 3 sentences)" />
              </ul>

              <button className="w-full py-3 border-2 border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-900 hover:text-white transition-all">
                Start Free
              </button>
            </div>

            <div className="bg-white border-2 border-primary-600 rounded-2xl p-8 shadow-xl relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                BEST VALUE
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Full Analysis</h3>
                <div className="text-5xl font-bold text-gray-900 mb-2">$2</div>
                <p className="text-gray-600">Per job analysis</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <PricingFeature text="Everything in Free" />
                <PricingFeature text="All bullets rewritten (8 total)" highlighted />
                <PricingFeature text="Complete cover letter (4 paragraphs)" highlighted />
                <PricingFeature text="Interview Q&A (10 questions)" highlighted />
                <PricingFeature text="Detailed gap analysis" highlighted />
                <PricingFeature text="Export PDF" highlighted />
              </ul>

              <button className="w-full py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-xl hover:scale-105 transition-all">
                Try Free First
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Example */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              See the Transformation
            </h2>
            <p className="text-xl text-gray-600">
              Real example of how AI rewrites your bullets
            </p>
          </div>

          <BeforeAfterExample />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Stop Guessing. Start Knowing.
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Get your first 3 analyses free. See results in 30 seconds.
          </p>
          <button className="px-10 py-5 bg-white text-primary-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center gap-2">
            Start Free Now
            <ArrowRight className="w-6 h-6" />
          </button>
          <p className="text-white/80 mt-6 text-sm">
            No credit card • 3 free analyses • Results in 30 seconds
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">J</span>
                </div>
                <span className="text-xl font-bold text-white">Job Agent</span>
              </div>
              <p className="text-sm text-gray-400">
                AI-powered job matching that tells you exactly what to change for each application.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#pricing" className="text-sm hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#demo" className="text-sm hover:text-white transition-colors">Try Demo</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="/terms" className="text-sm hover:text-white transition-colors">Terms of Use</a></li>
                <li><a href="/privacy" className="text-sm hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-sm text-gray-400 text-center">
              Copyright © 2026 Overthink, LLC. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ============================================
// Full Demo Card with 3-Step Flow
// ============================================

function FullDemoCard() {
  const [step, setStep] = useState(0) // 0: input, 1: free result, 2: unlocked
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)

  const handleAnalyze = () => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      setStep(1)
    }, 2000)
  }

  const handleUnlock = () => {
    setIsUnlocking(true)
    setTimeout(() => {
      setIsUnlocking(false)
      setStep(2)
    }, 1500)
  }

  const handleReset = () => {
    setStep(0)
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-2xl overflow-hidden max-w-5xl mx-auto">
      {/* Progress Indicator */}
      <div className="bg-gray-50 px-8 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <StepIndicator number="1" label="Input" active={step === 0} completed={step > 0} />
          <div className="flex-1 h-0.5 bg-gray-300 mx-2">
            <div className={`h-full bg-primary-600 transition-all duration-500 ${step > 0 ? 'w-full' : 'w-0'}`}></div>
          </div>
          <StepIndicator number="2" label="Free Preview" active={step === 1} completed={step > 1} />
          <div className="flex-1 h-0.5 bg-gray-300 mx-2">
            <div className={`h-full bg-primary-600 transition-all duration-500 ${step > 1 ? 'w-full' : 'w-0'}`}></div>
          </div>
          <StepIndicator number="3" label="Full Analysis" active={step === 2} completed={false} />
        </div>
      </div>

      {/* Step 0: Input */}
      {step === 0 && (
        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Job Description
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 border border-gray-200 h-64 overflow-y-auto">
                <p className="font-semibold mb-2">Senior Product Manager</p>
                <p className="text-xs text-gray-600 mb-3">Google • London, UK • Full-time</p>
                <p className="mb-3">
                  We're looking for an experienced Product Manager to lead our growth team and drive user acquisition strategies.
                </p>
                <p className="mb-2"><strong>Requirements:</strong></p>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>5+ years PM experience</li>
                  <li>Data-driven decision making</li>
                  <li>Cross-functional collaboration</li>
                  <li>Stakeholder management</li>
                  <li>Agile methodology experience</li>
                  <li>Strong analytical skills</li>
                </ul>
                <p className="mb-2"><strong>Nice to have:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>B2B SaaS experience</li>
                  <li>SQL knowledge</li>
                  <li>Growth hacking background</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">📄</span>
                Your Resume
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 border border-gray-200 h-64 overflow-y-auto">
                <p className="font-semibold mb-2">Product Manager</p>
                <p className="text-xs text-gray-600 mb-3">Tech Startup • 2019 - Present</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Managed team and delivered project on time</li>
                  <li>Worked with stakeholders to improve product</li>
                  <li>Used data to make decisions</li>
                  <li>Led sprint planning and retrospectives</li>
                  <li>Collaborated with engineering team</li>
                  <li>Helped grow user base</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing Match...
              </>
            ) : (
              <>
                <Zap className="w-6 h-6" />
                Analyze Match
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 1: Free Result */}
      {step === 1 && (
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full mb-4 font-semibold">
              <Check className="w-5 h-5" />
              Analysis Complete
            </div>
          </div>

          {/* Score Circle */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                <circle
                  cx="96" cy="96" r="88"
                  stroke="url(#freeGradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${78 * 5.53} 553`}
                  strokeLinecap="round"
                  className="animate-[dash_1s_ease-out]"
                />
                <defs>
                  <linearGradient id="freeGradient">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-gray-900">78%</span>
                <span className="text-sm text-gray-600">Match</span>
              </div>
            </div>
          </div>

          {/* Verdict */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold text-lg shadow-lg">
              <Check className="w-6 h-6" />
              Good Match - Apply!
            </div>
          </div>

          {/* Top 3 Fixes (Free) */}
          <div className="mb-8">
            <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">
              🎯 Top 3 Fixes <span className="text-green-600">(Free)</span>
            </h4>
            
            <div className="space-y-3">
              <FixCard
                number="1"
                title="Add specific numbers and impact metrics"
                example='Change "Managed team" → "Led 5-person team to deliver $2M revenue feature"'
              />
              <FixCard
                number="2"
                title='Match missing keyword: "cross-functional"'
                example='Add "Collaborated with cross-functional teams (Engineering, Design, Sales)"'
              />
              <FixCard
                number="3"
                title="Quantify your achievements"
                example='Include metrics like "increased engagement by 40%, reduced churn by 15%"'
              />
            </div>
          </div>

          {/* Cover Letter Preview (First 3 sentences) */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Cover Letter Preview <span className="text-green-600 text-sm">(Free)</span>
            </h4>
            <div className="text-sm text-gray-700 space-y-2">
              <p>Dear Hiring Manager,</p>
              <p>
                I am writing to express my strong interest in the Senior Product Manager position at Google. 
                With over 5 years of product management experience in fast-paced startup environments, 
                I have developed a proven track record of leading cross-functional teams to deliver 
                high-impact products that drive user growth and revenue.
              </p>
              <p>My experience aligns perfectly with your requirements for data-driven decision making...</p>
              
              <div className="relative mt-4 pt-4 border-t border-gray-300">
                <div className="blur-sm select-none text-gray-400">
                  <p>In my current role at Tech Startup, I have successfully managed...</p>
                  <p>I am particularly excited about Google's mission to...</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/95 backdrop-blur px-4 py-2 rounded-lg border-2 border-primary-600">
                    <p className="text-xs text-gray-600 font-semibold">🔒 Unlock to read full letter</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Unlock Prompt */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-300 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl">🔓</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-2 text-lg">Unlock Full Analysis - $2</h4>
                <p className="text-sm text-gray-700 mb-4">
                  Get everything you need to perfect this application
                </p>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary-600" />
                    <span>All 8 bullets rewritten</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary-600" />
                    <span>Complete cover letter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary-600" />
                    <span>10 interview Q&As</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary-600" />
                    <span>Detailed gap analysis</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleUnlock}
              disabled={isUnlocking}
              className="w-full py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUnlocking ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Unlocking...
                </>
              ) : (
                <>
                  <span>Unlock Full Analysis - $2</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            Try Another Job
          </button>
        </div>
      )}

      {/* Step 2: Unlocked Full Analysis */}
      {step === 2 && (
        <div className="p-8 max-h-[800px] overflow-y-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full mb-4 font-semibold">
              <Check className="w-5 h-5" />
              Full Analysis Unlocked
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Complete Job Match Report</h3>
          </div>

          {/* Rewritten Bullets */}
          <div className="mb-8">
            <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              Rewritten Resume Bullets
            </h4>
            <div className="space-y-4">
              <RewrittenBullet
                original="Managed team and delivered project on time"
                rewritten="Led 5-person cross-functional team to deliver $2M revenue feature 2 weeks ahead of schedule, increasing user engagement by 40%"
              />
              <RewrittenBullet
                original="Worked with stakeholders to improve product"
                rewritten="Collaborated with stakeholders across Product, Engineering, Design, and Sales to launch customer feedback system, reducing churn by 15% and improving NPS score from 42 to 67"
              />
              <RewrittenBullet
                original="Used data to make decisions"
                rewritten="Leveraged SQL and analytics tools to analyze user behavior data across 500K+ monthly active users, driving data-informed product decisions that increased conversion rate by 25%"
              />
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">+ 5 more rewritten bullets</p>
              </div>
            </div>
          </div>

          {/* Full Cover Letter */}
          <div className="mb-8">
            <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-500" />
              Complete Cover Letter
            </h4>
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 text-sm text-gray-700 space-y-3">
              <p>Dear Hiring Manager,</p>
              <p>
                I am writing to express my strong interest in the Senior Product Manager position at Google. 
                With over 5 years of product management experience leading cross-functional teams in fast-paced 
                startup environments, I have developed a proven track record of delivering high-impact products 
                that drive both user growth and revenue.
              </p>
              <p>
                In my current role at Tech Startup, I have successfully managed the full product lifecycle 
                for our core platform, leading a team of 5 across Engineering, Design, and Analytics. 
                Most recently, I spearheaded the development of a $2M revenue feature that increased user 
                engagement by 40% and was delivered 2 weeks ahead of schedule.
              </p>
              <p>
                What excites me most about this opportunity at Google is the chance to work on products that 
                impact millions of users globally. Your focus on data-driven decision making and cross-functional 
                collaboration aligns perfectly with my approach to product management.
              </p>
              <p>
                I am particularly drawn to Google's culture of innovation and would love to bring my experience 
                in agile methodologies, stakeholder management, and growth strategies to your team.
              </p>
              <p>Thank you for considering my application. I look forward to the opportunity to discuss how 
              I can contribute to Google's continued success.</p>
              <p>Best regards,<br />[Your Name]</p>
            </div>
          </div>

          {/* Interview Q&A */}
          <div className="mb-8">
            <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-green-500" />
              Interview Questions & Answers
            </h4>
            <div className="space-y-4">
              <InterviewQA
                question="Tell me about a time when you had to make a difficult product decision with limited data."
                answer="At Tech Startup, I faced this when deciding whether to build Feature X or Y with only 2 weeks of user feedback. I created a rapid experimentation framework, ran A/B tests with 1,000 beta users, and used qualitative interviews to supplement quantitative data. This approach led to choosing Feature Y, which ultimately increased engagement by 40%."
              />
              <InterviewQA
                question="How do you handle stakeholder disagreements about product priorities?"
                answer="I use a data-driven prioritization framework. When stakeholders disagreed on our roadmap, I facilitated a workshop where we scored each feature on impact vs. effort, aligned on success metrics, and used customer data to inform decisions. This collaborative approach resulted in buy-in from all teams."
              />
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">+ 8 more interview questions with answers</p>
              </div>
            </div>
          </div>

          {/* Gap Analysis */}
          <div className="mb-8">
            <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-500" />
              Detailed Gap Analysis
            </h4>
            <div className="space-y-4">
              <GapItem
                title="Strong Matches (8/10 requirements)"
                items={[
                  "Product management experience (5+ years)",
                  "Cross-functional collaboration",
                  "Data-driven decision making",
                  "Stakeholder management",
                  "Agile methodology"
                ]}
                type="success"
              />
              <GapItem
                title="Missing Skills (2 nice-to-haves)"
                items={[
                  "B2B SaaS experience - Consider highlighting if you have any B2B exposure",
                  "SQL knowledge - Mention if you've worked with data teams or analytics tools"
                ]}
                type="warning"
              />
              <GapItem
                title="Action Plan"
                items={[
                  "Add SQL/analytics tools to skills section",
                  "Emphasize any B2B or enterprise customer experience",
                  "Highlight data analysis projects in bullet points",
                  "Mention specific tools (e.g., Mixpanel, Amplitude, SQL)"
                ]}
                type="info"
              />
            </div>
          </div>

          {/* Export Button */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Export Your Report</h4>
                <p className="text-sm text-gray-600">Download as PDF to use in your application</p>
              </div>
              <button className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-all flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download PDF
              </button>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            Analyze Another Job
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================
// Helper Components
// ============================================

function StepIndicator({ number, label, active, completed }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
        completed ? 'bg-green-500 text-white' :
        active ? 'bg-primary-600 text-white' :
        'bg-gray-200 text-gray-500'
      }`}>
        {completed ? <Check className="w-5 h-5" /> : number}
      </div>
      <span className={`text-xs mt-2 font-medium ${active ? 'text-gray-900' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  )
}

function FixCard({ number, title, example }) {
  return (
    <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
      <div className="flex items-start gap-3">
        <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
          {number}
        </span>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 mb-2">{title}</p>
          <p className="text-sm text-gray-600 italic">"{example}"</p>
        </div>
      </div>
    </div>
  )
}

function RewrittenBullet({ original, rewritten }) {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">
            ✕
          </div>
          <span className="text-xs font-semibold text-gray-500 uppercase">Original</span>
        </div>
        <p className="text-sm text-gray-700">{original}</p>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
            ✓
          </div>
          <span className="text-xs font-semibold text-green-600 uppercase">AI Rewrite</span>
        </div>
        <p className="text-sm text-gray-900 font-medium">{rewritten}</p>
      </div>
    </div>
  )
}

function InterviewQA({ question, answer }) {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
      <p className="font-semibold text-gray-900 mb-2">Q: {question}</p>
      <p className="text-sm text-gray-700 pl-4 border-l-2 border-primary-600">{answer}</p>
    </div>
  )
}

function GapItem({ title, items, type }) {
  const colors = {
    success: 'bg-green-50 border-green-200',
    warning: 'bg-orange-50 border-orange-200',
    info: 'bg-blue-50 border-blue-200'
  }

  return (
    <div className={`rounded-lg p-4 border-2 ${colors[type]}`}>
      <h5 className="font-semibold text-gray-900 mb-3">{title}</h5>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className={`${
              type === 'success' ? 'text-green-600' :
              type === 'warning' ? 'text-orange-600' :
              'text-blue-600'
            }`}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-primary-600 transition-all group">
      <div className="text-primary-600 mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function PricingFeature({ text, highlighted }) {
  return (
    <li className="flex items-center gap-3">
      <Check className={`w-5 h-5 flex-shrink-0 ${highlighted ? 'text-primary-600' : 'text-gray-400'}`} />
      <span className={highlighted ? 'font-semibold text-gray-900' : 'text-gray-600'}>{text}</span>
    </li>
  )
}

function BeforeAfterExample() {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-lg">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold">
              ✕
            </div>
            <span className="font-semibold text-gray-900">Your Original</span>
          </div>
          
          <div className="space-y-3 text-sm text-gray-700 mb-4">
            <p>• Managed team and delivered project on time</p>
            <p>• Worked with stakeholders to improve product</p>
          </div>

          <div className="p-3 bg-red-100 rounded-lg">
            <p className="text-xs text-red-700">
              <strong>Problems:</strong> Too vague, no numbers, missing keywords
            </p>
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <span className="font-semibold text-gray-900">AI Rewrite</span>
          </div>
          
          <div className="space-y-3 text-sm text-gray-700 mb-4">
            <p>• Led 5-person engineering team to deliver $2M revenue feature 2 weeks ahead of schedule, increasing user engagement by 40%</p>
            <p>• Collaborated with cross-functional stakeholders (Product, Design, Sales) to launch customer feedback system, reducing churn by 15%</p>
          </div>

          <div className="p-3 bg-green-100 rounded-lg">
            <p className="text-xs text-green-700">
              <strong>Fixed:</strong> Added numbers, impact, keywords, specifics
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing2