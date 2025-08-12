import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, List, Typography, Tag, Space, Button, Skeleton, Alert } from 'antd';
import { getStudentProgramDetail, StudentProgram } from '../../services/api';

const { Title, Text } = Typography;

const statusColor: Record<string, string> = {
  draft: 'default',
  active: 'processing',
  completed: 'success',
  failed: 'error',
  archived: 'purple',
};

const StudentProgramDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<StudentProgram | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getStudentProgramDetail(id);
      setProgram(res.data);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Kayıt bulunamadı');
      setProgram(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <Card
      title={(
        <Space>
          <Link to="/student/coach">← Geri</Link>
          <Title level={5} style={{ margin: 0 }}>{program?.title || 'Çalışma Programı'}</Title>
          {program && <Tag color={statusColor[program.status] || 'default'}>{program.status}</Tag>}
        </Space>
      )}
    >
      {loading ? (
        <Skeleton active />
      ) : error ? (
        <Alert type="error" message={error} showIcon action={<Link to="/student/coach">Listeye Dön</Link>} />
      ) : !program ? (
        <Alert type="warning" message="Kayıt bulunamadı" showIcon action={<Link to="/student/coach">Listeye Dön</Link>} />
      ) : (
        <>
          <Text type="secondary">Tarih: {new Date(program.date).toLocaleDateString('tr-TR')}</Text>
          <List
            style={{ marginTop: 12 }}
            header={<Text strong>Konu Listesi</Text>}
            dataSource={program.subjects || []}
            renderItem={(s, idx) => (
              <List.Item key={idx}
                actions={[
                  <Text key="t">Hedef Süre: {s.targetTime ?? 0} dk</Text>,
                  <Text key="st">Çalışma: {s.studyTime ?? 0} dk</Text>,
                  <Text key="cq">Tamamlanan: {s.completedQuestions ?? 0}</Text>,
                ]}
              >
                <List.Item.Meta
                  title={<Text>{s.subject}</Text>}
                  description={<Text type="secondary">{s.description || '-'}</Text>}
                />
              </List.Item>
            )}
          />
        </>
      )}
    </Card>
  );
};

export default StudentProgramDetail;


