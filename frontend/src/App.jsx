import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import FindEquipment from './pages/FindEquipment.jsx';
import EquipmentDetail from './pages/EquipmentDetail.jsx';
import MyBookings from './pages/MyBookings.jsx';
import Requests from './pages/Requests.jsx';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/find" element={<FindEquipment />} />
          <Route path="/equipment/:id" element={<EquipmentDetail />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
