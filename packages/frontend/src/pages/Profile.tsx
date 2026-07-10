import { useWalletStore } from '../store/wallet.store';

export default function Profile() {
  const { address } = useWalletStore();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <div className="bg-gray-100 p-6 rounded-lg">
        <p className="text-gray-600">Wallet Address</p>
        <p className="font-mono text-lg">{address}</p>
      </div>
    </div>
  );
}
