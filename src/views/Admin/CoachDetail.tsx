import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, Row, Col, Statistic, Typography, Tabs, Table, Tag, Space, Avatar, Divider, Descriptions, Empty } from 'antd';
import { UserOutlined, TeamOutlined, StarFilled } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getAdminCoachStudents, getAdminCoachPerformance } from '../../services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs as any;

type ApiResponse<T> = { message: string; data: T; pagination?: { page: number; limit: number; total: number } };

type StudentsResponseItem = {
  _id: string;
  name: string;
  email: string;
  grade?: string;
  city?: string;
};

type CoachPerformance = {
  coachId: string;
  studentStats: { total: number; active: number; inactive: number };
  feedbackStats: {
    totalFeedbacks: number;
    averageRating: number;
    categoryAverages: { communication: number; programQuality: number; overallSatisfaction: number };
    issuesCounts: { tooMuchPressure: number; notEnoughSupport: number; communicationProblems: number; programNotSuitable: number };
    lastFeedbackDate: string | null;
  };
  lastUpdated: string | null;
};

const CoachDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = React.useState(true);
  const [students, setStudents] = React.useState<StudentsResponseItem[]>([]);
  const [perf, setPerf] = React.useState<CoachPerformance | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [studentsRes, perfRes] = await Promise.all([
        getAdminCoachStudents(id, { status: 'active', page: 1, limit: 20 }) as Promise<ApiResponse<StudentsResponseItem[]>>,
        getAdminCoachPerformance(id) as Promise<ApiResponse<CoachPerformance>>,
      ]);
      setStudents(studentsRes.data || []);
      setPerf(perfRes.data as any);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const columns: ColumnsType<StudentsResponseItem> = [
    { title: 'Öğrenci', dataIndex: 'name', key: 'name', render: (name: string) => (
      <Space><Avatar icon={<UserOutlined />} /><Text strong>{name}</Text></Space>
    ) },
    { title: 'E-posta', dataIndex: 'email', key: 'email' },
    { title: 'Sınıf', dataIndex: 'grade', key: 'grade', render: (v?: string) => v || '-' },
    { title: 'Şehir', dataIndex: 'city', key: 'city', render: (v?: string) => v || '-' },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <UserOutlined style={{ color: '#1890ff' }} />
        <Title level={4} style={{ margin: 0 }}>Koç Detayı</Title>
        <Tag color="blue">Admin</Tag>
      </Space>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <Card loading={loading}>
            {perf ? (
              <>
                <Descriptions column={1} size="small" title="Performans Özeti">
                  <Descriptions.Item label="Aktif Öğrenci">{perf.studentStats?.active ?? '-'}</Descriptions.Item>
                  <Descriptions.Item label="Pasif Öğrenci">{perf.studentStats?.inactive ?? '-'}</Descriptions.Item>
                  <Descriptions.Item label="Toplam Öğrenci">{perf.studentStats?.total ?? '-'}</Descriptions.Item>
                </Descriptions>
                <Divider />
                <Row gutter={12}>
                  <Col span={12}>
                    <Statistic title="Feedback Sayısı" value={perf.feedbackStats?.totalFeedbacks || 0} prefix={<StarFilled style={{ color: '#faad14' }} />} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Ortalama Puan" value={perf.feedbackStats?.averageRating || 0} precision={1} />
                  </Col>
                </Row>
                <Divider />
                <Text type="secondary">Son feedback: {perf.feedbackStats?.lastFeedbackDate ? new Date(perf.feedbackStats.lastFeedbackDate).toLocaleDateString('tr-TR') : '-'}</Text>
              </>
            ) : (
              <Empty description="Performans verisi yok" />
            )}
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card title={<Space><TeamOutlined />Aktif Öğrenciler</Space>} loading={loading}>
            <Table columns={columns} dataSource={students} rowKey="_id" pagination={false} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CoachDetail;


