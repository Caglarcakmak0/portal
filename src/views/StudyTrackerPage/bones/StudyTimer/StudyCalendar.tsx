import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Badge, 
  Card, 
  Typography, 
  Row, 
  Col, 
  Statistic,
  List,
  Tag,
  Space,
  Button,
  Select,
  Tooltip,
  Modal,
  Empty,
  Spin
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  FireOutlined,
  BookOutlined,
  LeftOutlined,
  RightOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
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

interface DayData {
  date: string;
  sessions: StudySession[];
  totalTime: number;
  averageQuality: number;
  averageEfficiency: number;
  sessionCount: number;
}

type ViewMode = 'month' | 'year';

interface StudyCalendarProps {
  refreshTrigger?: number;
}

const StudyCalendar: React.FC<StudyCalendarProps> = ({ refreshTrigger = 0 }) => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState<DayData | null>(null);
  
  // Veri getirme
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/study-sessions', { method: 'GET' });
      
      if (response && Array.isArray(response)) {
        setSessions(response);
      }
    } catch (error) {
      console.error('Session verisi alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  // Günlük verileri organize et
  const organizeDayData = (): { [key: string]: DayData } => {
    const dayDataMap: { [key: string]: DayData } = {};
    
    sessions.forEach(session => {
      const dateKey = dayjs(session.date).format('YYYY-MM-DD');
      
      if (!dayDataMap[dateKey]) {
        dayDataMap[dateKey] = {
          date: dateKey,
          sessions: [],
          totalTime: 0,
          averageQuality: 0,
          averageEfficiency: 0,
          sessionCount: 0
        };
      }
      
      dayDataMap[dateKey].sessions.push(session);
      dayDataMap[dateKey].totalTime += session.duration;
      dayDataMap[dateKey].sessionCount++;
    });
    
    // Ortalamaları hesapla
    Object.keys(dayDataMap).forEach(dateKey => {
      const dayData = dayDataMap[dateKey];
      dayData.averageQuality = dayData.sessions.reduce((sum, s) => sum + s.quality, 0) / dayData.sessionCount;
      dayData.averageEfficiency = dayData.sessions.reduce((sum, s) => sum + s.efficiency, 0) / dayData.sessionCount;
    });
    
    return dayDataMap;
  };

  const dayDataMap = organizeDayData();

  // Günü göster
  const handleDayClick = (date: Dayjs) => {
    const dateKey = date.format('YYYY-MM-DD');
    const dayData = dayDataMap[dateKey];
    
    if (dayData && dayData.sessions.length > 0) {
      setSelectedDayData(dayData);
      setShowDayModal(true);
    }
  };

  // Takvim için özel renderer
  const dateCellRender = (date: Dayjs) => {
    const dateKey = date.format('YYYY-MM-DD');
    const dayData = dayDataMap[dateKey];
    
    if (!dayData || dayData.sessions.length === 0) {
      return null;
    }

    // İntensite seviyesi (renk hesaplama)
    const intensity = Math.min(4, Math.floor(dayData.totalTime / 30)); // Her 30dk için 1 seviye
    const colors = ['#f6ffed', '#d9f7be', '#b7eb8f', '#95de64', '#73d13d'];
    const color = colors[intensity];
    
    return (
      <div 
        className="calendar-day-content" 
        style={{ 
          backgroundColor: color,
          borderRadius: '4px',
          padding: '2px',
          border: `1px solid ${colors[Math.min(4, intensity + 1)]}`,
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onClick={() => handleDayClick(date)}
      >
        <div style={{ fontSize: '10px', color: '#666' }}>
          {dayData.sessionCount} oturum
        </div>
        <div style={{ fontSize: '9px', color: '#999' }}>
          {Math.floor(dayData.totalTime / 60)}s {dayData.totalTime % 60}d
        </div>
      </div>
    );
  };

  // Aylık cell renderer (yıl görünümü için)
  const monthCellRender = (date: Dayjs) => {
    const monthStart = date.startOf('month');
    const monthEnd = date.endOf('month');
    
    const monthSessions = sessions.filter(session => {
      const sessionDate = dayjs(session.date);
      return sessionDate.isAfter(monthStart) && sessionDate.isBefore(monthEnd);
    });
    
    if (monthSessions.length === 0) return null;
    
    const totalTime = monthSessions.reduce((sum, s) => sum + s.duration, 0);
    const sessionCount = monthSessions.length;
    
    return (
      <div className="month-cell-content">
        <div>{sessionCount} oturum</div>
        <div>{Math.floor(totalTime / 60)}s</div>
      </div>
    );
  };

  // Header controls
  const headerRender = ({ value, onChange }: any) => {
    const start = 0;
    const end = 12;
    const monthOptions = [];
    
    const current = value.clone();
    const localeData = value.localeData();
    const months = [];
    for (let i = 0; i < 12; i++) {
      current.month(i);
      months.push(localeData.monthsShort(current));
    }
    
    for (let index = start; index < end; index++) {
      monthOptions.push(
        <Option key={index} value={index}>
          {months[index]}
        </Option>
      );
    }
    
    const month = value.month();
    const year = value.year();
    
    return (
      <div style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button 
            size="small"
            icon={<LeftOutlined />}
            onClick={() => {
              const newValue = value.clone().subtract(1, viewMode);
              onChange(newValue);
            }}
          />
          
          <Select
            size="small"
            value={month}
            onChange={(selectedMonth) => {
              const newValue = value.clone().month(selectedMonth);
              onChange(newValue);
            }}
          >
            {monthOptions}
          </Select>
          
          <Select
            size="small"
            value={year}
            onChange={(selectedYear) => {
              const newValue = value.clone().year(selectedYear);
              onChange(newValue);
            }}
          >
            {Array.from({ length: 10 }, (_, i) => year - 5 + i).map(y => (
              <Option key={y} value={y}>{y}</Option>
            ))}
          </Select>
          
          <Button 
            size="small"
            icon={<RightOutlined />}
            onClick={() => {
              const newValue = value.clone().add(1, viewMode);
              onChange(newValue);
            }}
          />
        </Space>

        <Space>
          <Select
            size="small"
            value={viewMode}
            onChange={setViewMode}
          >
            <Option value="month">Ay Görünümü</Option>
            <Option value="year">Yıl Görünümü</Option>
          </Select>
        </Space>
      </div>
    );
  };

  // Streak hesaplama
  const calculateStreak = (): number => {
    if (sessions.length === 0) return 0;
    
    const sortedDates = sessions
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

  // Bu ay istatistikleri
  const getMonthStats = () => {
    const monthStart = selectedDate.startOf('month');
    const monthEnd = selectedDate.endOf('month');
    
    const monthSessions = sessions.filter(session => {
      const sessionDate = dayjs(session.date);
      return sessionDate.isAfter(monthStart.subtract(1, 'day')) && 
             sessionDate.isBefore(monthEnd.add(1, 'day'));
    });
    
    const totalTime = monthSessions.reduce((sum, s) => sum + s.duration, 0);
    const avgQuality = monthSessions.length > 0 ? 
      monthSessions.reduce((sum, s) => sum + s.quality, 0) / monthSessions.length : 0;
    
    const activeDays = new Set(monthSessions.map(s => dayjs(s.date).format('YYYY-MM-DD'))).size;
    
    return {
      totalTime,
      sessionCount: monthSessions.length,
      avgQuality: Math.round(avgQuality * 10) / 10,
      activeDays,
      streak: calculateStreak()
    };
  };

  const monthStats = getMonthStats();

  // Format süre
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}s ${mins}d` : `${mins}d`;
  };

  useEffect(() => {
    fetchSessions();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Takvim yükleniyor...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="study-calendar">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          📅 Çalışma Takvimi
        </Title>
        <Text type="secondary">
          Çalışma oturumlarını takvim üzerinde görüntüle ve analiz et
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Sol Panel - İstatistikler */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card title="Bu Ay Özet" size="small">
              <Row gutter={[8, 16]}>
                <Col xs={12}>
                  <Statistic
                    title="Toplam Süre"
                    value={formatTime(monthStats.totalTime)}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
                <Col xs={12}>
                  <Statistic
                    title="Oturum Sayısı"
                    value={monthStats.sessionCount}
                    prefix={<BookOutlined />}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
                <Col xs={12}>
                  <Statistic
                    title="Aktif Gün"
                    value={monthStats.activeDays}
                    suffix={`/ ${selectedDate.daysInMonth()}`}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
                <Col xs={12}>
                  <Statistic
                    title="Güncel Seri"
                    value={monthStats.streak}
                    suffix="gün"
                    prefix={<FireOutlined />}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
              </Row>
            </Card>

            <Card title="Renk Gösterge" size="small">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 16, height: 16, backgroundColor: '#f6ffed', border: '1px solid #d9f7be', borderRadius: 2 }}></div>
                  <Text style={{ fontSize: 12 }}>0-30 dakika</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 16, height: 16, backgroundColor: '#d9f7be', border: '1px solid #b7eb8f', borderRadius: 2 }}></div>
                  <Text style={{ fontSize: 12 }}>30-60 dakika</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 16, height: 16, backgroundColor: '#b7eb8f', border: '1px solid #95de64', borderRadius: 2 }}></div>
                  <Text style={{ fontSize: 12 }}>60-90 dakika</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 16, height: 16, backgroundColor: '#95de64', border: '1px solid #73d13d', borderRadius: 2 }}></div>
                  <Text style={{ fontSize: 12 }}>90-120 dakika</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 16, height: 16, backgroundColor: '#73d13d', border: '1px solid #52c41a', borderRadius: 2 }}></div>
                  <Text style={{ fontSize: 12 }}>120+ dakika</Text>
                </div>
              </Space>
            </Card>
          </Space>
        </Col>

        {/* Sağ Panel - Takvim */}
        <Col xs={24} lg={16}>
          <Card>
            <Calendar
              value={selectedDate}
              onChange={setSelectedDate}
              mode={viewMode}
              dateCellRender={viewMode === 'month' ? dateCellRender : undefined}
              monthCellRender={viewMode === 'year' ? monthCellRender : undefined}
              headerRender={headerRender}
            />
          </Card>
        </Col>
      </Row>

      {/* Günlük Detay Modal */}
      <Modal
        title={
          selectedDayData ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarOutlined />
              {dayjs(selectedDayData.date).format('DD MMMM YYYY')} - Çalışma Detayları
            </div>
          ) : 'Günlük Detay'
        }
        open={showDayModal}
        onCancel={() => setShowDayModal(false)}
        footer={null}
        width={600}
      >
        {selectedDayData && (
          <div>
            {/* Günlük Özet */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Statistic
                  title="Toplam Süre"
                  value={formatTime(selectedDayData.totalTime)}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Oturum Sayısı"
                  value={selectedDayData.sessionCount}
                  prefix={<BookOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Ort. Kalite"
                  value={selectedDayData.averageQuality.toFixed(1)}
                  suffix="/5"
                  prefix={<TrophyOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Ort. Verimlilik"
                  value={`${Math.round(selectedDayData.averageEfficiency)}%`}
                  prefix={<EyeOutlined />}
                />
              </Col>
            </Row>

            {/* Oturum Listesi */}
            <List
              header={<div style={{ fontWeight: 600 }}>Çalışma Oturumları</div>}
              dataSource={selectedDayData.sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
              renderItem={(session) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color="blue">
                          {session.subject.charAt(0).toUpperCase() + session.subject.slice(1)}
                        </Tag>
                        <Tag color={session.technique === 'Pomodoro' ? 'orange' : 'green'}>
                          {session.technique}
                        </Tag>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          {dayjs(session.date).format('HH:mm')}
                        </span>
                      </Space>
                    }
                    description={
                      <Space>
                        <span>⏱️ {formatTime(session.duration)}</span>
                        <span>⭐ {session.quality}/5</span>
                        <span>📊 %{session.efficiency}</span>
                        <span>😊 {session.mood}</span>
                        {session.notes && (
                          <Tooltip title={session.notes}>
                            <span style={{ cursor: 'help' }}>📝</span>
                          </Tooltip>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudyCalendar;