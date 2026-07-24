import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader, Users } from 'lucide-react';
import { useWalletStore } from '../store/wallet.store';
import { analytics } from '../lib/analytics';
import { api } from '../lib/api';

export default function Join() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') ?? '';
  const { address, isConnected } = useWalletStore();

  const [status, setStatus] = useState<'idle' | 'joining' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleJoin = async () => {
    if (!address) {
      navigate(`/onboarding?return=/join?code=${encodeURIComponent(code)}`);
      return;
    }

    setStatus('joining');
    try {
      // Join via backend using the short invite code
      await api.post(`/circles/join/${code}`, {});
      analytics.track('circle_joined', { code, address });
      setStatus('done');
      setMessage('You have joined the circle!');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to join. Make sure the invite link is correct.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2540] via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users size={28} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join a Circle</h1>
          {code && (
            <p className="text-gray-500 text-sm mt-1">
              Invite code: <span className="font-mono font-semibold text-gray-700">{code}</span>
            </p>
          )}
        </div>

        {!code && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-700 text-sm">Invalid invite link. Please ask the organizer for a new link.</p>
          </div>
        )}

        {code && status === 'idle' && (
          <div>
            {!isConnected && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
                You need to connect your wallet first to join this circle.
              </div>
            )}

            {isConnected && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                <p className="text-green-800 text-sm font-mono">
                  {address!.substring(0, 10)}...{address!.substring(address!.length - 6)}
                </p>
              </div>
            )}

            <button
              onClick={handleJoin}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <Users size={18} />
              {isConnected ? 'Join Circle' : 'Connect Wallet & Join'}
            </button>
          </div>
        )}

        {status === 'joining' && (
          <div className="text-center py-4">
            <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-gray-600">Joining circle...</p>
          </div>
        )}

        {status === 'done' && (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <p className="text-xl font-bold text-gray-900 mb-2">Joined!</p>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              to="/dashboard"
              className="w-full block py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-center"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{message}</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          DiasporaCircle · Rotating savings on Stellar
        </p>
      </div>
    </div>
  );
}
