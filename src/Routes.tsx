
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ConfigProvider, theme, App as AntdApp } from 'antd'
import trTR from 'antd/locale/tr_TR'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { ProtectedRoute, HomeRoute } from './components/layout'
import Login from './views/LoginPage/Login'
import Dashboard from './views/DashboardPage/Dashboard'
import Profile from './views/ProfilePage/Profile'
import EducationInfo from './views/EducationInfo'
import Goals from './views/GoalsPage/Goals'
import StudyTracker from './views/StudyTrackerPage/StudyTracker'
import { AppLayout } from './components/layout'

// Ant Design tema konfigürasyonunu içeren iç component
function ThemedApp() {
  const { isDark } = useTheme();
  
  const antdTheme = {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 8,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    components: {
      Layout: {
        headerBg: isDark ? '#1f1f1f' : '#fff',
        bodyBg: isDark ? '#0f1419' : '#f5f5f5',
        colorBgContainer: isDark ? '#1f1f1f' : '#fff'
      },
      Menu: {
        colorBgContainer: isDark ? '#1f1f1f' : '#fff',
        itemColor: isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.88)',
        itemSelectedColor: isDark ? '#40a9ff' : '#1890ff',
        itemHoverColor: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.75)',
        itemSelectedBg: isDark ? 'rgba(64, 169, 255, 0.2)' : '#e6f7ff'
      },
      Card: {
        colorBgContainer: isDark ? '#1f1f1f' : '#fff'
      },
      Button: {
        colorBgTextHover: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        colorBgTextActive: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'
      }
    }
  };

  return (
    <ConfigProvider 
      locale={trTR}
      theme={antdTheme}
    >
      <AntdApp>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<HomeRoute />} />
              
              {/* Protected Routes - AppLayout ile sarmalanır */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/education" element={<EducationInfo />} />
                      <Route path="/goals" element={<Goals />} />
                      <Route path="/study-tracker" element={<StudyTracker />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

export default App
