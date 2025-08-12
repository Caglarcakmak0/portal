import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Typography, Dropdown, Badge, Tooltip, Breadcrumb, Segmented } from 'antd';
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
  
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getPageTitle, getRouteMenuByRole } from '../../../routes/routeMenu';
import { toAbsoluteUrl } from '../../../services/api';
import { useDesign } from '../../../contexts/DesignContext';

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
  const { designMode, setDesignMode } = useDesign();
  
  // Get role-based menu items
  const menuItems = getRouteMenuByRole(user?.role);

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
  const getThemeIcon = () => (themeMode === 'light' ? <SunOutlined /> : <MoonOutlined />);

  const getThemeTooltip = () => (themeMode === 'light' ? "Light Mode - Dark'a geç" : "Dark Mode - Light'a geç");

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

  // Basit breadcrumb üretici (yalnızca iki seviyeli için yeterli)
  const breadcrumbItems = React.useMemo(() => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);
    const items = [
      { title: 'Ana Sayfa', path: '/' },
    ];
    if (parts.length > 0) {
      // Tam eşleşen başlık
      const currentTitle = getPageTitle(path, menuItems as any);
      items.push({ title: currentTitle, path });
    }
    return items;
  }, [location.pathname, menuItems]);

  const headerClassName = React.useMemo(() => {
    switch (designMode) {
      case 'neon':
        return 'neon-header';
      case 'soft':
        return 'soft-header';
      default:
        return 'soft-header';
    }
  }, [designMode]);

  const contentClassName = React.useMemo(() => {
    const base = 'app-fade-in';
    switch (designMode) {
      case 'neon':
        return `${base} neon-content`;
      case 'soft':
        return `${base} soft-content`;
      default:
        return `${base} soft-content`;
    }
  }, [designMode]);

  const siderClassName = React.useMemo(() => {
    switch (designMode) {
      case 'neon':
        return 'neon-sider';
      case 'soft':
        return 'soft-sider';
      default:
        return 'soft-sider';
    }
  }, [designMode]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={250}
        className={siderClassName}
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
          items={menuItems}
          onClick={handleMenuClick}
          style={{ 
            border: 'none',
            height: 'calc(100vh - 64px)',
            background: 'transparent'
          }}
        />
      </Sider>

      {/* Main Layout */}
      <Layout>
        {/* Header */}
        <Header className={headerClassName} style={{ 
          padding: '0 24px',
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
              aria-label={collapsed ? 'Menüyü aç' : 'Menüyü kapat'}
            />
            
            {/* Breadcrumb + Başlık */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Breadcrumb
                items={breadcrumbItems.map(b => ({ title: b.title }))}
              />
              <Text strong style={{ 
                fontSize: '16px',
                color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.88)'
              }}>
                {getPageTitle(location.pathname, menuItems as any)}
              </Text>
            </div>
          </div>

          {/* Sağ taraf - User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Design switch (deneysel) */}
            <Segmented
              value={designMode}
              onChange={(val) => setDesignMode(val as any)}
              options={[
                { label: 'Soft', value: 'soft' },
                { label: 'Neon', value: 'neon' },
              ]}
              size="small"
            />
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
                aria-label="Tema değiştir"
              />
            </Tooltip>

            {/* Notifications */}
            {/* Gizli değerlendirme bekleniyor rozeti - sadece öğrenci için opsiyonel */}
            <Badge count={user?.role === 'student' ? 1 : 0} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ border: 'none' }}
                aria-label="Bildirimler"
                // İleride tıklayınca /student/coach sayfasına yönlendirilebilir
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
                <Avatar size={32} src={toAbsoluteUrl(user?.avatar) || undefined} icon={<UserOutlined />} />
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
        <Content className={contentClassName} style={{ 
          margin: '24px',
          padding: '24px',
          overflow: 'auto'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;