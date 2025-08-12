import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Segmented, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getAdminFeedbacks, AdminFeedbackListItem } from '../../services/api';

const { Title } = Typography;

export const FeedbackList: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'new' | 'read' | 'all'>('new');
  const [data, setData] = useState<AdminFeedbackListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAdminFeedbacks({ status: status === 'all' ? undefined : status, limit: 50, offset: 0 });
      setData(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <Title level={4} style={{ margin: 0 }}>Gizli Koç Değerlendirmeleri</Title>
          <Segmented
            value={status}
            onChange={(v) => setStatus(v as any)}
            options={[{ label: 'Yeni', value: 'new' }, { label: 'Okundu', value: 'read' }, { label: 'Tümü', value: 'all' }]}
          />
        </Space>

        <Table
          rowKey={(r) => r.id}
          loading={loading}
          columns={[
            { title: 'Tarih', dataIndex: 'createdAt', render: (v: string) => new Date(v).toLocaleString('tr-TR') },
            { title: 'Öğrenci', dataIndex: ['student', 'name'] },
            { title: 'Koç', dataIndex: ['coach', 'name'] },
            { title: 'Ort. Puan', dataIndex: 'overallRating' },
            { title: 'Durum', dataIndex: 'status', render: (s: string) => s === 'new' ? <Tag color="gold">Yeni</Tag> : <Tag color="green">Okundu</Tag> },
            { title: '', dataIndex: 'id', width: 100, render: (id: string) => <a onClick={() => navigate(`/admin/feedback/${id}`)}>Görüntüle</a> }
          ]}
          dataSource={data}
          pagination={false}
        />
      </Space>
    </Card>
  );
};

export default FeedbackList;


