import {
  DashboardOutlined,
  UserOutlined,
  BookOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  SettingOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

type MenuItem = Required<MenuProps>['items'][number];

export const routeMenu: MenuItem[] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard'
  },
  {
    key: 'profile',
    icon: <UserOutlined />,
    label: 'Profil',
    children: [
      {
        key: '/profile',
        label: 'Kişisel Bilgiler'
      },
      {
        key: '/education',
        label: 'Eğitim Bilgileri'
      },
      {
        key: '/goals',
        label: 'Hedeflerim'
      }
    ]
  },
  {
    key: '/study-tracker',
    icon: <ClockCircleOutlined />,
    label: 'Çalışma Tracker'
  },
  {
    key: '/analytics',
    icon: <BarChartOutlined />,
    label: 'İstatistikler',
    disabled: true // Henüz hazır değil
  },
  {
    key: '/exams',
    icon: <BookOutlined />,
    label: 'Sınavlar',
    disabled: true // Henüz hazır değil
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: 'Ayarlar',
    disabled: true // Henüz hazır değil
  }
];

// Route başlıklarını menu'den otomatik al
export const getPageTitle = (pathname: string): string => {
  const findTitle = (items: MenuItem[], path: string): string | null => {
    for (const item of items) {
      if (item && typeof item === 'object' && 'key' in item && item.key === path) {
        return (item as any).label || '';
      }
      if (item && typeof item === 'object' && 'children' in item && item.children) {
        const childTitle = findTitle(item.children as MenuItem[], path);
        if (childTitle) return childTitle;
      }
    }
    return null;
  };

  return findTitle(routeMenu, pathname) || 'YKS Portal';
};