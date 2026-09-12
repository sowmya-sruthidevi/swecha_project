import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ExploreGroups from './pages/ExploreGroups.jsx';
import CreateGroup from './pages/CreateGroup.jsx';
import EditGroup from './pages/EditGroup.jsx';
import MyGroups from './pages/MyGroups.jsx';
import GroupDetails from './pages/GroupDetails.jsx';
import Profile from './pages/Profile.jsx';
import Notifications from './pages/Notifications.jsx';
import ChatbotPage from './pages/ChatbotPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import FloatingRobo from './components/FloatingRobo.jsx';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/chatbot" element={<ChatbotPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <ExploreGroups />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-group"
          element={
            <ProtectedRoute>
              <CreateGroup />
            </ProtectedRoute>
          }
        />

        <Route
          path="/groups/:id/edit"
          element={
            <ProtectedRoute>
              <EditGroup />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-groups"
          element={
            <ProtectedRoute>
              <MyGroups />
            </ProtectedRoute>
          }
        />

        <Route
          path="/groups/:id"
          element={
            <ProtectedRoute>
              <GroupDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Home />} />
      </Routes>

      {/* Floating Robot Chatbot Assistant - accessible globally across pages */}
      <FloatingRobo />
    </>
  );
}

export default App;
