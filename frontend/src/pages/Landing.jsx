import { useNavigate } from 'react-router-dom'
import { Rocket, Zap, Target, TrendingUp } from 'lucide-react'

function Landing() {
  const navigate = useNavigate()
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-500 to-success-500 text-white py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            🚀 Job Agent India
          </h1>
          <p className="text-3xl md:text-4xl font-semibold mb-4 animate-slide-up">
            100 में Apply करो, 1 घंटे में!
          </p>
          <p className="text-xl md:text-2xl mb-8 opacity-95">
            Stop wasting weeks on job applications. Apply to 100+ jobs automatically.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate('/register')}
              className="btn btn-primary bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4"
            >
              Start Free Trial →
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-4"
            >
              Login
            </button>
          </div>
        </div>
      </section>
      
      {/* Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-4xl font-bold text-primary-500">10,000+</h3>
              <p className="text-gray-600 mt-2">Applications Sent</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary-500">5,000+</h3>
              <p className="text-gray-600 mt-2">Happy Users</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary-500">80%</h3>
              <p className="text-gray-600 mt-2">Time Saved</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card text-center">
              <Target className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Find Jobs</h3>
              <p className="text-gray-600">Browse Naukri, LinkedIn, Shine like normal</p>
            </div>
            
            <div className="card text-center">
              <Rocket className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">One-Click Apply</h3>
              <p className="text-gray-600">Click our button - we fill everything</p>
            </div>
            
            <div className="card text-center">
              <Zap className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Batch Apply</h3>
              <p className="text-gray-600">Apply to 20 similar jobs at once</p>
            </div>
            
            <div className="card text-center">
              <TrendingUp className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Track Everything</h3>
              <p className="text-gray-600">Dashboard shows all applications</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Simple Pricing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="card border-2 border-gray-200">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-4xl font-bold text-primary-500 mb-6">
                ₹0<span className="text-lg text-gray-600">/month</span>
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-success-500">✓</span>
                  <span>10 applications/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success-500">✓</span>
                  <span>Naukri + LinkedIn</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success-500">✓</span>
                  <span>Basic ATS scoring</span>
                </li>
              </ul>
              <button
                onClick={() => navigate('/register')}
                className="btn btn-outline w-full"
              >
                Get Started
              </button>
            </div>
            
            {/* Starter */}
            <div className="card border-2 border-primary-500 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-4xl font-bold text-primary-500 mb-6">
                ₹299<span className="text-lg text-gray-600">/month</span>
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-success-500">✓</span>
                  <span>50 applications/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success-500">✓</span>
                  <span>All job portals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success-500">✓</span>
                  <span>WhatsApp notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success-500">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
              <button
                onClick={() => navigate('/register')}
                className="btn btn-primary w-full"
              >
                Start Now
              </button>
            </div>
            
            {/* Pro */}
            <div className="card border-2 border-gray-200">
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-4xl font-bold text-primary-500 mb-6">
                ₹699<span className="text-lg text-gray-600">/month</span>
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-success-500">✓</span>
                  <span>200 applications/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success-500">✓</span>
                  <span>Batch apply (20+ jobs)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success-500">✓</span>
                  <span>Analytics dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success-500">✓</span>
                  <span>VIP support</span>
                </li>
              </ul>
              <button
                onClick={() => navigate('/register')}
                className="btn btn-outline w-full"
              >
                Go Pro
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-success-500 text-white">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold mb-4">Ready to Land Your Dream Job?</h2>
          <p className="text-xl mb-8">Join 5,000+ job seekers using Job Agent India</p>
          <button
            onClick={() => navigate('/register')}
            className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4"
          >
            Start Free Trial - No Credit Card →
          </button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p>&copy; 2024 Job Agent India. Made with ❤️ in India.</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing