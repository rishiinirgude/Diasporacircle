export default function Onboarding() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Complete Your Profile</h1>
      <form className="space-y-4">
        <div>
          <label className="block font-semibold mb-2">Display Name</label>
          <input type="text" className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-semibold mb-2">Phone</label>
          <input type="tel" className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-semibold mb-2">Country</label>
          <input type="text" className="w-full border rounded px-3 py-2" />
        </div>
        <button type="submit" className="w-full btn-primary">
          Continue
        </button>
      </form>
    </div>
  );
}
