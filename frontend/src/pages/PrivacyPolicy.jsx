import { Link } from 'react-router-dom'
import { ArrowLeft, Lock, Shield, Eye, Database, Trash2, CheckCircle } from 'lucide-react'

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-gray-600">Last updated: January 21, 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <p className="text-gray-700 leading-relaxed">
              At Job Agent, we take your privacy seriously. This Privacy Policy explains how 
              we collect, use, store, and protect your personal information.
            </p>
          </section>

          {/* TL;DR Summary */}
          <section className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-blue-600" />
              TL;DR - What You Need to Know
            </h2>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>We only collect data necessary to provide our service</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Your CV and job data are used ONLY for analysis—never for AI training</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>We don't sell your data to anyone</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>You can delete your data anytime</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>All data is encrypted in transit and at rest</span>
              </div>
            </div>
          </section>

          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-primary-600" />
              1. Information We Collect
            </h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">1.1 Account Information</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Email address (required for account creation)</li>
                  <li>Name (optional, for personalization)</li>
                  <li>Password (hashed and never stored in plain text)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">1.2 Career Information</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>CV/Resume (uploaded by you)</li>
                  <li>Work experience details</li>
                  <li>Skills and certifications</li>
                  <li>Education history</li>
                  <li>Job descriptions you analyze</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">1.3 Usage Data</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Jobs analyzed and application tracking</li>
                  <li>Feature usage and interaction patterns</li>
                  <li>Technical data (IP address, browser type, device info)</li>
                  <li>Error logs and performance metrics</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">1.4 Payment Information</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Payment details (processed by Stripe, not stored by us)</li>
                  <li>Billing address</li>
                  <li>Transaction history</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. How We Use Your Information
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Provide Our Service:</strong> Analyze your CV against job descriptions, 
                  generate application materials, and track your applications
                </li>
                <li>
                  <strong>Personalization:</strong> Tailor insights and recommendations to your 
                  profile and career goals
                </li>
                <li>
                  <strong>Communication:</strong> Send you service updates, analysis results, 
                  and respond to support requests
                </li>
                <li>
                  <strong>Billing:</strong> Process payments and manage your subscription
                </li>
                <li>
                  <strong>Improvement:</strong> Analyze aggregate, anonymized usage patterns to 
                  improve our service (never individual data)
                </li>
                <li>
                  <strong>Security:</strong> Detect and prevent fraud, abuse, and security issues
                </li>
                <li>
                  <strong>Legal Compliance:</strong> Meet legal obligations and enforce our terms
                </li>
              </ul>
            </div>
          </section>

          {/* 3. What We DON'T Do */}
          <section className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-600" />
              3. What We DON'T Do With Your Data
            </h2>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <p className="font-semibold">No AI Training</p>
                  <p className="text-sm">
                    Your CV and job descriptions are NEVER used to train our AI models or 
                    improve our algorithms. They exist solely for YOUR analysis.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <p className="font-semibold">No Data Selling</p>
                  <p className="text-sm">
                    We NEVER sell, rent, or trade your personal information to third parties 
                    for marketing or any other purpose.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <p className="font-semibold">No Recruiter Sharing</p>
                  <p className="text-sm">
                    We DON'T share your CV or profile with recruiters, employers, or job boards 
                    without your explicit consent.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <p className="font-semibold">No Tracking After Deletion</p>
                  <p className="text-sm">
                    When you delete your account, your data is permanently removed from our 
                    systems within 30 days. We don't keep "shadow profiles."
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Data Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. When We Share Your Information
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>We only share your data in these limited circumstances:</p>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">4.1 Service Providers</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>Stripe:</strong> Payment processing (they never see your CV data)
                  </li>
                  <li>
                    <strong>OpenAI:</strong> AI analysis (your data is sent encrypted and not used for training)
                  </li>
                  <li>
                    <strong>AWS:</strong> Cloud hosting and storage (encrypted at rest)
                  </li>
                </ul>
                <p className="text-sm mt-2 italic">
                  All service providers are bound by strict data processing agreements.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">4.2 Legal Requirements</h3>
                <p>
                  We may disclose your information if required by law, court order, or government 
                  request, or to protect our rights and safety.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">4.3 Business Transfer</h3>
                <p>
                  If Job Agent is acquired or merged, your data may be transferred to the 
                  new owner (who must honor this Privacy Policy).
                </p>
              </div>
            </div>
          </section>

          {/* 5. Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. How We Protect Your Data
            </h2>
            <div className="space-y-3 text-gray-700">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Encryption:</strong> All data is encrypted in transit (TLS/SSL) and 
                  at rest (AES-256)
                </li>
                <li>
                  <strong>Access Controls:</strong> Only authorized personnel can access user data, 
                  with strict audit logs
                </li>
                <li>
                  <strong>Secure Infrastructure:</strong> Hosted on AWS with industry-standard 
                  security practices
                </li>
                <li>
                  <strong>Regular Security Audits:</strong> We conduct periodic security reviews 
                  and vulnerability assessments
                </li>
                <li>
                  <strong>Password Hashing:</strong> Passwords are hashed using bcrypt and never 
                  stored in plain text
                </li>
              </ul>
            </div>
          </section>

          {/* 6. Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. How Long We Keep Your Data
            </h2>
            <div className="space-y-3 text-gray-700">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Active Accounts:</strong> We retain your data as long as your account 
                  is active
                </li>
                <li>
                  <strong>Deleted Accounts:</strong> Data is permanently deleted within 30 days 
                  of account deletion
                </li>
                <li>
                  <strong>Billing Records:</strong> Kept for 7 years for tax and legal compliance
                </li>
                <li>
                  <strong>Analytics:</strong> Anonymized usage data may be retained indefinitely 
                  for service improvement
                </li>
              </ul>
            </div>
          </section>

          {/* 7. Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Your Data Rights
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Access:</strong> Request a copy of all data we hold about you
                </li>
                <li>
                  <strong>Correction:</strong> Update or correct inaccurate information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your account and all associated data
                </li>
                <li>
                  <strong>Data Portability:</strong> Export your data in a machine-readable format
                </li>
                <li>
                  <strong>Object:</strong> Object to certain processing activities
                </li>
                <li>
                  <strong>Restrict:</strong> Limit how we process your data in certain circumstances
                </li>
                <li>
                  <strong>Withdraw Consent:</strong> Opt out of optional data processing
                </li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at{' '}
                <a href="mailto:jobagentcareers@gmail.com" className="text-primary-600 hover:underline font-semibold">
                  jobagentcareers@gmail.com
                </a>
              </p>
            </div>
          </section>

          {/* 8. Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Cookies & Tracking
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>We use minimal cookies:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Essential Cookies:</strong> Required for authentication and basic functionality
                </li>
                <li>
                  <strong>Analytics:</strong> Anonymized usage statistics (you can opt out)
                </li>
              </ul>
              <p className="mt-3">
                We do NOT use advertising or social media tracking cookies.
              </p>
            </div>
          </section>

          {/* 9. Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Children's Privacy
            </h2>
            <p className="text-gray-700">
              Job Agent is not intended for users under 16 years old. We do not knowingly 
              collect data from children. If we discover we have collected data from a child, 
              we will delete it immediately.
            </p>
          </section>

          {/* 10. International Data Transfers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. International Data Transfers
            </h2>
            <p className="text-gray-700">
              Your data may be processed in the UK, EU, or USA (AWS data centers). All transfers 
              are protected by appropriate safeguards (Standard Contractual Clauses, Privacy Shield 
              successor frameworks).
            </p>
          </section>

          {/* 11. Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of 
              significant changes via email or a prominent notice on our website. The "Last 
              updated" date at the top will always reflect the most recent version.
            </p>
          </section>

          {/* 12. Contact & DPO */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              12. Contact Us
            </h2>
            <div className="text-gray-700">
              <p className="mb-4">For privacy-related questions or to exercise your rights:</p>
              <ul className="space-y-2">
                <li>
                  📧 <strong>Privacy Team:</strong>{' '}
                  <a href="mailto:jobagentcareers@gmail.com" className="text-primary-600 hover:underline">
                    privacy@jobagent.com
                  </a>
                </li>
                <li>
                  📧 <strong>General Support:</strong>{' '}
                  <a href="mailto:jobagentcareers@gmail.com" className="text-primary-600 hover:underline">
                    support@jobagent.com
                  </a>
                </li>
                <li>
                  🌐 <strong>Website:</strong>{' '}
                  <a href="https://jobagent-career.com" className="text-primary-600 hover:underline">
                    jobagent-career.com
                  </a>
                </li>
              </ul>
              <p className="mt-4 text-sm italic">
                You also have the right to lodge a complaint with the Information Commissioner's 
                Office (ICO) if you believe your data rights have been violated.
              </p>
            </div>
          </section>

          {/* Acceptance */}
          <section className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Trash2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-gray-900 font-semibold mb-2">
                  Your Control Over Your Data
                </p>
                <p className="text-gray-700">
                  Remember: You can delete your account and all associated data at any time 
                  through your settings page. Once deleted, your data is gone forever—we don't 
                  keep backups of deleted user data.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Quick Links */}
        <div className="mt-8 flex justify-center gap-6">
          <Link to="/terms" className="text-primary-600 hover:underline font-semibold">
            Terms of Service →
          </Link>
          <Link to="/" className="text-gray-600 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy