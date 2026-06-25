import { HashRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Operators } from "./pages/Operators";
import { Fleet } from "./pages/Fleet";
import { Schedules } from "./pages/Schedules";
import { Trips } from "./pages/Trips";
import { Bookings } from "./pages/Bookings";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="operators" element={<Operators />} />
          <Route path="fleet" element={<Fleet />} />
          <Route path="schedules" element={<Schedules />} />
          <Route path="trips" element={<Trips />} />
          <Route path="bookings" element={<Bookings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
