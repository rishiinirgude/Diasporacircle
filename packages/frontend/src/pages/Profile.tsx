import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWalletStore } from '../store/wallet.store';
import { useWallet } from '../hooks/useWallet';
import { api } from '../lib/api';
import { ReputationProfile } from '../types';
import {
  Star,
  TrendingUp,
  Shield,
  AlertCircle,
  Loader,
  LogOut,
  Copy,
  CheckCircle,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { analytics } from '../lib/analytics';

const TIER_CONFIG = {
  NEW: { label: 'New Member', color: 'bg-gray-100 text-gray-700', bar: 'bg-gray-400', min: 0 },
  BRONZE: { label: 'Bronze', color: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500', min: 100 },
  SILVER: { label: 'Silver', color: 'bg-slate-100 text-slate-700', bar: 'bg-slate-400', min: 300 },
  GOLD: { label: 'Gold', color: 'bg-yellow-100 text-yellow-700', bar: 'bg-yellow-500', min: 600 },
  PLATINUM: { label: 'Platinum', color: 'bg-purple-100 text-purple-700', bar: 'bg-purple-600', min: 900 },
};

export default function Profile() {
  const navigate = useNavigate();
  const { address } = useWalletStore();
  const { disconnect } = useWallet();
  const [reputation, setReputation] = useState<ReputationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!address) {
      navigate('/');
      return;
    }
    analytics.track('profile_viewed', { address });

    const fetchReputation = async () => {
      try {
        const data = await api.get<ReputationProfile>(`/reputation/${address}`);
        setReputation(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load reputation';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchReputation();
  }, [address, navigate]);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
  };

  if (!address) return null;

  const tier = reputation ? TIER_CONFIG[reputation.tier] : TIER_CONFIG['NEW'];
  const scorePercent = reputation ? Math.min((reputation.score / 1000) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 transition">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 flex-1">My Profile</h1>
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition"
          >
            <LogOut size={16} /> Disconnect
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-4">
        {/* Wallet Card */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {address.substring(1, 3).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">Stellar Wallet</p>
                <p className="text-xs text-gray-500">Testnet</p>
              </div>
            </div>
            {reputation && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${tier.color}`}>
                {tier.label}
              </span>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between gap-2">
            <code className="text-xs text-gray-700 break-all flex-1">
              {address}
            </code>
            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 transition"
              title="Copy address"
            >
              {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>

          <a
            href={`https://stellar.expert/explorer/testnet/account/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            View on Stellar Expert <ExternalLink size={12} />
          </a>
        </div>

        {/* Reputation */}
        {loading ? (
          <div className="bg-white rounded-xl border p-6 flex items-center justify-center gap-3">
            <Loader size={20} className="animate-spin text-blue-600" />
            <p className="text-gray-600">Loading reputation...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        ) : reputation ? (
          <>
            {/* Score Card */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star size={20} className="text-yellow-500" />
                <h2 className="font-bold text-gray-900">Reputation Score</h2>
              </div>

              <div className="flex items-end gap-3 mb-3">
                <span className="text-5xl font-bold text-gray-900">{reputation.score}</span>
                <span className="text-gray-500 mb-2">/ 1000</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className={`h-3 rounded-full transition-all ${tier.bar}`}
                  style={{ width: `${scorePercent}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                <span>NEW</span>
                <span>BRONZE</span>
                <span>SILVER</span>
                <span>GOLD</span>
                <span>PLATINUM</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-blue-600" />
                  <p className="text-sm text-gray-600">Circles Done</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{reputation.circlesCompleted}</p>
              </div>

              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-green-600" />
                  <p className="text-sm text-gray-600">On-Time Rate</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {reputation.onTimePercentage}%
                </p>
              </div>

              <div className="bg-white rounded-xl border p-4">
                <p className="text-sm text-gray-600 mb-2">✅ On Time</p>
                <p className="text-2xl font-bold text-green-600">{reputation.totalOnTime}</p>
              </div>

              <div className="bg-white rounded-xl border p-4">
                <p className="text-sm text-gray-600 mb-2">❌ Defaulted</p>
                <p className="text-2xl font-bold text-red-500">{reputation.totalDefaulted}</p>
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm">How reputation works</h3>
              <p className="text-blue-800 text-sm">
                Your score is calculated from your payment history across all circles.
                Pay on time to improve your score and unlock higher trust tiers.
                Organizers can filter members by reputation tier.
              </p>
            </div>
          </>
        ) : null}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          <Link
            to="/dashboard"
            className="flex-1 py-3 text-center border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition text-sm"
          >
            My Circles
          </Link>
          <Link
            to="/circles/create"
            className="flex-1 py-3 text-center bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
          >
            Create Circle
          </Link>
        </div>
      </div>
    </div>
  );
}
