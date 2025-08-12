import React from 'react';
import { Card, Row, Col, Statistic, Typography, List, Tag, Space } from 'antd';
import { BarChartOutlined, TeamOutlined, StarFilled, ExclamationCircleOutlined } from '@ant-design/icons';
import { getAdminCoachesStatistics, getAdminFeedbackSummary } from '../../services/api';

const { Title, Text } = Typography;

type CoachesStatsItem = {
  coach: { id: string; name: string; email?: string };
  studentStats: { total: number; active: number; inactive: number };
  feedbackStats: {
    totalFeedbacks: number;
    averageRating: number;
    categoryAverages: { communication: number; programQuality: number; overallSatisfaction: number };
    issuesCounts: { tooMuchPressure: number; notEnoughSupport: number; communicationProblems: number; programNotSuitable: number };
    lastFeedbackDate: string | null;
  };
  lastUpdated?: string;
};

type ApiResponse<T> = { message: string; data: T };

const Statistics: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [coachesStats, setCoachesStats] = React.useState<CoachesStatsItem[]>([]);
  const [feedbackSummary, setFeedbackSummary] = React.useState<any>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [coachesRes, feedbackRes] = await Promise.all([
        getAdminCoachesStatistics() as Promise<ApiResponse<CoachesStatsItem[]>>,
        getAdminFeedbackSummary() as Promise<ApiResponse<any>>,
      ]);
      setCoachesStats(coachesRes.data || []);
      setFeedbackSummary(feedbackRes.data || null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <BarChartOutlined style={{ color: '#1890ff' }} />
        <Title level={4} style={{ margin: 0 }}>Sistem İstatistikleri</Title>
      </Space>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <Card title={<Space><StarFilled style={{ color: '#faad14' }} />Feedback Özeti</Space>} loading={loading}>
            {feedbackSummary && (
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="Toplam Feedback" value={feedbackSummary.totalFeedbacks} />
                </Col>
                <Col span={12}>
                  <Statistic title="Ortalama Puan" value={feedbackSummary.averageRating} precision={1} />
                </Col>
                <Col span={24} style={{ marginTop: 16 }}>
                  <Text type="secondary">Son feedback: {feedbackSummary.lastFeedbackDate ? new Date(feedbackSummary.lastFeedbackDate).toLocaleDateString('tr-TR') : '-'}</Text>
                </Col>
              </Row>
            )}
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card title={<Space><TeamOutlined />Koç Performansları</Space>} loading={loading}>
            <List
              dataSource={coachesStats}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Space>{item.coach.name}<Tag>{item.feedbackStats.averageRating.toFixed?.(1) ?? item.feedbackStats.averageRating}</Tag></Space>}
                    description={<Text type="secondary">Aktif: {item.studentStats.active} • Pasif: {item.studentStats.inactive} • Toplam: {item.studentStats.total}</Text>}
                  />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Tag color="gold">⭐ {item.feedbackStats.totalFeedbacks}</Tag>
                    <Tag color="blue">İletişim {item.feedbackStats.categoryAverages.communication}</Tag>
                    <Tag color="green">Program {item.feedbackStats.categoryAverages.programQuality}</Tag>
                    <Tag color="purple">Memnuniyet {item.feedbackStats.categoryAverages.overallSatisfaction}</Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card title={<Space><ExclamationCircleOutlined />Sorun Başlıkları</Space>} loading={loading}>
            {feedbackSummary && (
              <Space wrap>
                <Tag color="red">Aşırı Baskı: {feedbackSummary.issuesCounts?.tooMuchPressure ?? 0}</Tag>
                <Tag color="orange">Yetersiz Destek: {feedbackSummary.issuesCounts?.notEnoughSupport ?? 0}</Tag>
                <Tag color="volcano">İletişim: {feedbackSummary.issuesCounts?.communicationProblems ?? 0}</Tag>
                <Tag color="geekblue">Uygun Değil: {feedbackSummary.issuesCounts?.programNotSuitable ?? 0}</Tag>
                <Tag>Yeni: {feedbackSummary.statusCounts?.new ?? 0}</Tag>
                <Tag>Okundu: {feedbackSummary.statusCounts?.read ?? 0}</Tag>
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;


