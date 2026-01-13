import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle, TrendingUp, Target, Zap, Shield, ArrowRight, Star, X, Check } from 'lucide-react'

function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Problem-focused */}
      <section className="relative bg-gradient-to-br from-red-50 via-white to-orange-50 pt-20 pb-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Problem Statement - FEAR */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 border border-red-300 rounded-full text-red-800 text-sm font-medium mb-6">
              <AlertCircle className="w-4 h-4" />
              Applying to jobs you'll never get?
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Stop Wasting Time on<br />
              <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Jobs That Will Reject You
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              AI tells you <strong>which jobs to apply to</strong> - BEFORE you waste hours on applications.<br />
              Know your chances in 30 seconds.
            </p>
            
            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link to="/register" className="btn btn-primary btn-lg group">
                Analyze Your First Job Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link to="/login" className="btn btn-secondary btn-lg">
                I Have an Account
              </Link>
            </div>
            
            {/* Social Proof */}
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>3 free analyses</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Problem Visualization */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            The Truth About Job Applications
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Current Problem */}
            <div className="card border-2 border-red-200 bg-red-50">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">What You're Doing Now</h3>
                  <p className="text-gray-600 text-sm">The spray-and-pray approach</p>
                </div>
              </div>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold mt-1">✗</span>
                  <span className="text-gray-700">Apply to 100+ jobs hoping something sticks</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold mt-1">✗</span>
                  <span className="text-gray-700">Spend 2-3 hours per application</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold mt-1">✗</span>
                  <span className="text-gray-700">Get rejected for positions you were never qualified for</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold mt-1">✗</span>
                  <span className="text-gray-700">Never understand why you got rejected</span>
                </li>
              </ul>
              
              <div className="mt-6 pt-6 border-t border-red-200">
                <p className="text-center text-red-800 font-bold">
                  Result: 98% rejection rate, crushed confidence
                </p>
              </div>
            </div>
            
            {/* Solution */}
            <div className="card border-2 border-green-200 bg-green-50">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">What You Should Do</h3>
                  <p className="text-gray-600 text-sm">The smart, targeted approach</p>
                </div>
              </div>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span className="text-gray-700">Analyze jobs BEFORE you apply</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span className="text-gray-700">Know exactly what's missing in your profile</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span className="text-gray-700">Only apply to jobs you can actually get</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span className="text-gray-700">Fix your gaps before applying</span>
                </li>
              </ul>
              
              <div className="mt-6 pt-6 border-t border-green-200">
                <p className="text-center text-green-800 font-bold">
                  Result: Apply to 10 right jobs, not 100 wrong ones
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              30 seconds to know if you should apply
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Paste Job Description</h3>
              <p className="text-gray-600">
                Copy any job posting from LinkedIn, Indeed, or any site
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Get AI Analysis</h3>
              <p className="text-gray-600">
                AI compares your profile to job requirements in real-time
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">See Your Verdict</h3>
              <p className="text-gray-600">
                Clear warning or green light - plus what to fix
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing - 4 Tiers */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Fair Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your job search
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Free */}
            <div className="card border-2 border-gray-200 hover:border-primary-300 transition-colors">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Try Free</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">$0</span>
                </div>
                <ul className="text-left space-y-3 mb-8 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">3 job analyses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Match scoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Basic insights</span>
                  </li>
                </ul>
                <Link to="/register" className="btn btn-secondary w-full text-sm">
                  Start Free
                </Link>
              </div>
            </div>
            
            {/* Pay Per Job */}
            <div className="card border-2 border-gray-200 hover:border-primary-300 transition-colors">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Pay Per Job</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">$2.99</span>
                  <span className="text-gray-600 text-sm">/job</span>
                </div>
                <ul className="text-left space-y-3 mb-8 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Full AI analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Gap analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">ATS keywords</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">No commitment</span>
                  </li>
                </ul>
                <Link to="/register" className="btn btn-secondary w-full text-sm">
                  Get Started
                </Link>
              </div>
            </div>
            
            {/* Basic - NEW */}
            <div className="card border-2 border-primary-500 shadow-xl relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="px-3 py-1 bg-primary-500 text-white text-xs font-bold rounded-full">
                  MOST POPULAR
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Basic</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">$9</span>
                  <span className="text-gray-600 text-sm">/month</span>
                </div>
                <ul className="text-left space-y-3 mb-8 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700"><strong>25 analyses/month</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Everything in Pay-Per-Job</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Email support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Save job history</span>
                  </li>
                </ul>
                <Link to="/register" className="btn btn-primary w-full text-sm">
                  Choose Basic
                </Link>
              </div>
            </div>
            
            {/* Pro */}
            <div className="card border-2 border-gray-200 hover:border-primary-300 transition-colors">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">$29</span>
                  <span className="text-gray-600 text-sm">/month</span>
                </div>
                <ul className="text-left space-y-3 mb-8 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700"><strong>100 analyses/month</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Everything in Basic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Priority support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Advanced analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Batch processing</span>
                  </li>
                </ul>
                <Link to="/register" className="btn btn-secondary w-full text-sm">
                  Choose Pro
                </Link>
              </div>
            </div>
          </div>
          
          <p className="text-center text-gray-600 mt-8">
            💳 No credit card required to start • Cancel anytime
          </p>
        </div>
      </section>
      
      {/* Social Proof - Results */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Real Results
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="card text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">3.2x</div>
              <p className="text-gray-600">Higher interview rate</p>
            </div>
            
            <div className="card text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">10→2</div>
              <p className="text-gray-600">Applications needed per interview</p>
            </div>
            
            <div className="card text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">15 hrs</div>
              <p className="text-gray-600">Saved per week</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary-600 to-success-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Stop Applying to Jobs You'll Never Get
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Get your first AI analysis free. No credit card required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100">
              Analyze Your First Job Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
          
          <p className="mt-6 text-primary-100 text-sm">
            Join 10,000+ job seekers making smarter application decisions
          </p>
        </div>
      </section>
    </div>
  )
}

export default Landing