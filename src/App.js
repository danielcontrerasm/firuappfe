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
 // ✅ no {}


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

      {/* Protected routes with sidebar layout */}
      <Route element={<DashboardLayout />}>
        <Route path="/geofence" element={<CustomGeofence />} />
        <Route path="/route" element={<Navigate to="/routes/recent" replace />} />
        <Route path="/routes/recent" element={<MultiPetRouteView />} />
        <Route path="/users" element={<UsersListPage />} />
        <Route path="/pets" element={<PetsListPage />} />
        <Route path="/sensors" element={<SensorsListPage />} />
        <Route path="/volunteers" element={<VolunteerGroupsPage />} />
        <Route path="/lost-pets" element={<LostPetsWallPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
