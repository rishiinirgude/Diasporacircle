import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useWalletStore } from '../store/wallet.store';
import { AlertCircle, Loader } from 'lucide-react';

export default function CreateCircle() {
  const navigate = useNavigate();
  const { address } = useWalletStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    contributionAmount: 100,
    cycleLengthDays: 30,
    escrowAsset: 'native',
    memberWallets: '',
  });

  if (!address) {
    navigate('/');
    return null;
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === 'contributionAmount' || name === 'cycleLengthDays'
          ? Number(value)
          : value,
    });
  };

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!formData.name.trim()) {
        setError('Circle name is required');
        return false;
      }
      if (formData.contributionAmount <= 0) {
        setError('Contribution amount must be positive');
        return false;
      }
      if (formData.cycleLengthDays <= 0) {
        setError('Cycle length must be positive');
        return false;
      }
    } else if (step === 2) {
      const wallets = formData.memberWallets
        .split('\n')
        .map((w) => w.trim())
        .filter(Boolean);
      if (wallets.length < 1) {
        setError('At least 1 other member required');
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);

    try {
      const memberWallets = formData.memberWallets
        .split('\n')
        .map((w) => w.trim())
        .filter(Boolean);

      // Create circle via backend
      const data = await api.post<{ id: string; inviteCode: string }>('/circles', {
        ...formData,
        memberWallets,
        payoutOrder: memberWallets,
      });
      const circleId = data.id;
      const inviteCode = data.inviteCode;
      navigate(`/dashboard?created=${circleId}&code=${inviteCode}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create circle';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900">Create a Circle</h1>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex items-center ${s < 3 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base ${
                    s <= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      s < step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs md:text-sm text-gray-600">
            <span>Circle Details</span>
            <span>Members</span>
            <span>Review</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 md:p-8">
          {/* Step 1: Basic Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block font-semibold mb-2 text-gray-900">
                  Circle Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Friends Fund"
                  className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2 text-gray-900">
                  Contribution Amount *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="contributionAmount"
                    value={formData.contributionAmount}
                    onChange={handleInputChange}
                    placeholder="100"
                    className="flex-1 border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    step="0.01"
                    required
                  />
                  <select
                    name="escrowAsset"
                    value={formData.escrowAsset}
                    onChange={handleInputChange}
                    className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-700"
                  >
                    <option value="native">XLM</option>
                    <option value="USDC">USDC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2 text-gray-900">
                  Cycle Length (days) *
                </label>
                <input
                  type="number"
                  name="cycleLengthDays"
                  value={formData.cycleLengthDays}
                  onChange={handleInputChange}
                  placeholder="30"
                  className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  min="1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Each member has this many days to contribute per cycle
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Members */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block font-semibold mb-2 text-gray-900">
                  Member Wallet Addresses *
                </label>
                <textarea
                  name="memberWallets"
                  value={formData.memberWallets}
                  onChange={handleInputChange}
                  placeholder="GXXXXXX...
GYYYY..."
                  className="w-full border rounded px-4 py-2 h-40 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  One Stellar public key per line. You (the organizer) are automatically added as a member.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Review Circle Details</h2>

              <div className="bg-gray-50 rounded p-4 space-y-4">
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-gray-600">Circle Name:</span>
                  <span className="font-semibold text-gray-900">{formData.name}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-gray-600">Contribution Amount:</span>
                  <span className="font-semibold text-gray-900">
                    {formData.contributionAmount} {formData.escrowAsset}
                  </span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-gray-600">Cycle Length:</span>
                  <span className="font-semibold text-gray-900">
                    {formData.cycleLengthDays} days
                  </span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-gray-600">Total Members:</span>
                  <span className="font-semibold text-gray-900">
                    {
                      formData.memberWallets
                        .split('\n')
                        .map((w) => w.trim())
                        .filter(Boolean).length + 1
                    } (including you)
                  </span>
                </div>
              </div>

              <p className="text-xs md:text-sm text-gray-600">
                By creating this circle, you agree that funds will be held in escrow via smart contract.
                Members must have their Stellar wallets ready to receive payouts.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="flex-1 px-4 py-2 border rounded font-semibold text-gray-900 hover:bg-gray-50 transition disabled:opacity-50 text-sm md:text-base"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition text-sm md:text-base"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
              >
                {loading && <Loader size={16} className="animate-spin" />}
                {loading ? 'Creating...' : 'Create Circle'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
