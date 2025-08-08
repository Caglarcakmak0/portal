import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Typography, Dropdown, Badge, Tooltip } from 'antd';
import {
  AimOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BellOutlined,
  UserOutlined,
  SunOutlined,
  MoonOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { routeMenu, getPageTitle } from '../../config/routeMenu';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { themeMode, isDark, toggleTheme } = useTheme();

  // Menu click handler
  const handleMenuClick = ({ key }: { key: string }) => {
    if (key.startsWith('/')) {
      navigate(key);
    }
  };

  // User dropdown menu
  const userMenuItems = [
    {
      key: 'profile-settings',
      icon: <UserOutlined />,
      label: 'Profil Ayarları',
      onClick: () => navigate('/profile')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Ayarlar',
      disabled: true // Henüz hazır değil
    },
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Çıkış Yap',
      onClick: () => {
        logout();
        navigate('/login');
      }
    }
  ];

  // Tema toggle butonu
  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light':
        return <SunOutlined />;
      case 'dark':
        return <MoonOutlined />;
      case 'auto':
        return <BulbOutlined />;
      default:
        return <SunOutlined />;
    }
  };

  const getThemeTooltip = () => {
    switch (themeMode) {
      case 'light':
        return 'Light Mode - Dark Mode\'a geçmek için tıkla';
      case 'dark':
        return 'Dark Mode - Auto Mode\'a geçmek için tıkla';
      case 'auto':
        return 'Auto Mode - Light Mode\'a geçmek için tıkla';
      default:
        return 'Tema değiştir';
    }
  };

  // Aktif menü key'ini belirle
  const getSelectedMenuKey = () => {
    return [location.pathname];
  };

  // Submenu açık tutma handler
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  // Sayfa değiştiğinde ilgili submenu'yu aç
  React.useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/profile') || path.startsWith('/education') || path.startsWith('/goals')) {
      setOpenKeys(['profile']);
    } else {
      setOpenKeys([]);
    }
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={250}
        style={{
          background: isDark ? '#1f1f1f' : '#fff',
          borderRight: `1px solid ${isDark ? '#434343' : '#f0f0f0'}`
        }}
      >
        {/* Logo/Brand */}
        <div style={{ 
          height: '64px', 
          padding: '16px', 
          borderBottom: `1px solid ${isDark ? '#434343' : '#f0f0f0'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start'
        }}>
          {collapsed ? (
            <AimOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AimOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <Text strong style={{ color: '#1890ff', fontSize: '18px' }}>
                YKS Portal
              </Text>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          mode="inline"
          selectedKeys={getSelectedMenuKey()}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          items={routeMenu}
          onClick={handleMenuClick}
          style={{ 
            border: 'none',
            height: 'calc(100vh - 64px)'
          }}
        />
      </Sider>

      {/* Main Layout */}
      <Layout>
        {/* Header */}
        <Header style={{ 
          padding: '0 24px', 
          background: isDark ? '#1f1f1f' : '#fff',
          borderBottom: `1px solid ${isDark ? '#434343' : '#f0f0f0'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Sol taraf - Collapse button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: '32px', height: '32px' }}
            />
            
            {/* Breadcrumb benzeri başlık */}
            <div>
              <Text strong style={{ 
                fontSize: '16px',
                color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.88)'
              }}>
                {getPageTitle(location.pathname)}
              </Text>
            </div>
          </div>

          {/* Sağ taraf - User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Theme Toggle */}
            <Tooltip title={getThemeTooltip()}>
              <Button
                type="text"
                icon={getThemeIcon()}
                onClick={toggleTheme}
                style={{ 
                  border: 'none',
                  color: isDark ? '#fff' : '#000'
                }}
              />
            </Tooltip>

            {/* Notifications */}
            <Badge count={0} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ border: 'none' }}
                disabled // Henüz hazır değil
              />
            </Badge>

            {/* User Dropdown */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Avatar size={32} icon={<UserOutlined />} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: '14px', lineHeight: 1.2 }}>
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email
                    }
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px', lineHeight: 1.2 }}>
                    {user?.role === 'student' ? 'Öğrenci' : 
                     user?.role === 'coach' ? 'Koç' : 'Admin'}
                  </Text>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content */}
        <Content style={{ 
          margin: '24px',
          padding: '24px',
          background: isDark ? '#0f1419' : '#f5f5f5',
          borderRadius: '8px',
          overflow: 'auto'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;