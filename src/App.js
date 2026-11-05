import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import CustomGeofence from "./components/Pets/CustomGeofence";
import DashboardLayout from "./components/Dashboard/DashboardLayout";
import MultiPetRouteView from "./components/Pets/MultiPetRouteView";
import FiruappDashboard from "./components/Dashboard/FiruappDashboard.tsx";/* Second version glass colors list on map  */
import LostPetsWallPage from "./components/Dashboard/LostPetsWallPage.tsx";
import UsersListPage from "./components/Users/UsersListPage.tsx";
import SensorsListPage from "./components/Users/SensorsListPage.tsx";
import PetsListPage from "./components/Users/PetsListPage.tsx";
import VolunteerGroupsPage from "./components/Users/VolunteerGroupsPage.tsx";
import ProfilePage from "./components/Dashboard/ProfilePage.tsx";
import AlertsPage from "./components/Dashboard/AlertsPage.tsx";
import DogWalksPage from "./components/Walks/DogWalksPage.tsx";
import WalkerDashboard from "./components/Dashboard/WalkerDashboard.tsx";
import { isCurrentUserAdmin } from "./services/auth.ts";

const AdminOnlyRoute = ({ children }) => {
  if (!isCurrentUserAdmin()) {
    return <Navigate to="/owner-dashboard" replace />;
  }

  return children;
};


function App() {
  console.log("App loaded ✅");
  return (
    <Routes>
      {/* Default routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/owner-dashboard" element={<FiruappDashboard />} />
      <Route path="/walker-dashboard" element={<WalkerDashboard />} />

      {/* Protected routes with sidebar layout */}
      <Route element={<DashboardLayout />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/more" element={<Navigate to="/profile" replace />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/walks" element={<DogWalksPage />} />
        <Route path="/geofence" element={<CustomGeofence />} />
        <Route path="/route" element={<Navigate to="/routes/recent" replace />} />
        <Route path="/routes/recent" element={<MultiPetRouteView />} />
        <Route path="/users" element={<AdminOnlyRoute><UsersListPage /></AdminOnlyRoute>} />
        <Route path="/pets" element={<PetsListPage />} />
        <Route path="/sensors" element={<AdminOnlyRoute><SensorsListPage /></AdminOnlyRoute>} />
        <Route path="/volunteers" element={<VolunteerGroupsPage />} />
        <Route path="/lost-pets" element={<LostPetsWallPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
