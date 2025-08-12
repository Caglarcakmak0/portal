import React from 'react';
import { Card, Table, Input, Button, Space, Avatar, Tag, Typography } from 'antd';
import { TeamOutlined, EyeOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { getAdminCoaches, type AdminCoachListItem } from '../../services/api';

const { Title, Text } = Typography;

type ApiResponse<T> = { message: string; data: T; pagination?: { page: number; limit: number; total: number } };

const CoachesList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<AdminCoachListItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [q, setQ] = React.useState('');

  const fetchCoaches = React.useCallback(async (pageNum = page, pageSize = limit, search = q) => {
    setLoading(true);
    try {
      const res: ApiResponse<AdminCoachListItem[]> = await getAdminCoaches({ q: search, page: pageNum, limit: pageSize });
      setItems(res.data || []);
      setTotal(res.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, q]);

  React.useEffect(() => {
    fetchCoaches();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const columns: ColumnsType<AdminCoachListItem> = [
    {
      title: 'Koç',
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatar || undefined} icon={<UserOutlined />} />
          <div>
            <Text strong>{record.name}</Text>
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{record.email}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Şehir',
      dataIndex: 'city',
      key: 'city',
      render: (value?: string) => value || '-'
    },
    {
      title: 'Kayıt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('tr-TR')
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} type="primary" size="small" onClick={() => navigate(`/admin/coaches/${record._id}`)}>
            Detay
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <TeamOutlined style={{ color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>Koç Yönetimi</Title>
          <Tag color="blue">Admin</Tag>
        </Space>
        <Space>
          <Input.Search
            placeholder="İsim veya e-posta ara"
            allowClear
            onSearch={(value) => { setQ(value); setPage(1); fetchCoaches(1, limit, value); }}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: 280 }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => fetchCoaches()}>
            Yenile
          </Button>
        </Space>
      </Space>

      <Card>
        <Table
          columns={columns}
          dataSource={items}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showSizeChanger: true,
            onChange: (p, ps) => { setPage(p); setLimit(ps); fetchCoaches(p, ps); }
          }}
        />
      </Card>
    </div>
  );
};

export default CoachesList;


