import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { Login } from "./components/Login";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Operators } from "./pages/Operators";
import { Fleet } from "./pages/Fleet";
import { Schedules } from "./pages/Schedules";
import { Trips } from "./pages/Trips";
import { Bookings } from "./pages/Bookings";

function Console() {
  const { operator } = useAuth();
  if (!operator) return <Login />;
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="fleet" element={<Fleet />} />
          <Route path="schedules" element={<Schedules />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="operators" element={<Operators />} />
          <Route path="trips" element={<Trips />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Console />
    </AuthProvider>
  );
}
