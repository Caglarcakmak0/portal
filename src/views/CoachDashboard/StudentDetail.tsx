import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { Card, Descriptions, Space, Button, message, Typography, Row, Col, Tag, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { apiRequest } from '../../services/api';
import { useIsCoach } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

type StudentInfo = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  grade?: string;
  city?: string;
};

type ProgramRow = {
  _id: string;
  title: string;
  date: string;
  subjectsCount: number;
  status: 'draft' | 'active' | 'completed' | 'failed' | 'archived';
};

const StudentDetail: React.FC = () => {
  const isCoach = useIsCoach();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [search] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [stats, setStats] = useState<{ totalStudyTime: number; totalStudySessions: number; streak: number; lastActivity: string | null } | null>(null);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await apiRequest(`/coach/students/${id}`);
      const d = res.data || {};
      setStudent(d.student || null);
      setStats(d.stats || null);
    } catch (e: any) {
      message.error(e.message || 'Öğrenci detayı getirilemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    if (!id) return;
    try {
      const date = search.get('date');
      const qs = new URLSearchParams();
      qs.set('studentId', id);
      if (date) qs.set('date', date);
      const res = await apiRequest(`/coach/programs?${qs.toString()}`);
      setPrograms(res.data || []);
    } catch (e: any) {
      message.error(e.message || 'Program listesi getirilemedi');
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchPrograms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const columns: ColumnsType<ProgramRow> = [
    {
      title: 'Başlık',
      dataIndex: 'title',
      key: 'title',
      render: (val: string) => <Text strong>{val}</Text>
    },
    {
      title: 'Tarih',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (value: string) => dayjs(value).format('DD/MM/YYYY')
    },
    {
      title: 'Ders',
      dataIndex: 'subjectsCount',
      key: 'subjectsCount',
      width: 100,
      align: 'center'
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: ProgramRow['status']) => {
        const color =
          status === 'active' ? 'processing' :
          status === 'completed' ? 'success' :
          status === 'failed' ? 'error' : 'default';
        return <Tag color={color}>{status}</Tag>;
      }
    },
  ];

  if (!isCoach) {
    return <Card>Koç yetkisi gereklidir.</Card>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button onClick={() => navigate(-1)}>Geri</Button>
          {id && (
            <Link to={`/coach/programs/create?studentId=${id}`}>
              <Button type="primary">Program Oluştur</Button>
            </Link>
          )}
        </Space>
      </div>

      <Card loading={loading} style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              {(student?.firstName || student?.lastName) ? `${student?.firstName || ''} ${student?.lastName || ''}`.trim() : (student?.email || 'Öğrenci')}
            </Title>
            <Text type="secondary">{student?.email}</Text>
          </Col>
          <Col>
            <Space>
              <Tag color="blue">{student?.grade || '12. Sınıf'}</Tag>
              {student?.city && <Tag>{student.city}</Tag>}
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card>
            <Descriptions title="Özet" column={1} size="small">
              <Descriptions.Item label="Toplam Çalışma Zamanı">{(stats?.totalStudyTime || 0)} dk</Descriptions.Item>
              <Descriptions.Item label="Toplam Oturum">{stats?.totalStudySessions || 0}</Descriptions.Item>
              <Descriptions.Item label="Günlük Seri">{stats?.streak || 0}</Descriptions.Item>
              <Descriptions.Item label="Son Aktivite">{stats?.lastActivity ? dayjs(stats.lastActivity).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="Programlar">
            <Table
              rowKey="_id"
              columns={columns}
              dataSource={programs}
              pagination={{ pageSize: 10, showSizeChanger: true }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StudentDetail;


