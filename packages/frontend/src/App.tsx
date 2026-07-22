import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CircleDetail from './pages/CircleDetail';
import CreateCircle from './pages/CreateCircle';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Feedback from './pages/Feedback';
import Join from './pages/Join';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/circles/create" element={<CreateCircle />} />
        <Route path="/circles/:id" element={<CircleDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/join" element={<Join />} />
      </Routes>
    </Router>
  );
}

export default App;
