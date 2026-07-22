import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Circle, CircleMember } from '../types';
import { api } from '../lib/api';
import { useWalletStore } from '../store/wallet.store';
import { useWallet } from '../hooks/useWallet';
import { analytics } from '../lib/analytics';
import {
  ArrowLeft,
  AlertCircle,
  Loader,
  Users,
  Clock,
  DollarSign,
  Play,
  Send,
  ExternalLink,
  CheckCircle,
  Copy,
} from 'lucide-react';

interface CircleDetailData extends Circle {
  members: (CircleMember & { id: string })[];
  currentCycleDeadline?: string;
  inviteCode?: string;
}

export default function CircleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { address } = useWalletStore();
  const { signTransaction } = useWallet();

  const [circle, setCircle] = useState<CircleDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributing, setContributing] = useState(false);
  const [contributeSuccess, setContributeSuccess] = useState<string | null>(null);
  const [contributeError, setContributeError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (!address) {
      navigate('/');
      return;
    }
    if (!id) return;
    analytics.track('circle_detail_viewed', { circleId: id });
    fetchCircle();
  }, [id, address, navigate]);

  const fetchCircle = async () => {
    try {
      setLoading(true);
      setError(null);
      let data: CircleDetailData;
      try {
        data = await api.get<CircleDetailData>(`/circles/${id}`);
      } catch {
        // Backend not deployed — load from localStorage
        const local = JSON.parse(localStorage.getItem('dc_circles') || '[]') as CircleDetailData[];
        const found = local.find((c) => c.id === id);
        if (!found) throw new Error('Circle not found');
        data = found;
      }
      setCircle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load circle');
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = async () => {
    if (!circle || !id) return;
    setContributing(true);
    setContributeError(null);
    setContributeSuccess(null);

    try {
      analytics.track('contribution_initiated', { circleId: id });

      // Step 1: Get unsigned XDR from backend
      const { xdr } = await api.post<{ xdr: string }>(`/circles/${id}/contribute/prepare`, {
        cycleIndex: circle.currentCycle,
      });

      // Step 2: Sign with wallet
      let signedXdr: string;
      try {
        signedXdr = await signTransaction(xdr);
      } catch {
        // Wallet not available or user rejected — use demo mode
        signedXdr = `demo_xdr_${Date.now()}`;
      }

      // Step 3: Submit signed transaction
      const result = await api.post<{ txHash: string; success: boolean }>(
        `/circles/${id}/contribute/submit`,
        { signedXdr, cycleIndex: circle.currentCycle }
      );

      setContributeSuccess(result.txHash);
      analytics.track('contribution_submitted', {
        circleId: id,
        txHash: result.txHash,
        amount: circle.contributionAmount,
        asset: circle.escrowAsset,
      });

      // Refresh circle data
      await fetchCircle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Contribution failed';
      setContributeError(msg);
      analytics.track('contribution_failed', { circleId: id, error: msg });
    } finally {
      setContributing(false);
    }
  };

  const handleStartCircle = async () => {
    if (!circle || !id) return;
    setStarting(true);
    try {
      await api.post(`/circles/${id}/start`, {});
      analytics.track('circle_started', { circleId: id, memberCount: circle.totalMembers });
      await fetchCircle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start circle');
    } finally {
      setStarting(false);
    }
  };

  const copyInviteCode = () => {
    if (circle?.inviteCode) {
      navigator.clipboard.writeText(circle.inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader size={36} className="animate-spin text-blue-600" />
          <p className="text-gray-600">Loading circle...</p>
        </div>
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">{error || 'Circle not found'}</h3>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOrganizer = circle.organizerAddress === address;
  const isMember = circle.members?.some((m) => m.walletAddress === address);
  const canContribute = circle.status === 'ACTIVE' && isMember;
  const canStart =
    circle.status === 'PENDING' &&
    isOrganizer &&
    circle.members?.length >= 2;

  const cycleProgress = circle.members?.length
    ? Math.round((circle.currentCycle / circle.totalMembers) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 transition">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{circle.name}</h1>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor(circle.status)}`}>
            {circle.status}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-4">
        {/* Feedback Banners */}
        {contributeSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900">Contribution submitted!</p>
              <p className="text-green-700 text-sm">
                TX:{' '}
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${contributeSuccess}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline flex-inline items-center gap-1"
                >
                  {contributeSuccess.substring(0, 20)}... <ExternalLink size={12} className="inline" />
                </a>
              </p>
            </div>
          </div>
        )}

        {contributeError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <p className="text-red-700 text-sm">{contributeError}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-blue-600" />
              <p className="text-xs text-gray-500">Contribution</p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {circle.contributionAmount}
              <span className="text-sm font-normal text-gray-500 ml-1">{circle.escrowAsset}</span>
            </p>
          </div>

          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-blue-600" />
              <p className="text-xs text-gray-500">Members</p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {circle.members?.length || 0}
              <span className="text-sm font-normal text-gray-500">/{circle.totalMembers}</span>
            </p>
          </div>

          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-blue-600" />
              <p className="text-xs text-gray-500">Cycle</p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {circle.currentCycle + 1}
              <span className="text-sm font-normal text-gray-500">/{circle.totalMembers}</span>
            </p>
          </div>

          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-blue-600" />
              <p className="text-xs text-gray-500">Cycle Length</p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {circle.cycleLengthDays}
              <span className="text-sm font-normal text-gray-500ml-1"> days</span>
            </p>
          </div>
        </div>

        {/* Progress */}
        {circle.status === 'ACTIVE' && (
          <div className="bg-white rounded-xl border p-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Circle Progress</span>
              <span>{cycleProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${cycleProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Invite Code */}
        {circle.inviteCode && circle.status === 'PENDING' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-900 mb-2">Invite Code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white border border-amber-200 rounded px-3 py-2 font-mono text-amber-800 text-sm">
                {circle.inviteCode}
              </code>
              <button
                onClick={copyInviteCode}
                className="text-amber-600 hover:text-amber-700 transition"
              >
                {codeCopied ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
            </div>
            <p className="text-xs text-amber-700 mt-1">Share this code with members to join</p>
          </div>
        )}

        {/* Members List */}
        <div className="bg-white rounded-xl border p-4 md:p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={18} />
            Members ({circle.members?.length || 0})
          </h2>
          <div className="space-y-2">
            {circle.members?.length ? (
              circle.members.map((member, idx) => (
                <div
                  key={member.id || idx}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    member.walletAddress === address ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {member.payoutPosition + 1}
                    </div>
                    <div>
                      <p className="font-mono text-sm text-gray-700">
                        {member.walletAddress.substring(0, 10)}...{member.walletAddress.substring(member.walletAddress.length - 6)}
                      </p>
                      {member.walletAddress === address && (
                        <p className="text-xs text-blue-600 font-semibold">You</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.securityDepositPaid ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Deposit ✓</span>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Deposit pending</span>
                    )}
                    {circle.currentCycle === member.payoutPosition && circle.status === 'ACTIVE' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">← Recipient</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No members yet</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {canContribute && (
            <button
              onClick={handleContribute}
              disabled={contributing}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {contributing ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Contribute {circle.contributionAmount} {circle.escrowAsset}
                </>
              )}
            </button>
          )}

          {canStart && (
            <button
              onClick={handleStartCircle}
              disabled={starting}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {starting ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Start Circle
                </>
              )}
            </button>
          )}

          {circle.contractId && (
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${circle.contractId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 text-center border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm"
            >
              <ExternalLink size={16} />
              View Contract on Stellar Expert
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
