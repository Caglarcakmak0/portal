import React, { useState, useEffect } from "react";
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
  Tabs,
} from "antd";

import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  BarChartOutlined,
  CalendarOutlined,
  TrophyOutlined,
  FireOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { StudyTimer, StudyStatistics, StudyCalendar, SessionHistory } from "./bones";
import { apiRequest } from "../../services/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/tr"; // Türkçe locale

// Plugins'leri aktif et
dayjs.extend(relativeTime);
dayjs.locale("tr");

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
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "all"
  >("week");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [statisticsRefresh, setStatisticsRefresh] = useState<number>(0);

  // Veri getirme
  const fetchStudyData = async () => {
    try {
      setLoading(true);

      // Analytics API'den genel istatistikl
      const response = await apiRequest("/study-sessions", {
        method: "GET",
      });
      console.log(response);
      setSessions(response);

      // Stats hesaplama
      const totalTime = response.reduce(
        (sum: number, s: any) => sum + s.duration,
        0
      );
      const avgQuality =
        response.reduce((sum: number, s: any) => sum + s.quality, 0) /
        response.length;

      setStats({
        totalTime,
        sessionsCount: response.length,
        averageQuality: avgQuality,
        currentStreak: 3, // mock
        bestSubject: "Fizik",
        totalDistraction: response.reduce(
          (sum: number, s: any) => sum + s.distractions,
          0
        ),
      });
    } catch (error) {
      console.error("Study data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyData();
  }, []);

  // Session tamamlandığında
  const handleSessionComplete = async (sessionData: any) => {
    try {
      console.log("Yeni oturum tamamlandı:", sessionData);
      const response = await apiRequest("/study-sessions", {
        method: "POST",
        body: JSON.stringify(sessionData),
      });
      console.log(response);
      await fetchStudyData();
      setStatisticsRefresh(prev => prev + 1);
    } catch (error) {
      console.error("Oturum kaydetme hatası:", error);
    }
  };

  // Tablo kolonları
  const sessionColumns = [
    {
      title: "Tarih",
      dataIndex: "date",
      key: "date",
      render: (date: Date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      sorter: (a: StudySession, b: StudySession) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: "Ders",
      dataIndex: "subject",
      key: "subject",
      render: (subject: string) => (
        <Tag color="blue">
          {subject.charAt(0).toUpperCase() + subject.slice(1)}
        </Tag>
      ),
      filters: [
        { text: "Matematik", value: "matematik" },
        { text: "Fizik", value: "fizik" },
        { text: "Kimya", value: "kimya" },
        { text: "Biyoloji", value: "biyoloji" },
      ],
      onFilter: (value: any, record: StudySession) => record.subject === value,
    },
    {
      title: "Süre",
      dataIndex: "duration",
      key: "duration",
      render: (duration: number) => `${duration} dk`,
      sorter: (a: StudySession, b: StudySession) => a.duration - b.duration,
    },
    {
      title: "Teknik",
      dataIndex: "technique",
      key: "technique",
      render: (technique: string) => (
        <Tag
          color={
            technique === "Pomodoro"
              ? "orange"
              : technique === "Timeblock"
              ? "green"
              : "blue"
          }
        >
          {technique}
        </Tag>
      ),
    },
    {
      title: "Kalite",
      dataIndex: "quality",
      key: "quality",
      render: (quality: number) => (
        <div>
          {"⭐".repeat(quality)}
          <Text type="secondary"> ({quality}/5)</Text>
        </div>
      ),
      sorter: (a: StudySession, b: StudySession) => a.quality - b.quality,
    },
    {
      title: "Verimlilik",
      dataIndex: "efficiency",
      key: "efficiency",
      render: (efficiency: number) => (
        <Text
          style={{
            color:
              efficiency >= 80
                ? "#52c41a"
                : efficiency >= 60
                ? "#faad14"
                : "#ff4d4f",
          }}
        >
          %{efficiency}
        </Text>
      ),
      sorter: (a: StudySession, b: StudySession) => a.efficiency - b.efficiency,
    },
    {
      title: "Ruh Hali",
      dataIndex: "mood",
      key: "mood",
      render: (mood: string) => {
        const moodColors = {
          Enerjik: "green",
          Normal: "blue",
          Yorgun: "orange",
          Motivasyonsuz: "red",
          Stresli: "volcano",
          Mutlu: "cyan",
        };
        return (
          <Tag color={moodColors[mood as keyof typeof moodColors]}>{mood}</Tag>
        );
      },
    },
  ];

  // Süre formatlama
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}s ${mins}d` : `${mins}d`;
  };

  return (
    <div style={{ padding: "0 0 24px 0" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <Title level={2} style={{ margin: 0 }}>
          📚 Çalışma Takip Merkezi
        </Title>
        <Text type="secondary">
          Çalışma seanslarını takip et, istatistikleri görüntüle ve hedeflerini
          gerçekleştir.
        </Text>
      </div>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Sol Panel - Timer ve İstatistikler */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
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
                      valueStyle={{ fontSize: "16px" }}
                    />
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title="Oturum Sayısı"
                      value={stats.sessionsCount}
                      prefix={<PlayCircleOutlined />}
                      valueStyle={{ fontSize: "16px" }}
                    />
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title="Ortalama Kalite"
                      value={stats.averageQuality.toFixed(1)}
                      suffix="/5"
                      prefix={<TrophyOutlined />}
                      valueStyle={{ fontSize: "16px" }}
                    />
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title="Güncel Seri"
                      value={stats.currentStreak}
                      suffix="gün"
                      prefix={<FireOutlined />}
                      valueStyle={{ fontSize: "16px" }}
                    />
                  </Col>
                </Row>
              </Card>
            )}

            {/* En Son Aktiviteler */}
            <Card title="🕐 Son Aktiviteler" size="small">
              <Timeline
                items={sessions.slice(0, 5).map((session) => ({
                  color: session.efficiency >= 80 ? "green" : "blue",
                  children: (
                    <div key={session._id}>
                      <Text strong>{session.subject}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        {formatTime(session.duration)} • {session.technique} •
                        ⭐{session.quality}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: "11px" }}>
                        {dayjs(session.date).fromNow()}
                      </Text>
                    </div>
                  ),
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
                key: "sessions",
                label: (
                  <span>
                    <HistoryOutlined />
                    Oturum Geçmişi
                  </span>
                ),
                children: (
                  <SessionHistory refreshTrigger={statisticsRefresh} />
                ),
              },
              {
                key: "stats",
                label: (
                  <span>
                    <BarChartOutlined />
                    İstatistikler
                  </span>
                ),
                children: (
                  <StudyStatistics refreshTrigger={statisticsRefresh} />
                ),
              },
              {
                key: "calendar",
                label: (
                  <span>
                    <CalendarOutlined />
                    Takvim
                  </span>
                ),
                children: (
                  <StudyCalendar refreshTrigger={statisticsRefresh} />
                ),
              },
            ]}
          />
        </Col>
      </Row>
    </div>
  );
};

export default StudyTracker;
