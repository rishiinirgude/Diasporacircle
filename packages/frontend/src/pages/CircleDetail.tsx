import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Circle } from '@diasporacircle/shared';
import { api } from '../lib/api';

export default function CircleDetail() {
  const { id } = useParams<{ id: string }>();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchCircle = async () => {
      try {
        const data = await api.get<Circle>(`/circles/${id}`);
        setCircle(data);
      } catch (err) {
        console.error('Failed to load circle:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCircle();
  }, [id]);

  if (loading) return <div>Loading circle...</div>;
  if (!circle) return <div>Circle not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{circle.name}</h1>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-100 p-4 rounded">
          <p className="text-gray-600">Contribution Amount</p>
          <p className="text-2xl font-bold">{circle.contributionAmount}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <p className="text-gray-600">Cycle Length</p>
          <p className="text-2xl font-bold">{circle.cycleLengthDays} days</p>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Members</h2>
        <div className="space-y-2">
          {circle.members?.map((member) => (
            <div key={member.id} className="flex justify-between items-center p-2">
              <span className="font-mono text-sm">
                {member.walletAddress.substring(0, 8)}...
              </span>
              <span className="text-sm">Position: {member.payoutPosition}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
