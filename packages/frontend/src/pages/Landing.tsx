import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Lock, Globe, TrendingUp } from 'lucide-react';
import { useWalletStore } from '../store/wallet.store';

export default function Landing() {
  const { address } = useWalletStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2540] via-blue-900 to-blue-800 text-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-4 md:p-6 max-w-6xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold text-[#f59e0b]">DiasporaCircle</h1>
        <Link
          to={address ? '/dashboard' : '/onboarding'}
          className="px-4 md:px-6 py-2 bg-[#f59e0b] text-navy rounded-lg font-semibold hover:bg-amber-400 transition text-sm md:text-base"
        >
          {address ? 'Dashboard' : 'Get Started'}
        </Link>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Your Savings Circle, On-Chain
          </h2>
          <p className="text-base md:text-xl text-gray-200 mb-8">
            No trust required. Smart contracts secure your funds on Stellar.
          </p>
          <Link
            to={address ? '/dashboard' : '/onboarding'}
            className="inline-flex items-center gap-2 px-6 md:px-8 py-3 bg-[#f59e0b] text-navy rounded-lg font-semibold hover:bg-amber-400 transition text-sm md:text-base"
          >
            {address ? 'Go to Dashboard' : 'Connect Wallet'} <ArrowRight size={20} />
          </Link>
        </div>

        {/* How it works */}
        <div className="mt-16 md:mt-20">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {[
              { step: '1', title: 'Create', desc: 'Start a circle with friends', icon: Zap },
              {
                step: '2',
                title: 'Invite',
                desc: 'Share invite code securely',
                icon: Globe,
              },
              {
                step: '3',
                title: 'Fund Each Cycle',
                desc: 'Contribute to the pot',
                icon: TrendingUp,
              },
              {
                step: '4',
                title: 'Collect Your Pot',
                desc: 'Receive your payout',
                icon: Lock,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="bg-blue-800 bg-opacity-50 p-4 md:p-6 rounded-lg hover:bg-opacity-70 transition">
                  <Icon size={32} className="text-[#f59e0b] mb-3" />
                  <div className="text-2xl md:text-3xl font-bold text-[#f59e0b] mb-3">
                    {item.step}
                  </div>
                  <h4 className="text-lg font-semibold mb-2">{item.title}</h4>
                  <p className="text-gray-300 text-sm md:text-base">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 md:mt-20 bg-blue-800 bg-opacity-30 p-6 md:p-12 rounded-lg">
          <h3 className="text-xl md:text-2xl font-bold mb-6 md:mb-8">Why DiasporaCircle?</h3>
          <ul className="space-y-3 md:space-y-4 text-base md:text-lg">
            <li className="flex items-center gap-3">
              <span className="text-[#f59e0b] text-2xl flex-shrink-0">✓</span>
              <span>Smart contracts hold funds in escrow</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-[#f59e0b] text-2xl flex-shrink-0">✓</span>
              <span>No organizer can steal funds</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-[#f59e0b] text-2xl flex-shrink-0">✓</span>
              <span>Fund in local currency via anchors</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-[#f59e0b] text-2xl flex-shrink-0">✓</span>
              <span>On-chain reputation tracking</span>
            </li>
          </ul>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 md:mt-16 text-center">
          <p className="text-gray-300 mb-6">Ready to join the revolution?</p>
          <Link
            to={address ? '/dashboard' : '/onboarding'}
            className="inline-flex items-center gap-2 px-6 md:px-8 py-3 bg-[#f59e0b] text-navy rounded-lg font-semibold hover:bg-amber-400 transition"
          >
            Start Now <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}
