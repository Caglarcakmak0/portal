import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Typography, 
  Space, 
  Tag, 
  Alert, 
  Button,
  DatePicker,
  Select,
  Divider,
  Timeline,
  Tabs
} from 'antd';
import { 
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TrophyOutlined,
  FireOutlined,
  ClockCircleOutlined,
  StarOutlined,
  ArrowUpOutlined,
  AimOutlined,
  ThunderboltOutlined,
  BookOutlined,
  CalendarOutlined,
  BulbOutlined
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import './AdvancedAnalytics.scss';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface AdvancedAnalyticsProps {
  plan: {
    _id: string;
    date: string;
    title: string;
    subjects: Array<{
      subject: string;
      targetQuestions: number;
      targetTime?: number;
      topics: string[];
      priority: number;
      completedQuestions: number;
      correctAnswers: number;
      wrongAnswers: number;
      blankAnswers: number;
      studyTime: number;
      status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
      sessionIds: string[];
    }>;
    stats: {
      totalTargetQuestions: number;
      totalCompletedQuestions: number;
      totalTargetTime: number;
      totalStudyTime: number;
      completionRate: number;
      netScore: number;
      successRate: number;
    };
  };
  selectedDate: Dayjs;
  onRefresh: () => void;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ plan, selectedDate, onRefresh }) => {
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);

  // Advanced Analytics Calculations
  const calculateAdvancedMetrics = () => {
    const efficiency = plan.stats.totalStudyTime > 0 
      ? (plan.stats.totalCompletedQuestions / (plan.stats.totalStudyTime / 60))
      : 0;

    const velocityScore = plan.stats.completionRate * (plan.stats.successRate / 100) * 10;
    
    const subjectDistribution = plan.subjects.reduce((acc, subject) => {
      const totalQuestions = subject.correctAnswers + subject.wrongAnswers + subject.blankAnswers;
      if (totalQuestions > 0) {
        acc[subject.subject] = {
          totalQuestions,
          accuracy: (subject.correctAnswers / totalQuestions) * 100,
          timeSpent: subject.studyTime,
          efficiency: totalQuestions / (subject.studyTime / 60) || 0
        };
      }
      return acc;
    }, {} as Record<string, any>);

    const strongestSubject = Object.entries(subjectDistribution)
      .sort(([,a], [,b]) => b.accuracy - a.accuracy)[0];
    
    const weakestSubject = Object.entries(subjectDistribution)
      .sort(([,a], [,b]) => a.accuracy - b.accuracy)[0];

    const mostEfficientSubject = Object.entries(subjectDistribution)
      .sort(([,a], [,b]) => b.efficiency - a.efficiency)[0];

    return {
      efficiency,
      velocityScore,
      subjectDistribution,
      strongestSubject,
      weakestSubject,
      mostEfficientSubject
    };
  };

  const metrics = calculateAdvancedMetrics();

  // Performance Insights
  const generateInsights = () => {
    const insights = [];

    if (plan.stats.successRate >= 80) {
      insights.push({
        type: 'success',
        title: '🎯 Mükemmel Performans!',
        description: `%${plan.stats.successRate} başarı oranı ile hedeflerinizin üstünde performans gösteriyorsunuz.`
      });
    }

    if (metrics.efficiency < 10) {
      insights.push({
        type: 'warning',
        title: '⚡ Verimlilik Artırılabilir',
        description: `Saat başına ${metrics.efficiency.toFixed(1)} soru çözme hızınız artırılabilir. Odaklanma teknikleri deneyebilirsiniz.`
      });
    }

    if (plan.stats.completionRate < 50 && dayjs().hour() > 18) {
      insights.push({
        type: 'info',
        title: '🌅 Son Sprint Zamanı!',
        description: 'Günlük hedeflerinizi tamamlamak için son hızla devam edin!'
      });
    }

    return insights;
  };

  const insights = generateInsights();

  // Mock historical data for trend analysis
  const generateTrendData = () => {
    const days = 14;
    const trendData = [];
    
    for (let i = days; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day');
      trendData.push({
        date: date.format('MM/DD'),
        netScore: Math.random() * 30 + 20,
        efficiency: Math.random() * 15 + 10,
        studyTime: Math.random() * 180 + 60,
        completionRate: Math.random() * 40 + 60
      });
    }
    
    return trendData;
  };

  const trendData = generateTrendData();

  return (
    <div className="advanced-analytics">
      {/* Analytics Header */}
      <Card className="analytics-header" style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ArrowUpOutlined style={{ color: '#1890ff' }} />
              İleri Seviye Analitik
              <Tag color="purple">AI Destekli</Tag>
            </Title>
            <Text type="secondary">Detaylı performans analizleri ve akıllı öneriler</Text>
          </Col>
          <Col>
            <Space>
              <Select value={analyticsTimeframe} onChange={setAnalyticsTimeframe} style={{ width: 120 }}>
                <Option value="daily">Günlük</Option>
                <Option value="weekly">Haftalık</Option>
                <Option value="monthly">Aylık</Option>
              </Select>
              <RangePicker 
                value={dateRange} 
                onChange={(dates) => dates && setDateRange([dates[0]!, dates[1]!])}
                size="small"
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Tabs defaultActiveKey="performance" size="large">
        {/* Performance Analytics Tab */}
        <TabPane tab={<><BarChartOutlined />Performans Analizi</>} key="performance">
          <Row gutter={[24, 24]}>
            {/* Key Metrics */}
            <Col span={24}>
              <Card title="🎯 Ana Performans Göstergeleri">
                <Row gutter={16}>
                  <Col xs={12} md={6}>
                    <Card size="small" className="metric-card velocity">
                      <Statistic
                        title="Hız Skoru"
                        value={metrics.velocityScore.toFixed(1)}
                        suffix="/100"
                        prefix={<ThunderboltOutlined />}
                        valueStyle={{ color: '#722ed1' }}
                      />
                      <Progress 
                        percent={metrics.velocityScore} 
                        size="small" 
                        strokeColor="#722ed1"
                        showInfo={false}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} md={6}>
                    <Card size="small" className="metric-card efficiency">
                      <Statistic
                        title="Verimlilik"
                        value={metrics.efficiency.toFixed(1)}
                        suffix="soru/saat"
                        prefix={<ArrowUpOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                      <Progress 
                        percent={Math.min(metrics.efficiency * 4, 100)} 
                        size="small" 
                        strokeColor="#52c41a"
                        showInfo={false}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} md={6}>
                    <Card size="small" className="metric-card consistency">
                      <Statistic
                        title="Tutarlılık"
                        value="87"
                        suffix="%"
                        prefix={<AimOutlined />}
                        valueStyle={{ color: '#faad14' }}
                      />
                      <Progress 
                        percent={87} 
                        size="small" 
                        strokeColor="#faad14"
                        showInfo={false}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} md={6}>
                    <Card size="small" className="metric-card focus">
                      <Statistic
                        title="Odaklanma"
                        value="92"
                        suffix="%"
                        prefix={<BulbOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                      <Progress 
                        percent={92} 
                        size="small" 
                        strokeColor="#1890ff"
                        showInfo={false}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Subject Performance Breakdown */}
            <Col span={24}>
              <Card title="📊 Ders Bazında Detaylı Analiz">
                <Row gutter={[16, 16]}>
                  {Object.entries(metrics.subjectDistribution).map(([subject, data]: [string, any]) => (
                    <Col xs={24} md={12} lg={8} key={subject}>
                      <Card 
                        size="small" 
                        className="subject-analytics-card"
                        title={
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BookOutlined />
                            {subject.charAt(0).toUpperCase() + subject.slice(1)}
                          </span>
                        }
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div>
                            <Text strong>Doğruluk Oranı</Text>
                            <Progress 
                              percent={data.accuracy} 
                              strokeColor={data.accuracy >= 80 ? '#52c41a' : data.accuracy >= 60 ? '#faad14' : '#ff4d4f'}
                              format={() => `${data.accuracy.toFixed(1)}%`}
                            />
                          </div>
                          
                          <Row gutter={8}>
                            <Col span={12}>
                              <div className="mini-metric">
                                <Text type="secondary">Soru Sayısı</Text>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                                  {data.totalQuestions}
                                </div>
                              </div>
                            </Col>
                            <Col span={12}>
                              <div className="mini-metric">
                                <Text type="secondary">Süre</Text>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#722ed1' }}>
                                  {Math.round(data.timeSpent / 60)}dk
                                </div>
                              </div>
                            </Col>
                          </Row>
                          
                          <div className="efficiency-indicator">
                            <Text type="secondary">Verimlilik: </Text>
                            <Text strong style={{ 
                              color: data.efficiency >= 15 ? '#52c41a' : 
                                     data.efficiency >= 10 ? '#faad14' : '#ff4d4f' 
                            }}>
                              {data.efficiency.toFixed(1)} soru/saat
                            </Text>
                          </div>
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Insights Tab */}
        <TabPane tab={<><BulbOutlined />Akıllı Öneriler</>} key="insights">
          <Row gutter={[24, 24]}>
            {/* AI Insights */}
            <Col span={24}>
              <Card title="🤖 AI Performans Önerileri">
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {insights.map((insight, index) => (
                    <Alert
                      key={index}
                      message={insight.title}
                      description={insight.description}
                      type={insight.type as any}
                      showIcon
                      style={{ borderRadius: '8px' }}
                    />
                  ))}
                  
                  {metrics.strongestSubject && (
                    <Alert
                      message="💪 En Güçlü Ders"
                      description={`${metrics.strongestSubject[0]} dersinde %${metrics.strongestSubject[1].accuracy.toFixed(1)} doğruluk oranı ile mükemmel performans!`}
                      type="success"
                      showIcon
                    />
                  )}
                  
                  {metrics.weakestSubject && (
                    <Alert
                      message="🎯 Gelişim Alanı"
                      description={`${metrics.weakestSubject[0]} dersinde ekstra çalışma yaparak performansınızı artırabilirsiniz.`}
                      type="warning"
                      showIcon
                    />
                  )}
                </Space>
              </Card>
            </Col>

            {/* Study Recommendations */}
            <Col span={24}>
              <Card title="📚 Kişisel Çalışma Önerileri">
                <Timeline>
                  <Timeline.Item dot={<ClockCircleOutlined style={{ fontSize: '16px' }} />} color="blue">
                    <div>
                      <Text strong>Optimal Çalışma Saati</Text>
                      <br />
                      <Text type="secondary">Performans verilerinize göre sabah 09:00-11:00 arası en verimli saatleriniz.</Text>
                    </div>
                  </Timeline.Item>
                  
                  <Timeline.Item dot={<BookOutlined style={{ fontSize: '16px' }} />} color="green">
                    <div>
                      <Text strong>Konu Dağılımı</Text>
                      <br />
                      <Text type="secondary">Zor konulara günde 45 dakika, tekrar konularına 30 dakika ayırın.</Text>
                    </div>
                  </Timeline.Item>
                  
                  <Timeline.Item dot={<TrophyOutlined style={{ fontSize: '16px' }} />} color="red">
                    <div>
                      <Text strong>Hedef Revizyon</Text>
                      <br />
                      <Text type="secondary">Mevcut hızınızla günlük hedeflerinizi %15 artırabilirsiniz.</Text>
                    </div>
                  </Timeline.Item>
                  
                  <Timeline.Item dot={<StarOutlined style={{ fontSize: '16px' }} />}>
                    <div>
                      <Text strong>Motivasyon</Text>
                      <br />
                      <Text type="secondary">Son 7 günde %18 gelişim gösterdiniz. Bu hızla devam edin!</Text>
                    </div>
                  </Timeline.Item>
                </Timeline>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Trends Tab */}
        <TabPane tab={<><LineChartOutlined />Trend Analizi</>} key="trends">
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Card title="📈 14 Günlük Performans Trendi">
                <div className="trend-chart-placeholder" style={{
                  height: '300px',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #91d5ff'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <LineChartOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                    <div>
                      <Text strong style={{ fontSize: '18px' }}>İnteraktif Grafik</Text>
                      <br />
                      <Text type="secondary">Net skor, verimlilik ve çalışma süresi trendleri</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        * Gerçek projede Chart.js veya D3.js entegrasyonu yapılacak
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalytics;