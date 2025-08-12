import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React from "react";
import { ConfigProvider, theme, App as AntdApp } from "antd";
import trTR from "antd/locale/tr_TR";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { ProtectedRoute, HomeRoute } from "./components/layout";
import Login from "./views/LoginPage/Login";
import Dashboard from "./views/DashboardPage/Dashboard";
import Profile from "./views/ProfilePage/Profile";
import EducationInfo from "./views/EducationInfo";
import Goals from "./views/GoalsPage/Goals";
import StudyTracker from "./views/StudyTrackerPage/StudyTracker";
import StudyPlan from "./views/StudyPlanPage/StudyPlan";
import CoachDashboard from "./views/CoachDashboard/CoachDashboard";
import { AppLayout } from "./components/layout";
import ProgramManager from "./views/CoachDashboard/ProgramManager";
import StudentsList from "./views/CoachDashboard/StudentsList";
import StudentDetail from "./views/CoachDashboard/StudentDetail";
import CreateProgram from "./views/CoachDashboard/CreateProgram";
import StudentCoachPage from "./views/StudentCoach/StudentCoachPage";
import StudentProgramDetail from "./views/StudentCoach/StudentProgramDetail";
import FeedbackList from "./views/Admin/FeedbackList";
import FeedbackDetail from "./views/Admin/FeedbackDetail";
import AdminDashboard from "./views/AdminDashboard/AdminDashboard";
import CoachesList from "./views/Admin/CoachesList";
import CoachDetail from "./views/Admin/CoachDetail";
import AssignmentManager from "./views/Admin/AssignmentManager";
import Statistics from "./views/Admin/Statistics";
// Ant Design tema konfigürasyonunu içeren iç component
function ThemedApp() {
  const { isDark } = useTheme();

  const antdTheme = {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: "#1890ff",
      borderRadius: 8,
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    components: {
      Layout: {
        headerBg: isDark ? "#1f1f1f" : "#fff",
        bodyBg: isDark ? "#0f1419" : "#f5f5f5",
        colorBgContainer: isDark ? "#1f1f1f" : "#fff",
      },
      Menu: {
        colorBgContainer: isDark ? "#1f1f1f" : "#fff",
        itemColor: isDark ? "rgba(255, 255, 255, 0.75)" : "rgba(0, 0, 0, 0.88)",
        itemSelectedColor: isDark ? "#40a9ff" : "#1890ff",
        itemHoverColor: isDark
          ? "rgba(255, 255, 255, 0.9)"
          : "rgba(0, 0, 0, 0.75)",
        itemSelectedBg: isDark ? "rgba(64, 169, 255, 0.2)" : "#e6f7ff",
      },
      Card: {
        colorBgContainer: isDark ? "#1f1f1f" : "#fff",
      },
      Button: {
        colorBgTextHover: isDark
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(0, 0, 0, 0.06)",
        colorBgTextActive: isDark
          ? "rgba(255, 255, 255, 0.15)"
          : "rgba(0, 0, 0, 0.15)",
      },
    },
  };

  return (
    <ConfigProvider locale={trTR} theme={antdTheme}>
      <AntdApp>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<HomeRoute />} />

              {/* Protected Routes - AppLayout ile sarmalanır */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        {/* Student routes */}
                        <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute allowedRoles={["student"]}>
                              <Dashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/student/coach"
                          element={
                            <ProtectedRoute allowedRoles={["student"]}>
                              <StudentCoachPage />
                            </ProtectedRoute>
                          }
                        />
                         <Route
                           path="/student/programs/:id"
                           element={
                             <ProtectedRoute allowedRoles={["student"]}>
                               <StudentProgramDetail />
                             </ProtectedRoute>
                           }
                         />
                        <Route
                          path="/study-tracker"
                          element={
                            <ProtectedRoute allowedRoles={["student"]}>
                              <StudyTracker />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/study-plan"
                          element={
                            <ProtectedRoute allowedRoles={["student"]}>
                              <StudyPlan />
                            </ProtectedRoute>
                          }
                        />

                        {/* Coach routes */}
                        <Route
                          path="/coach/programs"
                          element={
                            <ProtectedRoute allowedRoles={["coach", "admin"]}>
                              <ProgramManager />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/coach-dashboard"
                          element={
                            <ProtectedRoute allowedRoles={["coach", "admin"]}>
                              <CoachDashboard />
                            </ProtectedRoute>
                          }
                        />

                        <Route
                          path="/coach/students"
                          element={
                            <ProtectedRoute allowedRoles={["coach", "admin"]}>
                              <StudentsList />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/coach/students/:id"
                          element={
                            <ProtectedRoute allowedRoles={["coach", "admin"]}>
                              <StudentDetail />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/coach/programs/create"
                          element={
                            <ProtectedRoute allowedRoles={["coach", "admin"]}>
                              <CreateProgram />
                            </ProtectedRoute>
                          }
                        />

                        {/* Admin routes */}
                        <Route
                          path="/admin-dashboard"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <AdminDashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin/coaches"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <CoachesList />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin/coaches/:id"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <CoachDetail />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin/assignments"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <AssignmentManager />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin/statistics"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <Statistics />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin/feedback"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <FeedbackList />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin/feedback/:id"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <FeedbackDetail />
                            </ProtectedRoute>
                          }
                        />

                        {/* Shared */}
                        <Route path="/profile" element={<Profile />} />
                        <Route
                          path="/education"
                          element={
                            <ProtectedRoute allowedRoles={["student"]}>
                              <EducationInfo />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/goals"
                          element={
                            <ProtectedRoute allowedRoles={["student"]}>
                              <Goals />
                            </ProtectedRoute>
                          }
                        />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

// Basit Error Boundary
class RootErrorBoundary extends React.Component<React.PropsWithChildren, { hasError: boolean }> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    // TODO: Sentry/Log servis entegrasyonu
    console.error('Uygulama hatası:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 520, textAlign: 'center' }}>
            <h2>Bir şeyler ters gitti</h2>
            <p>Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
            <button onClick={() => window.location.reload()}>Yenile</button>
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

function App() {
  return (
    <ThemeProvider>
      <RootErrorBoundary>
        <ThemedApp />
      </RootErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
