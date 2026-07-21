import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronRight, AlertCircle, Loader, CheckCircle, ExternalLink, Wallet, Key } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useWalletStore } from '../store/wallet.store';
import { api } from '../lib/api';
import { analytics } from '../lib/analytics';

type Step = 'connect' | 'profile' | 'done';

export default function Onboarding() {
  const navigate = useNavigate();
  const { connect, connectWithAddress, isConnecting } = useWallet();
  const { address, isConnected } = useWalletStore();

  const [step, setStep] = useState<Step>(isConnected ? 'profile' : 'connect');
  const [error, setError] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [tryingFreighter, setTryingFreighter] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [form, setForm] = useState({ displayName: '', country: '', phone: '', email: '' });

  const handleFreighterConnect = async () => {
    setError(null);
    setTryingFreighter(true);
    const result = await connect();
    setTryingFreighter(false);
    if (result.success) {
      analytics.track('onboarding_wallet_connected', { method: 'freighter' });
      setStep('profile');
    } else if (result.error === 'timeout') {
      // Freighter not responding — show manual input
      setError('Freighter did not respond. Use the manual input below, or make sure Freighter is unlocked.');
    } else {
      setError(result.error ?? 'Connection failed');
    }
  };

  const handleManualConnect = async () => {
    setError(null);
    const result = await connectWithAddress(manualAddress);
    if (result.success) {
      analytics.track('onboarding_wallet_connected', { method: 'manual' });
      setStep('profile');
    } else {
      setError(result.error ?? 'Invalid address');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.displayName.trim()) { setProfileError('Display name is required'); return; }
    setProfileLoading(true);
    try { await api.post('/auth/profile', form); } catch { /* backend may not be deployed */ }
    analytics.track('onboarding_profile_complete', { country: form.country });
    setStep('done');
    setProfileLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2540] via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#f59e0b]">DiasporaCircle</h1>
          <p className="text-gray-300 mt-2">Rotating savings on Stellar blockchain</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex">
            {(['connect', 'profile', 'done'] as Step[]).map((s) => (
              <div key={s} className={`flex-1 h-1 ${
                s === 'connect' ? 'bg-blue-600'
                : s === 'profile' && (step === 'profile' || step === 'done') ? 'bg-blue-600'
                : s === 'done' && step === 'done' ? 'bg-green-500'
                : 'bg-gray-200'}`} />
            ))}
          </div>

          <div className="p-6 md:p-8">

            {step === 'connect' && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Wallet size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Connect Your Wallet</h2>
                    <p className="text-sm text-gray-500">Step 1 of 2</p>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                    <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-800 text-sm">{error}</p>
                  </div>
                )}

                {/* Option 1: Freighter */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Option 1 — Browser Extension</p>
                  <button
                    onClick={handleFreighterConnect}
                    disabled={isConnecting || tryingFreighter}
                    className="w-full py-3 bg-[#f59e0b] text-white rounded-lg font-semibold hover:bg-amber-500 transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {tryingFreighter
                      ? <><Loader size={18} className="animate-spin" /> Connecting to Freighter...</>
                      : <><Wallet size={18} /> Connect with Freighter</>}
                  </button>
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    Requires{' '}
                    <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      Freighter extension
                    </a>
                    {' '}unlocked + set to Testnet
                  </p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">OR</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Option 2: Manual address */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Option 2 — Paste Wallet Address</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      placeholder="G... (56 character Stellar address)"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono"
                    />
                    <button
                      onClick={handleManualConnect}
                      disabled={isConnecting || !manualAddress.trim()}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1 text-sm"
                    >
                      <Key size={15} /> Connect
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Copy your address from Freighter → click the address at the top → paste here.
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    Need a testnet wallet?{' '}
                    <a
                      href="https://laboratory.stellar.org/#account-creator?network=test"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline inline-flex items-center gap-1"
                    >
                      Create one free on Stellar Lab <ExternalLink size={11} />
                    </a>
                  </p>
                </div>
              </div>
            )}

            {step === 'profile' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Complete Your Profile</h2>
                    <p className="text-sm text-gray-500">Step 2 of 2</p>
                  </div>
                </div>

                {address && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                    <p className="text-green-800 text-sm font-mono">
                      {address.substring(0, 10)}...{address.substring(address.length - 6)}
                    </p>
                  </div>
                )}

                {profileError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                    <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-800 text-sm">{profileError}</p>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Display Name <span className="text-red-500">*</span>
                    </label>
                    <input type="text" value={form.displayName}
                      onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                      placeholder="e.g., Amara Osei" required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
                    <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
                      <option value="">Select country...</option>
                      <option value="NG">Nigeria</option><option value="GH">Ghana</option>
                      <option value="KE">Kenya</option><option value="ZA">South Africa</option>
                      <option value="US">United States</option><option value="GB">United Kingdom</option>
                      <option value="CA">Canada</option><option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone (optional)</label>
                    <input type="tel" value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email (optional)</label>
                    <input type="email" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                  </div>
                  <button type="submit" disabled={profileLoading}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                    {profileLoading
                      ? <><Loader size={18} className="animate-spin" /> Saving...</>
                      : <>Continue <ChevronRight size={18} /></>}
                  </button>
                </form>
              </div>
            )}

            {step === 'done' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
                <p className="text-gray-600 mb-8">
                  Welcome, {form.displayName || 'friend'}. Start saving with your community.
                </p>
                <button onClick={() => navigate('/dashboard')}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                  Go to Dashboard <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-gray-400 text-xs mt-6">Secured by Stellar blockchain · Testnet mode</p>
      </div>
    </div>
  );
}
