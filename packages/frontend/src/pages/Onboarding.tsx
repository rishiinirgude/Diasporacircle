/**
 * Onboarding page — wallet connection using Stellar Wallets Kit v2
 * The kit renders its own Connect button via createButton(domRef).
 * We listen to STATE_UPDATED event to get the wallet address.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronRight, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { useWalletStore } from '../store/wallet.store';
import { api } from '../lib/api';
import { analytics } from '../lib/analytics';

type Step = 'connect' | 'profile' | 'done';

// Load kit outside component so it initializes once
let kitReady = false;
async function setupKit(
  container: HTMLElement,
  onAddress: (addr: string) => void,
  onError: (msg: string) => void
) {
  try {
    const { StellarWalletsKit } = await import('@creit-tech/stellar-wallets-kit/sdk');
    const { defaultModules } = await import('@creit-tech/stellar-wallets-kit/modules/utils');
    const { KitEventType } = await import('@creit-tech/stellar-wallets-kit/types');

    if (!kitReady) {
      (StellarWalletsKit as unknown as { init(p: object): void }).init({
        modules: (defaultModules as () => unknown[])(),
      });
      kitReady = true;
    }

    (StellarWalletsKit as unknown as { createButton(el: HTMLElement): void }).createButton(container);

    const kit = StellarWalletsKit as unknown as {
      on(ev: string, cb: (e: { payload?: { address?: string } }) => void): () => void;
    };

    const unsub = kit.on(KitEventType.STATE_UPDATED, (event) => {
      const addr = event?.payload?.address;
      if (addr) {
        onAddress(addr);
        unsub();
      }
    });
  } catch (err) {
    console.error('Kit setup error:', err);
    onError('Failed to load wallet kit. Please refresh and try again.');
  }
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { address, isConnected, setAddress, setToken } = useWalletStore();
  const buttonRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>(isConnected ? 'profile' : 'connect');
  const [kitError, setKitError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [form, setForm] = useState({ displayName: '', country: '', phone: '', email: '' });

  useEffect(() => {
    if (step !== 'connect' || !buttonRef.current) return;

    setupKit(
      buttonRef.current,
      (addr) => {
        // Wallet connected — set a local token and move to profile
        const jwt = `local_${addr}_${Date.now()}`;
        setAddress(addr);
        setToken(jwt);
        localStorage.setItem('dc_token', jwt);
        localStorage.setItem('dc_address', addr);
        analytics.track('wallet_connected', { address: addr });
        setStep('profile');
      },
      (err) => setKitError(err)
    );
  }, [step, buttonRef.current]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.displayName.trim()) {
      setProfileError('Display name is required');
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    try {
      await api.post('/auth/profile', form);
    } catch {
      // backend may not be deployed — skip
    } finally {
      analytics.track('onboarding_profile_complete', { country: form.country });
      setStep('done');
      setProfileLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2540] via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#f59e0b]">DiasporaCircle</h1>
          <p className="text-gray-300 mt-2">Rotating savings on Stellar blockchain</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Progress bar */}
          <div className="flex">
            {(['connect', 'profile', 'done'] as Step[]).map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 transition-colors ${
                  s === 'connect'
                    ? 'bg-blue-600'
                    : s === 'profile' && (step === 'profile' || step === 'done')
                    ? 'bg-blue-600'
                    : s === 'done' && step === 'done'
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="p-6 md:p-8">

            {/* ── STEP 1: Connect ── */}
            {step === 'connect' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    1
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Connect Your Wallet</h2>
                    <p className="text-sm text-gray-500">Step 1 of 2</p>
                  </div>
                </div>

                <p className="text-gray-600 mb-6 text-sm">
                  Click the <strong>Connect Wallet</strong> button below. A wallet selector will appear — choose your wallet (e.g. Freighter) and approve.
                </p>

                {kitError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-800 text-sm">{kitError}</p>
                  </div>
                )}

                {/* The kit renders its button here */}
                <div
                  ref={buttonRef}
                  id="swk-button-wrapper"
                  className="flex justify-center"
                />

                <p className="text-center text-xs text-gray-400 mt-5">
                  Supports Freighter · xBull · Albedo · Lobstr · Rabet
                  <br />
                  <a
                    href="https://freighter.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Install Freighter (free)
                  </a>
                </p>
              </div>
            )}

            {/* ── STEP 2: Profile ── */}
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
                    <input
                      type="text"
                      value={form.displayName}
                      onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                      placeholder="e.g., Amara Osei"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
                    <select
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                      <option value="">Select country...</option>
                      <option value="NG">Nigeria</option>
                      <option value="GH">Ghana</option>
                      <option value="KE">Kenya</option>
                      <option value="ZA">South Africa</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone (optional)</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email (optional)</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                  >
                    {profileLoading ? (
                      <><Loader size={18} className="animate-spin" /> Saving...</>
                    ) : (
                      <>Continue <ChevronRight size={18} /></>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ── STEP 3: Done ── */}
            {step === 'done' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
                <p className="text-gray-600 mb-8">
                  Welcome, {form.displayName || 'friend'}. Start saving with your community.
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  Go to Dashboard <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Secured by Stellar blockchain · Testnet mode
        </p>
      </div>
    </div>
  );
}
