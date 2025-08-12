import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Statistic, 
  Progress,
  Select,
  Input,
  Modal,
  message,
  Alert,
  Tabs,
  List,
  Avatar,
  Drawer,
  Form,
  Switch,
  DatePicker
} from 'antd';
import { 
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  SecurityScanOutlined,
  BellOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  UploadOutlined,
  CloudServerOutlined,
  LineChartOutlined,
  PieChartOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../services/api';
import './AdminDashboard.scss';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'coach' | 'admin';
  profileCompleteness: number;
  lastActivity: string;
  status: 'active' | 'inactive' | 'banned';
  registrationDate: string;
}

interface SystemMetrics {
  totalUsers: number;
  totalStudents: number;
  totalCoaches: number;
  totalSessions: number;
  totalQuestions: number;
  avgSessionTime: number;
  systemLoad: number;
  databaseSize: number;
  activeUsers: number;
  responseTime: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDrawer, setUserDrawer] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalUsers: 1247,
    totalStudents: 1089,
    totalCoaches: 142,
    totalSessions: 15847,
    totalQuestions: 234567,
    avgSessionTime: 45,
    systemLoad: 23,
    databaseSize: 2.4,
    activeUsers: 89,
    responseTime: 156
  });


  // Role colors and text
  const getRoleInfo = (role: string) => {
    const roleConfig = {
      admin: { color: 'red', text: 'Admin' },
      coach: { color: 'blue', text: 'Koç' },
      student: { color: 'green', text: 'Öğrenci' }
    };
    return roleConfig[role as keyof typeof roleConfig] || { color: 'default', text: role };
  };

  const getStatusInfo = (status: string) => {
    const statusConfig = {
      active: { color: 'success', text: 'Aktif' },
      inactive: { color: 'warning', text: 'Pasif' },
      banned: { color: 'error', text: 'Yasaklı' }
    };
    return statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
  };

  // Users table columns
  const userColumns: ColumnsType<User> = [
    {
      title: 'Kullanıcı',
      key: 'user',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar style={{ backgroundColor: getRoleInfo(record.role).color === 'red' ? '#ff4d4f' : getRoleInfo(record.role).color === 'blue' ? '#1890ff' : '#52c41a' }}>
            {record.firstName.charAt(0)}
          </Avatar>
          <div>
            <Text strong>{record.firstName} {record.lastName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleInfo = getRoleInfo(role);
        return <Tag color={roleInfo.color}>{roleInfo.text}</Tag>;
      }
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusInfo = getStatusInfo(status);
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      }
    },
    {
      title: 'Profil Tamamlanması',
      key: 'completion',
      render: (_, record) => (
        <div style={{ minWidth: '120px' }}>
          <Progress 
            percent={record.profileCompleteness}
            size="small"
            strokeColor={record.profileCompleteness >= 80 ? '#52c41a' : '#1890ff'}
            format={() => `${record.profileCompleteness}%`}
          />
        </div>
      )
    },
    {
      title: 'Kayıt Tarihi',
      dataIndex: 'registrationDate',
      key: 'registrationDate',
      render: (date: string) => new Date(date).toLocaleDateString('tr-TR')
    },
    {
      title: 'Son Aktivite',
      dataIndex: 'lastActivity',
      key: 'lastActivity'
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedUser(record);
              setUserDrawer(true);
            }}
          >
            Görüntüle
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => message.info('Düzenleme özelliği yakında eklenecek')}
          >
            Düzenle
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => message.warning('Bu işlem geri alınamaz!')}
          >
            Sil
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <DashboardOutlined style={{ color: '#ff4d4f' }} />
              Admin Paneli
              <Tag color="red">Administrator</Tag>
            </Title>
            <Text type="secondary">Sistem genelinde tam kontrol ve yönetim</Text>
          </Col>
          <Col>
            <Space>
              <Button icon={<DownloadOutlined />}>
                Sistem Raporu
              </Button>
              <Button icon={<SettingOutlined />}>
                Sistem Ayarları
              </Button>
              <Button type="primary" icon={<PlusOutlined />}>
                Yeni Kullanıcı
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Tabs defaultActiveKey="overview" size="large">
        {/* System Overview Tab */}
        <TabPane tab={<><BarChartOutlined />Sistem Genel Bakış</>} key="overview">
          {/* System Health Alert */}
          <Alert
            message="🟢 Sistem Durumu: Sağlıklı"
            description="Tüm servisler normal çalışıyor. Son kontrol: 2 dakika önce"
            type="success"
            showIcon
            style={{ marginBottom: '24px', borderRadius: '8px' }}
          />

          {/* Key Metrics */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={12} md={8} lg={6}>
              <Card size="small" className="metric-card users">
                <Statistic
                  title="Toplam Kullanıcı"
                  value={systemMetrics.totalUsers}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
                <Progress percent={78} size="small" showInfo={false} strokeColor="#1890ff" />
                <Text type="secondary" style={{ fontSize: '11px' }}>Bu ay +124</Text>
              </Card>
            </Col>
            <Col xs={12} md={8} lg={6}>
              <Card size="small" className="metric-card sessions">
                <Statistic
                  title="Toplam Oturum"
                  value={systemMetrics.totalSessions}
                  prefix={<LineChartOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Progress percent={85} size="small" showInfo={false} strokeColor="#52c41a" />
                <Text type="secondary" style={{ fontSize: '11px' }}>Bu hafta +567</Text>
              </Card>
            </Col>
            <Col xs={12} md={8} lg={6}>
              <Card size="small" className="metric-card questions">
                <Statistic
                  title="Çözülen Soru"
                  value={systemMetrics.totalQuestions}
                  prefix={<PieChartOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
                <Progress percent={92} size="small" showInfo={false} strokeColor="#faad14" />
                <Text type="secondary" style={{ fontSize: '11px' }}>Bugün +2.4K</Text>
              </Card>
            </Col>
            <Col xs={12} md={8} lg={6}>
              <Card size="small" className="metric-card load">
                <Statistic
                  title="Sistem Yükü"
                  value={systemMetrics.systemLoad}
                  suffix="%"
                  prefix={<CloudServerOutlined />}
                  valueStyle={{ color: systemMetrics.systemLoad > 70 ? '#ff4d4f' : '#52c41a' }}
                />
                <Progress percent={systemMetrics.systemLoad} size="small" showInfo={false} strokeColor={systemMetrics.systemLoad > 70 ? '#ff4d4f' : '#52c41a'} />
                <Text type="secondary" style={{ fontSize: '11px' }}>Optimize edildi</Text>
              </Card>
            </Col>
          </Row>

          {/* Detailed System Stats */}
          <Row gutter={24}>
            <Col xs={24} lg={16}>
              <Card title="📊 Sistem Performansı">
                <Row gutter={16}>
                  <Col span={12}>
                    <div className="performance-metric">
                      <Text strong>Aktif Kullanıcılar</Text>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                        {systemMetrics.activeUsers}
                      </div>
                      <Text type="secondary">Şu anda online</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="performance-metric">
                      <Text strong>Yanıt Süresi</Text>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                        {systemMetrics.responseTime}ms
                      </div>
                      <Text type="secondary">Ortalama API yanıtı</Text>
                    </div>
                  </Col>
                  <Col span={12} style={{ marginTop: '16px' }}>
                    <div className="performance-metric">
                      <Text strong>Veritabanı</Text>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#722ed1' }}>
                        {systemMetrics.databaseSize} GB
                      </div>
                      <Text type="secondary">Toplam boyut</Text>
                    </div>
                  </Col>
                  <Col span={12} style={{ marginTop: '16px' }}>
                    <div className="performance-metric">
                      <Text strong>Oturum Süresi</Text>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#faad14' }}>
                        {systemMetrics.avgSessionTime}dk
                      </div>
                      <Text type="secondary">Ortalama süre</Text>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="🎯 Bu Haftaki Hedefler">
                <List
                  size="small"
                  dataSource={[
                    { target: 'Yeni kullanıcı', current: 87, goal: 100, unit: 'kişi' },
                    { target: 'Sistem uptime', current: 99.8, goal: 99.9, unit: '%' },
                    { target: 'Mobil kullanım', current: 65, goal: 70, unit: '%' },
                    { target: 'Performans skoru', current: 92, goal: 95, unit: '/100' }
                  ]}
                  renderItem={item => (
                    <List.Item>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <Text strong style={{ fontSize: '12px' }}>{item.target}</Text>
                          <Text style={{ fontSize: '12px' }}>{item.current}/{item.goal} {item.unit}</Text>
                        </div>
                        <Progress 
                          percent={Math.round((item.current / item.goal) * 100)} 
                          size="small"
                          strokeColor={item.current >= item.goal ? '#52c41a' : '#1890ff'}
                          showInfo={false}
                        />
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Users Management Tab */}
        <TabPane tab={<><UserOutlined />Kullanıcı Yönetimi ({users.length})</>} key="users">
          {/* User Stats */}
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col xs={8} md={6}>
              <Card size="small" className="user-stat students">
                <Statistic
                  title="Öğrenciler"
                  value={systemMetrics.totalStudents}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={8} md={6}>
              <Card size="small" className="user-stat coaches">
                <Statistic
                  title="Koçlar"
                  value={systemMetrics.totalCoaches}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={8} md={6}>
              <Card size="small" className="user-stat admins">
                <Statistic
                  title="Adminler"
                  value={16}
                  prefix={<SecurityScanOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card size="small" className="user-stat growth">
                <Statistic
                  title="Aylık Büyüme"
                  value={12.5}
                  suffix="%"
                  prefix={<LineChartOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Users Table */}
          <Card title="👥 Tüm Kullanıcılar">
            <Table
              columns={userColumns}
              dataSource={users}
              rowKey="_id"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Toplam ${total} kullanıcı`
              }}
              loading={loading}
              size="middle"
            />
          </Card>
        </TabPane>

        {/* System Settings Tab */}
        <TabPane tab={<><SettingOutlined />Sistem Ayarları</>} key="settings">
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Card title="⚙️ Genel Ayarlar">
                <Form layout="vertical">
                  <Form.Item label="Sistem Adı">
                    <Input defaultValue="YKS Portal" />
                  </Form.Item>
                  <Form.Item label="Maksimum Oturum Süresi (dakika)">
                    <Input defaultValue="30" type="number" />
                  </Form.Item>
                  <Form.Item label="Yeni Kayıtlara İzin Ver">
                    <Switch defaultChecked />
                  </Form.Item>
                  <Form.Item label="Otomatik Yedekleme">
                    <Switch defaultChecked />
                  </Form.Item>
                  <Form.Item label="Email Bildirimleri">
                    <Switch defaultChecked />
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="🔧 Sistem Bakımı">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button block icon={<DatabaseOutlined />}>
                    Veritabanını Optimize Et
                  </Button>
                  <Button block icon={<DownloadOutlined />}>
                    Sistem Yedeği Al
                  </Button>
                  <Button block icon={<UploadOutlined />}>
                    Yedekten Geri Yükle
                  </Button>
                  <Button block icon={<SecurityScanOutlined />}>
                    Güvenlik Taraması Yap
                  </Button>
                  <Button block danger icon={<BellOutlined />}>
                    Sistem Bakım Modu
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Analytics Tab */}
        <TabPane tab={<><GlobalOutlined />Analitik & Raporlar</>} key="analytics">
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Card title="📈 Sistem Analitikleri">
                <div style={{
                  height: '400px',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #91d5ff'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <LineChartOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '16px' }} />
                    <div>
                      <Text strong style={{ fontSize: '20px' }}>İnteraktif Dashboard</Text>
                      <br />
                      <Text type="secondary">Kullanıcı aktivitesi, sistem performansı ve detaylı raporlar</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        * Gerçek projede Chart.js/D3.js entegrasyonu ile detaylı grafikler
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* User Details Drawer */}
      <Drawer
        title={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName} - Detaylar` : 'Kullanıcı Detayları'}
        placement="right"
        size="large"
        onClose={() => {
          setUserDrawer(false);
          setSelectedUser(null);
        }}
        open={userDrawer}
      >
        {selectedUser && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Avatar size={64} style={{ backgroundColor: '#1890ff', marginBottom: '12px' }}>
                  {selectedUser.firstName.charAt(0)}
                </Avatar>
                <Title level={4}>{selectedUser.firstName} {selectedUser.lastName}</Title>
                <Text type="secondary">{selectedUser.email}</Text>
                <br />
                <Tag color={getRoleInfo(selectedUser.role).color} style={{ marginTop: '8px' }}>
                  {getRoleInfo(selectedUser.role).text}
                </Tag>
              </div>
            </Card>

            <Card title="📊 Kullanıcı Bilgileri" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Durum:</Text>
                  <br />
                  <Tag color={getStatusInfo(selectedUser.status).color}>
                    {getStatusInfo(selectedUser.status).text}
                  </Tag>
                </Col>
                <Col span={12}>
                  <Text strong>Kayıt Tarihi:</Text>
                  <br />
                  <Text>{new Date(selectedUser.registrationDate).toLocaleDateString('tr-TR')}</Text>
                </Col>
                <Col span={24} style={{ marginTop: '12px' }}>
                  <Text strong>Profil Tamamlanması:</Text>
                  <Progress percent={selectedUser.profileCompleteness} style={{ marginTop: '4px' }} />
                </Col>
              </Row>
            </Card>

            <Card title="⚡ Hızlı İşlemler" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button block icon={<EditOutlined />}>
                  Kullanıcıyı Düzenle
                </Button>
                <Button block icon={<BellOutlined />}>
                  Bildirim Gönder
                </Button>
                <Button block danger icon={<DeleteOutlined />}>
                  Hesabı Askıya Al
                </Button>
              </Space>
            </Card>
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default AdminDashboard;