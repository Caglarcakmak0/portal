import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Spin } from 'antd'

/**
 * HomeRoute komponenti - Ana sayfa (/) için akıllı yönlendirme
 * 
 * Kullanıcı durumuna göre otomatik yönlendirme yapar:
 * - Login olmuşsa: Dashboard'a yönlendir
 * - Login olmamışsa: Login sayfasına yönlendir
 * - Auth kontrol ediliyor: Loading göster
 */
const HomeRoute = () => {
  const { isAuthenticated, loading } = useAuth()

  // Auth durumu kontrol ediliyor - loading göster
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f0f2f5'
      }}>
        {/* Yükleniyor spinner'ı */}
        <Spin size="large" />
      </div>
    )
  }

  // Kullanıcı login olmuşsa dashboard'a yönlendir
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  // Kullanıcı login olmamışsa login sayfasına yönlendir
  return <Navigate to="/login" replace />
}

export default HomeRoute