import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Star, Send, CheckCircle, ArrowLeft, Loader } from 'lucide-react';
import { analytics } from '../lib/analytics';

interface FeedbackForm {
  rating: number;
  usedFeatures: string[];
  easiest: string;
  hardest: string;
  wouldUse: string;
  wouldRecommend: string;
  comments: string;
  email: string;
}

const FEATURES = ['Create Circle', 'Join Circle', 'Contribute', 'View Reputation', 'Dashboard'];
const WOULD_USE = [
  'Yes, immediately',
  'Yes, but need more features',
  'Maybe, still deciding',
  'No, not for me',
];

export default function Feedback() {
  const [form, setForm] = useState<FeedbackForm>({
    rating: 0,
    usedFeatures: [],
    easiest: '',
    hardest: '',
    wouldUse: '',
    wouldRecommend: '',
    comments: '',
    email: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const toggleFeature = (feature: string) => {
    setForm((f) => ({
      ...f,
      usedFeatures: f.usedFeatures.includes(feature)
        ? f.usedFeatures.filter((x) => x !== feature)
        : [...f.usedFeatures, feature],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.rating === 0) return;

    setSubmitting(true);
    try {
      // Track analytics
      analytics.track('feedback_submitted', {
        rating: form.rating,
        wouldUse: form.wouldUse,
        wouldRecommend: form.wouldRecommend,
        usedFeatures: form.usedFeatures,
      });

      // Store feedback in localStorage as proof of collection
      const feedbacks = JSON.parse(localStorage.getItem('dc_feedback') || '[]');
      feedbacks.push({ ...form, submittedAt: new Date().toISOString() });
      localStorage.setItem('dc_feedback', JSON.stringify(feedbacks));

      // Try to send to backend (non-blocking)
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } catch {
        // Silently fail — feedback stored locally
      }

      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
          <p className="text-gray-600 mb-6">
            Your feedback helps us make DiasporaCircle better for everyone in the diaspora community.
          </p>
          <div className="flex gap-3">
            <Link
              to="/dashboard"
              className="flex-1 py-3 text-center bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Share Feedback</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-blue-800 text-sm">
            Help us improve DiasporaCircle! This feedback is used to measure the product quality
            and user experience. It takes about 2 minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Overall impression <span className="text-red-500">*</span>
            </h2>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setForm({ ...form, rating: star })}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={40}
                    className={`transition-colors ${
                      star <= (hoverRating || form.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {form.rating > 0 && (
              <p className="text-center text-sm text-gray-500 mt-2">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][form.rating]}
              </p>
            )}
          </div>

          {/* Features Used */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Which features did you try?</h2>
            <div className="flex flex-wrap gap-2">
              {FEATURES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFeature(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    form.usedFeatures.includes(f)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Qualitative */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <div>
              <label className="block font-semibold text-gray-900 mb-2 text-sm">
                What was easiest to do?
              </label>
              <input
                type="text"
                value={form.easiest}
                onChange={(e) => setForm({ ...form, easiest: e.target.value })}
                placeholder="e.g., Creating a circle was straightforward"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-900 mb-2 text-sm">
                What was most confusing or difficult?
              </label>
              <input
                type="text"
                value={form.hardest}
                onChange={(e) => setForm({ ...form, hardest: e.target.value })}
                placeholder="e.g., The wallet connection step"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
          </div>

          {/* Would use */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm">Would you use this with real money?</h2>
            <div className="space-y-2">
              {WOULD_USE.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setForm({ ...form, wouldUse: opt })}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition ${
                    form.wouldUse === opt
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Recommend */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm">Would you recommend to friends?</h2>
            <div className="grid grid-cols-2 gap-2">
              {['Definitely', 'Probably', 'Maybe', 'Not likely'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setForm({ ...form, wouldRecommend: opt })}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition ${
                    form.wouldRecommend === opt
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Additional */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <div>
              <label className="block font-semibold text-gray-900 mb-2 text-sm">
                Any other feedback?
              </label>
              <textarea
                value={form.comments}
                onChange={(e) => setForm({ ...form, comments: e.target.value })}
                placeholder="What would you add, remove, or change?"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 h-24 resize-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-900 mb-2 text-sm">
                Email (optional — for follow-up)
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={form.rating === 0 || submitting}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader size={18} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={18} />
                Submit Feedback
              </>
            )}
          </button>

          {form.rating === 0 && (
            <p className="text-center text-sm text-gray-500">Please give a star rating to submit</p>
          )}
        </form>
      </div>
    </div>
  );
}
