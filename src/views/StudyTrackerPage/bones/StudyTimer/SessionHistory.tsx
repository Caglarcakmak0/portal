import React, { useState, useEffect } from 'react';
import { 
  Card,
  Table,
  Tag,
  Button,
  Select,
  DatePicker,
  Space,
  Typography,
  message
} from 'antd';
import {
  BarChartOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiRequest } from '../../../../services/api';

const { Text } = Typography;
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

interface SessionHistoryProps {
  refreshTrigger?: number;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ refreshTrigger = 0 }) => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("week");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  // Veri getirme
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("/study-sessions", {
        method: "GET",
      });
      setSessions(response || []);
    } catch (error) {
      console.error("Session geçmişi alınamadı:", error);
      message.error("Oturum geçmişi yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [refreshTrigger]);

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
        { text: "Türkçe", value: "turkce" },
        { text: "Tarih", value: "tarih" },
        { text: "Coğrafya", value: "cografya" },
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
              : technique === "Stopwatch"
              ? "blue"
              : "purple"
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

  // Filtered sessions
  const filteredSessions = sessions.filter(session => {
    // Subject filter
    if (selectedSubject !== 'all' && session.subject !== selectedSubject) {
      return false;
    }

    // Period filter
    const sessionDate = dayjs(session.date);
    const now = dayjs();
    
    switch (selectedPeriod) {
      case 'week':
        return sessionDate.isAfter(now.subtract(1, 'week'));
      case 'month':
        return sessionDate.isAfter(now.subtract(1, 'month'));
      default:
        return true;
    }
  });

  return (
    <Card>
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <HistoryOutlined style={{ marginRight: 8 }} />
          <span style={{ fontWeight: 600, fontSize: 16 }}>
            Oturum Geçmişi
          </span>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {filteredSessions.length} oturum listeleniyor
            </Text>
          </div>
        </div>
      </div>

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
            <Select.Option value="biyoloji">Biyoloji</Select.Option>
            <Select.Option value="turkce">Türkçe</Select.Option>
            <Select.Option value="tarih">Tarih</Select.Option>
            <Select.Option value="cografya">Coğrafya</Select.Option>
          </Select>

          <RangePicker size="small" />

          <Button
            icon={<BarChartOutlined />}
            type="dashed"
            size="small"
            onClick={() => message.info('Analiz özelliği yakında!')}
          >
            Analiz
          </Button>
        </Space>
      </div>

      {/* Sessions Table */}
      <Table
        columns={sessionColumns}
        dataSource={filteredSessions}
        rowKey="_id"
        loading={loading}
        size="small"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} / ${total} oturum`,
        }}
        scroll={{ x: true }}
      />
    </Card>
  );
};

export default SessionHistory;