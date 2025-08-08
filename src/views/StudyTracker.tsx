import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Typography, 
  Space, 
  Statistic, 
  Timeline,
  Table,
  Tag,
  Button,
  Select,
  DatePicker,
  Tabs
} from 'antd';
import type { TabsProps } from 'antd';
import { 
  ClockCircleOutlined,
  PlayCircleOutlined,
  BarChartOutlined,
  CalendarOutlined,
  TrophyOutlined,
  FireOutlined,
  BookOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { StudyTimer } from '../components/feature';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/tr'; // Türkçe locale

// Plugins'leri aktif et
dayjs.extend(relativeTime);
dayjs.locale('tr');

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface StudySession {
  _id: string;
  subject: string;
  duration: number;
  date: Date;
  quality: number;
  technique: string;
  mood: string;
  efficiency: number;
  notes?: string;
  distractions: number;
}

interface StudyStats {
  totalTime: number;
  sessionsCount: number;
  averageQuality: number;
  currentStreak: number;
  bestSubject: string;
  totalDistraction: number;
}

const StudyTracker: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Veri getirme
  const fetchStudyData = async () => {
    try {
      setLoading(true);
      
      // Analytics API'den genel istatistikler
      const analyticsResponse = await apiRequest('/analytics/dashboard');
      
      // Detaylı session verileri (gelecekte /study-sessions endpoint olacak)
      // Şimdilik mock data
      const mockSessions: StudySession[] = [
        {
          _id: '1',
          subject: 'matematik',
          duration: 25,
          date: new Date(),
          quality: 4,
          technique: 'Pomodoro',
          mood: 'Normal',
          efficiency: 85,
          notes: 'Türev konusu işlendi',
          distractions: 2
        },
        {
          _id: '2',
          subject: 'fizik',
          duration: 45,
          date: new Date(Date.now() - 86400000), // 1 gün önce
          quality: 5,
          technique: 'Timeblock',
          mood: 'Enerjik',
          efficiency: 95,
          notes: 'Elektrik konusu tamamlandı',
          distractions: 0
        }
      ];

      setSessions(mockSessions);
      
      // Stats hesaplama
      const totalTime = mockSessions.reduce((sum, s) => sum + s.duration, 0);
      const avgQuality = mockSessions.reduce((sum, s) => sum + s.quality, 0) / mockSessions.length;
      
      setStats({
        totalTime,
        sessionsCount: mockSessions.length,
        averageQuality: avgQuality,
        currentStreak: 3, // mock
        bestSubject: 'Fizik',
        totalDistraction: mockSessions.reduce((sum, s) => sum + s.distractions, 0)
      });
      
    } catch (error) {
      console.error('Study data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyData();
  }, []);

  // Session tamamlandığında
  const handleSessionComplete = async (sessionData: any) => {
    console.log('New session completed:', sessionData);
    // Burada backend API'ye session kaydedilecek
    // Şimdilik sadece console'a yazdırıyoruz
    
    // Verileri yeniden getir
    await fetchStudyData();
  };

  // Tablo kolonları
  const sessionColumns = [
    {
      title: 'Tarih',
      dataIndex: 'date',
      key: 'date',
      render: (date: Date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      sorter: (a: StudySession, b: StudySession) => 
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Ders',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject: string) => (
        <Tag color="blue">{subject.charAt(0).toUpperCase() + subject.slice(1)}</Tag>
      ),
      filters: [
        { text: 'Matematik', value: 'matematik' },
        { text: 'Fizik', value: 'fizik' },
        { text: 'Kimya', value: 'kimya' },
        { text: 'Biyoloji', value: 'biyoloji' },
      ],
      onFilter: (value: any, record: StudySession) => record.subject === value,
    },
    {
      title: 'Süre',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => `${duration} dk`,
      sorter: (a: StudySession, b: StudySession) => a.duration - b.duration,
    },
    {
      title: 'Teknik',
      dataIndex: 'technique',
      key: 'technique',
      render: (technique: string) => (
        <Tag color={technique === 'Pomodoro' ? 'orange' : technique === 'Timeblock' ? 'green' : 'blue'}>
          {technique}
        </Tag>
      ),
    },
    {
      title: 'Kalite',
      dataIndex: 'quality',
      key: 'quality',
      render: (quality: number) => (
        <div>
          {'⭐'.repeat(quality)}
          <Text type="secondary"> ({quality}/5)</Text>
        </div>
      ),
      sorter: (a: StudySession, b: StudySession) => a.quality - b.quality,
    },
    {
      title: 'Verimlilik',
      dataIndex: 'efficiency',
      key: 'efficiency',
      render: (efficiency: number) => (
        <Text style={{ color: efficiency >= 80 ? '#52c41a' : efficiency >= 60 ? '#faad14' : '#ff4d4f' }}>
          %{efficiency}
        </Text>
      ),
      sorter: (a: StudySession, b: StudySession) => a.efficiency - b.efficiency,
    },
    {
      title: 'Ruh Hali',
      dataIndex: 'mood',
      key: 'mood',
      render: (mood: string) => {
        const moodColors = {
          'Enerjik': 'green',
          'Normal': 'blue',
          'Yorgun': 'orange',
          'Motivasyonsuz': 'red',
          'Stresli': 'volcano',
          'Mutlu': 'cyan'
        };
        return <Tag color={moodColors[mood as keyof typeof moodColors]}>{mood}</Tag>;
      }
    },
  ];

  // Süre formatlama
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}s ${mins}d` : `${mins}d`;
  };

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          📚 Çalışma Takip Merkezi
        </Title>
        <Text type="secondary">
          Çalışma seanslarını takip et, istatistikleri görüntüle ve hedeflerini gerçekleştir.
        </Text>
      </div>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Sol Panel - Timer ve İstatistikler */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            
            {/* Ana Timer */}
            <StudyTimer
              size="large"
              onSessionComplete={handleSessionComplete}
            />

            {/* Hızlı İstatistikler */}
            {stats && (
              <Card title="📊 Bu Hafta" size="small">
                <Row gutter={[8, 16]}>
                  <Col xs={12}>
                    <Statistic
                      title="Toplam Süre"
                      value={formatTime(stats.totalTime)}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title="Oturum Sayısı"
                      value={stats.sessionsCount}
                      prefix={<PlayCircleOutlined />}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title="Ortalama Kalite"
                      value={stats.averageQuality.toFixed(1)}
                      suffix="/5"
                      prefix={<TrophyOutlined />}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title="Güncel Seri"
                      value={stats.currentStreak}
                      suffix="gün"
                      prefix={<FireOutlined />}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                </Row>
              </Card>
            )}

            {/* En Son Aktiviteler */}
            <Card title="🕐 Son Aktiviteler" size="small">
              <Timeline 
                size="small"
                items={sessions.slice(0, 5).map((session) => ({
                  color: session.efficiency >= 80 ? 'green' : 'blue',
                  children: (
                    <div key={session._id}>
                      <Text strong>{session.subject}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {formatTime(session.duration)} • {session.technique} • ⭐{session.quality}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {dayjs(session.date).fromNow()}
                      </Text>
                    </div>
                  )
                }))}
              />
            </Card>
          </Space>
        </Col>

        {/* Sağ Panel - Detaylı Veriler */}
        <Col xs={24} lg={16}>
          <Tabs 
            defaultActiveKey="sessions" 
            size="large"
            items={[
              {
                key: 'sessions',
                label: (
                  <span>
                    <HistoryOutlined />
                    Oturum Geçmişi
                  </span>
                ),
                children: (
                  <Card>
                    {/* Filtreler */}
                    <div style={{ marginBottom: 16 }}>
                      <Space wrap>
                        <Select
                          value={selectedPeriod}
                          onChange={setSelectedPeriod}
                          style={{ width: 120 }}
                        >
                          <Select.Option value="week">Bu Hafta</Select.Option>
                          <Select.Option value="month">Bu Ay</Select.Option>
                          <Select.Option value="all">Tümü</Select.Option>
                        </Select>
                        
                        <Select
                          value={selectedSubject}
                          onChange={setSelectedSubject}
                          style={{ width: 120 }}
                          placeholder="Ders seç"
                        >
                          <Select.Option value="all">Tüm Dersler</Select.Option>
                          <Select.Option value="matematik">Matematik</Select.Option>
                          <Select.Option value="fizik">Fizik</Select.Option>
                          <Select.Option value="kimya">Kimya</Select.Option>
                        </Select>

                        <RangePicker size="small" />
                        
                        <Button 
                          icon={<BarChartOutlined />}
                          type="dashed"
                          size="small"
                        >
                          Analiz
                        </Button>
                      </Space>
                    </div>

                    {/* Sessions Table */}
                    <Table
                      columns={sessionColumns}
                      dataSource={sessions}
                      rowKey="_id"
                      loading={loading}
                      size="small"
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} oturum`,
                      }}
                      scroll={{ x: true }}
                    />
                  </Card>
                )
              },
              {
                key: 'stats',
                label: (
                  <span>
                    <BarChartOutlined />
                    İstatistikler
                  </span>
                ),
                children: (
                  <Card>
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <BookOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                      <Title level={4}>Detaylı İstatistikler</Title>
                      <Text type="secondary">
                        Grafik ve analiz özellikleri yakında eklenecek! 📊
                      </Text>
                    </div>
                  </Card>
                )
              },
              {
                key: 'calendar',
                label: (
                  <span>
                    <CalendarOutlined />
                    Takvim
                  </span>
                ),
                children: (
                  <Card>
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <CalendarOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                      <Title level={4}>Çalışma Takvimi</Title>
                      <Text type="secondary">
                        Aylık görünüm ve planlama özellikleri yakında! 📅
                      </Text>
                    </div>
                  </Card>
                )
              }
            ]}
          />
        </Col>
      </Row>
    </div>
  );
};

export default StudyTracker;