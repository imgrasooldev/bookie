import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { Login } from "./components/Login";
import { Layout } from "./components/Layout";
import { AdminLayout } from "./components/AdminLayout";
import { Dashboard } from "./pages/Dashboard";
import { Fleet } from "./pages/Fleet";
import { Schedules } from "./pages/Schedules";
import { Bookings } from "./pages/Bookings";
import { AdminOverview } from "./pages/admin/AdminOverview";
import { AdminOperators } from "./pages/admin/AdminOperators";
import { AdminApprovals } from "./pages/admin/AdminApprovals";
import { AdminRoles } from "./pages/admin/AdminRoles";
import { AdminTeam } from "./pages/admin/AdminTeam";

function OperatorApp() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="fleet" element={<Fleet />} />
          <Route path="schedules" element={<Schedules />} />
          <Route path="bookings" element={<Bookings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

function AdminApp() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="operators" element={<AdminOperators />} />
          <Route path="approvals" element={<AdminApprovals />} />
          <Route path="roles" element={<AdminRoles />} />
          <Route path="team" element={<AdminTeam />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

function Console() {
  const { role, operator } = useAuth();
  if (!role) return <Login />;
  if (role === "admin") return <AdminApp />;
  if (!operator) return <Login />;
  return <OperatorApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <Console />
    </AuthProvider>
  );
}
