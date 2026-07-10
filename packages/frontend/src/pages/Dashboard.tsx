import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Circle } from '../types';
import { api } from '../lib/api';
import { useWalletStore } from '../store/wallet.store';
import { Plus, AlertCircle, Loader } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { address } = useWalletStore();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      navigate('/');
      return;
    }

    const fetchCircles = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<Circle[]>('/circles');
        setCircles(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load circles';
        setError(message);
        console.error('Failed to load circles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCircles();
  }, [address, navigate]);

  if (!address) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Circles</h1>
            <button
              onClick={() => navigate('/circles/create')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm md:text-base"
            >
              <Plus size={20} /> New Circle
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Wallet: {address.substring(0, 8)}...{address.substring(address.length - 6)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader size={40} className="text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading your circles...</p>
          </div>
        ) : circles.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 md:py-16 bg-white rounded-lg border border-gray-200">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">No circles yet</h2>
            <p className="text-gray-600 mb-6">Create your first savings circle to get started</p>
            <button
              onClick={() => navigate('/circles/create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} /> Create Your First Circle
            </button>
          </div>
        ) : (
          /* Circles Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {circles.map((circle) => (
              <button
                key={circle.id}
                onClick={() => navigate(`/circles/${circle.id}`)}
                className="text-left bg-white border rounded-lg p-4 md:p-6 hover:shadow-lg transition transform hover:scale-105"
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 break-words flex-1">{circle.name}</h2>
                  <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ml-2 ${
                    circle.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    circle.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    circle.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {circle.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-semibold">{circle.members?.length || 0}</span> / {circle.totalMembers} members
                  </p>
                  <p>
                    <span className="font-semibold">{circle.contributionAmount}</span> {circle.escrowAsset}
                  </p>
                  <p>
                    Cycle <span className="font-semibold">{circle.currentCycle + 1}</span> of {circle.totalMembers}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <span className="text-blue-600 text-sm font-semibold hover:underline">View Details →</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
