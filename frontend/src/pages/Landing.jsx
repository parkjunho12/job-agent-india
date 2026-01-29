import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CheckCircle, XCircle, AlertCircle, ArrowRight, Zap, 
  TrendingUp, Clock, Target, Ban, Shield
} from 'lucide-react'
import Logo from '../components/Logo'

function Landing() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  const handleGetStarted = () => {
    if (email) {
      navigate('/register', { state: { email } })
    } else {
      navigate('/register')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50">
      {/* Hero Section - Fear-based */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold mb-4">
              ⚠️ Most job applications are rejected in 6 seconds.
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Stop Wasting Time on<br/>
            <span className="text-red-600">Jobs That Will Reject You</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Know your chances in 30 seconds.<br/>
            See exactly <strong>why you'll be rejected</strong> before you waste hours applying.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button 
              onClick={() => navigate('/register')}
              className="btn btn-primary btn-lg flex items-center justify-center gap-2"
            >
              Try Free Analysis (3 Free)
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => document.getElementById('why-rejected').scrollIntoView({ behavior: 'smooth' })}
              className="btn btn-secondary btn-lg"
            >
              See How It Works
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success-600" />
              <span>No credit card needed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success-600" />
              <span>3 free analyses</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success-600" />
              <span>30 seconds per job</span>
            </div>
          </div>
        </div>
      </section>

      {/* 🔥 NEW: Why You'll Be Rejected (Moved Up) */}
      <section id="why-rejected" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why This Job Will Reject You
            </h2>
            <p className="text-xl text-gray-600">
              See rejection reasons <strong>BEFORE</strong> you waste time applying
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="p-6 border-2 border-red-200 rounded-xl bg-red-50">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Missing Core Keywords
              </h3>
              <p className="text-gray-700 mb-4">
                ATS filters out <strong>75% of applications</strong> for missing 3+ required keywords
              </p>
              <div className="bg-white p-3 rounded-lg border border-red-200">
                <p className="text-sm text-gray-600 mb-2">Example:</p>
                <p className="text-sm text-red-700 font-mono">
                  ❌ Missing: "Python", "Team leadership", "Agile"
                </p>
              </div>
            </div>

            <div className="p-6 border-2 border-orange-200 rounded-xl bg-orange-50">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Experience Mismatch
              </h3>
              <p className="text-gray-700 mb-4">
                Role expects <strong>5+ years</strong>, your CV shows 2 → Instant rejection
              </p>
              <div className="bg-white p-3 rounded-lg border border-orange-200">
                <p className="text-sm text-gray-600 mb-2">Reality check:</p>
                <p className="text-sm text-orange-700 font-mono">
                  ⚠️ You have 40% of required experience
                </p>
              </div>
            </div>

            <div className="p-6 border-2 border-red-200 rounded-xl bg-red-50">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Ban className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Wrong Seniority Level
              </h3>
              <p className="text-gray-700 mb-4">
                Leadership responsibility mismatch - <strong>recruiter won't even read</strong>
              </p>
              <div className="bg-white p-3 rounded-lg border border-red-200">
                <p className="text-sm text-gray-600 mb-2">Common issue:</p>
                <p className="text-sm text-red-700 font-mono">
                  ❌ Applying for Senior role with Mid-level experience
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button 
              onClick={() => navigate('/register')}
              className="btn btn-primary btn-lg inline-flex items-center gap-2"
            >
              <Shield className="w-5 h-5" />
              See Your Rejection Risk Now (Free)
            </button>
          </div>
        </div>
      </section>

      {/* Problem Visualization - Before/After */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Stop the Spray-and-Pray Approach
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Before - RED */}
            <div className="p-8 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border-2 border-red-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Without JobAgent
                </h3>
              </div>

              <ul className="space-y-4 mb-6">
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-800">Apply to <strong>100 jobs blindly</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-800"><strong>98% rejection rate</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-800">Waste <strong>40+ hours</strong> per week</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-800">Never know <strong>why you're rejected</strong></span>
                </li>
              </ul>

              <div className="p-4 bg-white rounded-lg border-2 border-red-300">
                <p className="text-lg font-bold text-red-700 text-center">
                  100 applications → 2 interviews
                </p>
              </div>
            </div>

            {/* After - GREEN */}
            <div className="p-8 bg-gradient-to-br from-success-50 to-success-100 rounded-2xl border-2 border-success-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-success-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  With JobAgent
                </h3>
              </div>

              <ul className="space-y-4 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-800">Apply to <strong>10 RIGHT jobs</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-800"><strong>70% match rate</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-800">Save <strong>35+ hours</strong> per week</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-800">Know <strong>exactly what to fix</strong></span>
                </li>
              </ul>

              <div className="p-4 bg-white rounded-lg border-2 border-success-300">
                <p className="text-lg font-bold text-success-700 text-center">
                  10 applications → 7 interviews
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Upload Your Resume/CV
              </h3>
              <p className="text-gray-600">
                Securely upload in PDF or DOCX format.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Copy and Paste <br></br>Job Description
              </h3>
              <p className="text-gray-600">
                Paste JD text from any source.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Get AI Analysis
              </h3>
              <p className="text-gray-600">
                AI assesses your suitability in 30 seconds.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">4</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                See the Verdict
              </h3>
              <p className="text-gray-600">
                Clear answer: Apply or skip?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🔥 NEW: Pricing (Pay-per-job FIRST) */}
      <section className="py-16 px-4 bg-gradient-to-br from-gray-50 to-primary-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Fair Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Most people just want to know: <strong>"Should I apply to THIS job?"</strong>
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* 🔥 1st: Pay-per-job (FEATURED) */}
            <div className="p-8 bg-white rounded-2xl border-2 border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Pay Per Job
                </h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900">$2</span>
                </div>
                <p className="text-sm text-gray-600">per analysis</p>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                Perfect for targeted applications
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                  <span>Full rejection risk analysis</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                  <span>Gap analysis with fixes</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                  <span>Custom cover letter</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                  <span>ATS optimization tips</span>
                </li>
              </ul>

              <button 
                onClick={() => navigate('/register')}
                className="btn btn-secondary w-full"
              >
                Analyze One Job
              </button>
            </div>

            {/* 2nd: Free */}
            <div className="p-8 bg-white rounded-2xl border-2 border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Try Free First
                </h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900">$0</span>
                </div>
                <p className="text-sm text-gray-600">3 free analyses</p>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  <strong>What you get (FREE):</strong>
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                  <span>Rejection risk verdict</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                  <span>Match score</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-400 line-through">Gap analysis</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-400 line-through">Cover letter</span>
                </li>
              </ul>

              <button 
                onClick={() => navigate('/register')}
                className="btn btn-secondary w-full"
              >
                Start Free
              </button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Free analysis shows <strong>rejection risk only</strong>.<br/>
                Full fix plan requires paid analysis.
              </p>
            </div>
            
            {/* 3rd: Basic */}
            <div className="relative p-8 bg-white rounded-2xl border-4 border-primary-500 shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary-500 to-success-500 text-white text-sm font-bold rounded-full">
                Most Popular
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Basic
                </h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900">$9.99</span>
                  <span className="text-gray-600">/mo</span>
                </div>
                <p className="text-sm text-gray-600">25 analyses/month</p>
              </div>

              <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-sm text-gray-700 text-center font-medium">
                  For active job seekers
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                  <span>Everything in Pay-per-job</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                  <span>25 analyses per month</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                  <span>Email support</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                  <span>History & analytics</span>
                </li>
              </ul>

              <button 
                onClick={() => navigate('/register')}
                className="btn btn-primary w-full"
              >
                Choose Basic
              </button>
            </div>

            {/* 4th: Pro */}
            <div className="p-8 bg-white rounded-2xl border-2 border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Pro
                </h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900">$29.99</span>
                  <span className="text-gray-600">/mo</span>
                </div>
                <p className="text-sm text-gray-600">100 analyses/month</p>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  For serious professionals
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                  <span>Everything in Basic</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                  <span>100 analyses per month</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                  <span>Export reports</span>
                </li>
              </ul>

              <button 
                onClick={() => navigate('/register')}
                className="btn btn-secondary w-full"
              >
                Choose Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Results That Matter
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-5xl font-bold text-primary-600 mb-2">3.2x</div>
              <p className="text-gray-600">Higher interview rate</p>
            </div>

            <div className="text-center p-6">
              <div className="text-5xl font-bold text-success-600 mb-2">10→2</div>
              <p className="text-gray-600">Applications per interview</p>
            </div>

            <div className="text-center p-6">
              <div className="text-5xl font-bold text-orange-600 mb-2">15hrs</div>
              <p className="text-gray-600">Saved per week</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary-500 to-success-500 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Stop Wasting Time on Bad Jobs
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Get 3 free analyses. No credit card needed.
          </p>
          <button 
            onClick={() => navigate('/register')}
            className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg inline-flex items-center gap-2"
          >
            Start Free Analysis
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  )
}

export default Landing