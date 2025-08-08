import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Select, 
  Space, 
  Typography,
  Progress,
  Empty,
  Spin,
  Tag,
  List,
  Avatar,
  Button
} from 'antd';
import {
  ClockCircleOutlined,
  TrophyOutlined,
  FireOutlined,
  BarChartOutlined,
  BookOutlined,
  SmileOutlined,
  PhoneOutlined,
  CalendarOutlined,
  ExportOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { apiRequest } from '../../../../services/api';

dayjs.extend(isoWeek);

const { Title, Text } = Typography;
const { Option } = Select;

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
  averageEfficiency: number;
  totalDistractions: number;
  streak: number;
  bestSubject: string;
  mostUsedTechnique: string;
  subjectBreakdown: { [key: string]: number };
  techniqueBreakdown: { [key: string]: number };
  moodBreakdown: { [key: string]: number };
  dailyAverage: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

type PeriodType = 'today' | 'week' | 'month' | 'all';
type ViewType = 'overview' | 'subjects' | 'techniques' | 'performance';

interface StudyStatisticsProps {
  refreshTrigger?: number;
}

const StudyStatistics: React.FC<StudyStatisticsProps> = ({ refreshTrigger = 0 }) => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [period, setPeriod] = useState<PeriodType>('week');
  const [view, setView] = useState<ViewType>('overview');

  // Veri getirme
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/study-sessions', { method: 'GET' });
      
      if (response && Array.isArray(response)) {
        setSessions(response);
        calculateStatistics(response, period);
      }
    } catch (error) {
      console.error('İstatistik verisi alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  // İstatistikleri hesapla
  const calculateStatistics = (allSessions: StudySession[], selectedPeriod: PeriodType) => {
    let filteredSessions = allSessions;
    
    // Dönem filtreleme
    const now = dayjs();
    switch (selectedPeriod) {
      case 'today':
        filteredSessions = allSessions.filter(s => 
          dayjs(s.date).isSame(now, 'day')
        );
        break;
      case 'week':
        filteredSessions = allSessions.filter(s => 
          dayjs(s.date).isSame(now, 'week')
        );
        break;
      case 'month':
        filteredSessions = allSessions.filter(s => 
          dayjs(s.date).isSame(now, 'month')
        );
        break;
      default:
        break;
    }

    if (filteredSessions.length === 0) {
      setStats({
        totalTime: 0,
        sessionsCount: 0,
        averageQuality: 0,
        averageEfficiency: 0,
        totalDistractions: 0,
        streak: 0,
        bestSubject: '-',
        mostUsedTechnique: '-',
        subjectBreakdown: {},
        techniqueBreakdown: {},
        moodBreakdown: {},
        dailyAverage: 0,
        weeklyGoal: 1400, // 20 saat hedef
        weeklyProgress: 0
      });
      return;
    }

    // Temel hesaplamalar
    const totalTime = filteredSessions.reduce((sum, s) => sum + s.duration, 0);
    const sessionsCount = filteredSessions.length;
    const averageQuality = filteredSessions.reduce((sum, s) => sum + s.quality, 0) / sessionsCount;
    const averageEfficiency = filteredSessions.reduce((sum, s) => sum + s.efficiency, 0) / sessionsCount;
    const totalDistractions = filteredSessions.reduce((sum, s) => sum + s.distractions, 0);

    // Ders dağılımı
    const subjectBreakdown: { [key: string]: number } = {};
    filteredSessions.forEach(s => {
      subjectBreakdown[s.subject] = (subjectBreakdown[s.subject] || 0) + s.duration;
    });

    // Teknik dağılımı
    const techniqueBreakdown: { [key: string]: number } = {};
    filteredSessions.forEach(s => {
      techniqueBreakdown[s.technique] = (techniqueBreakdown[s.technique] || 0) + 1;
    });

    // Ruh hali dağılımı
    const moodBreakdown: { [key: string]: number } = {};
    filteredSessions.forEach(s => {
      moodBreakdown[s.mood] = (moodBreakdown[s.mood] || 0) + 1;
    });

    // En iyi ders
    const bestSubject = Object.entries(subjectBreakdown)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '-';

    // En çok kullanılan teknik
    const mostUsedTechnique = Object.entries(techniqueBreakdown)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '-';

    // Günlük ortalama
    const days = selectedPeriod === 'today' ? 1 : 
                selectedPeriod === 'week' ? 7 : 
                selectedPeriod === 'month' ? 30 : 
                Math.max(1, dayjs().diff(dayjs(filteredSessions[filteredSessions.length - 1]?.date), 'day'));
    
    const dailyAverage = totalTime / days;

    // Haftalık progress (sadece hafta görünümünde)
    const weeklyGoal = 1400; // 20 saat = 1200 dakika
    const weeklyProgress = selectedPeriod === 'week' ? (totalTime / weeklyGoal) * 100 : 0;

    // Streak hesaplama (basit versiyon)
    const streak = calculateStreak(allSessions);

    setStats({
      totalTime,
      sessionsCount,
      averageQuality: Math.round(averageQuality * 10) / 10,
      averageEfficiency: Math.round(averageEfficiency),
      totalDistractions,
      streak,
      bestSubject,
      mostUsedTechnique,
      subjectBreakdown,
      techniqueBreakdown,
      moodBreakdown,
      dailyAverage: Math.round(dailyAverage),
      weeklyGoal,
      weeklyProgress: Math.min(100, weeklyProgress)
    });
  };

  // Streak hesaplama
  const calculateStreak = (allSessions: StudySession[]): number => {
    if (allSessions.length === 0) return 0;

    const sortedDates = allSessions
      .map(s => dayjs(s.date).format('YYYY-MM-DD'))
      .filter((date, index, array) => array.indexOf(date) === index)
      .sort()
      .reverse();

    let streak = 0;
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      streak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = dayjs(sortedDates[i-1]);
        const nextDate = dayjs(sortedDates[i]);
        
        if (currentDate.diff(nextDate, 'day') === 1) {
          streak++;
        } else {
          break;
        }
      }
    }

    return streak;
  };

  // Format süre
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}s ${mins}d` : `${mins}d`;
  };

  // Export fonksiyonu
  const handleExport = () => {
    if (!stats) return;
    
    const exportData = {
      period,
      generatedAt: new Date().toISOString(),
      statistics: stats,
      sessions: sessions.length
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `study-statistics-${period}-${dayjs().format('YYYY-MM-DD')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchStatistics();
  }, [period, refreshTrigger]);

  useEffect(() => {
    if (sessions.length > 0) {
      calculateStatistics(sessions, period);
    }
  }, [period]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">İstatistikler yükleniyor...</Text>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Empty 
        description="İstatistik verisi bulunamadı"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div className="study-statistics">
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            📊 Çalışma İstatistikleri
          </Title>
          <Text type="secondary">
            Performansını analiz et ve hedeflerini takip et
          </Text>
        </div>
        
        <Space>
          <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
            <Option value="today">Bugün</Option>
            <Option value="week">Bu Hafta</Option>
            <Option value="month">Bu Ay</Option>
            <Option value="all">Tümü</Option>
          </Select>
          
          <Select value={view} onChange={setView} style={{ width: 140 }}>
            <Option value="overview">Genel Bakış</Option>
            <Option value="subjects">Dersler</Option>
            <Option value="techniques">Teknikler</Option>
            <Option value="performance">Performans</Option>
          </Select>

          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchStatistics}
            size="small"
          />
          
          <Button 
            icon={<ExportOutlined />} 
            onClick={handleExport}
            size="small"
            type="dashed"
          >
            Dışa Aktar
          </Button>
        </Space>
      </div>

      {/* Overview */}
      {view === 'overview' && (
        <Row gutter={[16, 16]}>
          {/* Ana Metrikler */}
          <Col xs={24} md={18}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic
                    title="Toplam Süre"
                    value={formatTime(stats.totalTime)}
                    prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic
                    title="Oturum Sayısı"
                    value={stats.sessionsCount}
                    prefix={<BookOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic
                    title="Ortalama Kalite"
                    value={stats.averageQuality}
                    suffix="/5"
                    prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic
                    title="Güncel Seri"
                    value={stats.streak}
                    suffix="gün"
                    prefix={<FireOutlined style={{ color: '#ff4d4f' }} />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>
          </Col>

          {/* Haftalık Hedef Progress */}
          {period === 'week' && (
            <Col xs={24} md={6}>
              <Card size="small" title="Haftalık Hedef">
                <Progress
                  type="dashboard"
                  percent={Math.round(stats.weeklyProgress)}
                  format={(percent) => `${percent}%`}
                  strokeColor={{
                    '0%': '#ff4d4f',
                    '50%': '#faad14',
                    '100%': '#52c41a',
                  }}
                />
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatTime(stats.totalTime)} / {formatTime(stats.weeklyGoal)}
                  </Text>
                </div>
              </Card>
            </Col>
          )}

          {/* Performans Özeti */}
          <Col xs={24}>
            <Card title="Performans Özeti" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Space direction="vertical" size="small">
                    <Text strong>📚 En İyi Ders</Text>
                    <Tag color="blue" style={{ fontSize: 14 }}>
                      {stats.bestSubject.charAt(0).toUpperCase() + stats.bestSubject.slice(1)}
                    </Tag>
                  </Space>
                </Col>
                
                <Col xs={24} sm={8}>
                  <Space direction="vertical" size="small">
                    <Text strong>⚡ En Çok Kullanılan Teknik</Text>
                    <Tag color="green" style={{ fontSize: 14 }}>
                      {stats.mostUsedTechnique}
                    </Tag>
                  </Space>
                </Col>
                
                <Col xs={24} sm={8}>
                  <Space direction="vertical" size="small">
                    <Text strong>📈 Ortalama Verimlilik</Text>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: 600,
                      color: stats.averageEfficiency >= 80 ? '#52c41a' : 
                             stats.averageEfficiency >= 60 ? '#faad14' : '#ff4d4f'
                    }}>
                      %{stats.averageEfficiency}
                    </Text>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {/* Subjects View */}
      {view === 'subjects' && (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="Ders Bazlı Analiz">
              <List
                dataSource={Object.entries(stats.subjectBreakdown).sort(([,a], [,b]) => b - a)}
                renderItem={([subject, duration]) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar style={{ backgroundColor: '#1890ff' }}>
                        {subject.charAt(0).toUpperCase()}
                      </Avatar>}
                      title={subject.charAt(0).toUpperCase() + subject.slice(1)}
                      description={`Toplam ${formatTime(duration as number)} çalışıldı`}
                    />
                    <Progress 
                      percent={Math.round((duration as number / stats.totalTime) * 100)} 
                      size="small" 
                      style={{ width: 200 }}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Techniques View */}
      {view === 'techniques' && (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="Teknik Kullanım Analizi">
              <List
                dataSource={Object.entries(stats.techniqueBreakdown).sort(([,a], [,b]) => b - a)}
                renderItem={([technique, count]) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar style={{ backgroundColor: '#52c41a' }}>
                        {technique.charAt(0).toUpperCase()}
                      </Avatar>}
                      title={technique}
                      description={`${count} oturumda kullanıldı`}
                    />
                    <Progress 
                      percent={Math.round((count as number / stats.sessionsCount) * 100)} 
                      size="small" 
                      style={{ width: 200 }}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Performance View */}
      {view === 'performance' && (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Ruh Hali Dağılımı" size="small">
              <List
                dataSource={Object.entries(stats.moodBreakdown).sort(([,a], [,b]) => b - a)}
                renderItem={([mood, count]) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<SmileOutlined style={{ color: '#faad14' }} />}
                      title={mood}
                      description={`${count} oturum`}
                    />
                  </List.Item>
                )}
                size="small"
              />
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="Dikkat Dağınıklığı" size="small">
              <div style={{ textAlign: 'center', padding: 20 }}>
                <PhoneOutlined style={{ fontSize: 32, color: '#ff4d4f', marginBottom: 16 }} />
                <div>
                  <Text style={{ fontSize: 24, fontWeight: 600 }}>
                    {stats.totalDistractions}
                  </Text>
                </div>
                <Text type="secondary">Toplam Dikkat Dağınıklığı</Text>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Oturum başına ortalama: {Math.round(stats.totalDistractions / stats.sessionsCount * 10) / 10}
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
          
          <Col xs={24}>
            <Card title="Günlük Ortalama" size="small">
              <div style={{ textAlign: 'center', padding: 20 }}>
                <CalendarOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 16 }} />
                <div>
                  <Text style={{ fontSize: 24, fontWeight: 600 }}>
                    {formatTime(stats.dailyAverage)}
                  </Text>
                </div>
                <Text type="secondary">Günlük Ortalama Çalışma Süresi</Text>
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default StudyStatistics;