import React, { useEffect, useMemo, useState } from 'react';
import { Card, List, Tag, Typography, DatePicker, Select, Space, Button, Empty, Spin, Pagination } from 'antd';
import { Link } from 'react-router-dom';
import { getStudentPrograms, StudentProgram } from '../../services/api';

const { Title, Text } = Typography;

const statusOptions = [
  { label: 'Tümü', value: '' },
  { label: 'Taslak', value: 'draft' },
  { label: 'Aktif', value: 'active' },
  { label: 'Tamamlandı', value: 'completed' },
  { label: 'Başarısız', value: 'failed' },
  { label: 'Arşiv', value: 'archived' },
];

const statusColor: Record<string, string> = {
  draft: 'default',
  active: 'processing',
  completed: 'success',
  failed: 'error',
  archived: 'purple',
};

const PAGE_SIZE_DEFAULT = 10;

const StudentPrograms: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<StudentProgram[]>([]);
  const [total, setTotal] = useState(0);

  const [status, setStatus] = useState<string | undefined>();
  const [from, setFrom] = useState<any>(null);
  const [to, setTo] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE_DEFAULT);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getStudentPrograms({
        status: (status as any) || undefined,
        from: from ? from.toDate().toISOString() : undefined,
        to: to ? to.toDate().toISOString() : undefined,
        page,
        limit,
      });
      setItems(res.data || []);
      setTotal(res.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, from, to, page, limit]);

  const header = useMemo(() => (
    <Space wrap>
      <Select
        options={statusOptions}
        value={status ?? ''}
        style={{ width: 160 }}
        onChange={(v) => { setPage(1); setStatus(v || undefined); }}
      />
      <DatePicker
        placeholder="Başlangıç"
        value={from}
        onChange={(d) => { setPage(1); setFrom(d); }}
      />
      <DatePicker
        placeholder="Bitiş"
        value={to}
        onChange={(d) => { setPage(1); setTo(d); }}
      />
      <Select
        style={{ width: 120 }}
        value={limit}
        onChange={(v) => { setPage(1); setLimit(v); }}
        options={[10, 20, 50].map(n => ({ label: `${n}/sayfa`, value: n }))}
      />
      <Button onClick={() => { setStatus(undefined); setFrom(null); setTo(null); setPage(1); setLimit(PAGE_SIZE_DEFAULT); }}>Temizle</Button>
    </Space>
  ), [status, from, to, limit]);

  return (
    <Card title={<Title level={5} style={{ margin: 0 }}>Programlarım</Title>} extra={header}>
      {loading ? (
        <Spin />
      ) : items.length === 0 ? (
        <Empty description="Kayıt bulunamadı" />
      ) : (
        <>
          <List
            itemLayout="vertical"
            dataSource={items}
            renderItem={(p) => (
              <List.Item key={p._id}
                extra={<Tag color={statusColor[p.status] || 'default'}>{p.status}</Tag>}
              >
                <List.Item.Meta
                  title={<Link to={`/student/programs/${p._id}`}>{p.title || 'Çalışma Programı'}</Link>}
                  description={<Text type="secondary">{new Date(p.date).toLocaleDateString('tr-TR')} · {p.subjects?.length || 0} konu</Text>}
                />
              </List.Item>
            )}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <Pagination
              current={page}
              pageSize={limit}
              total={total}
              onChange={(p, ps) => { setPage(p); setLimit(ps); }}
              size="small"
              showSizeChanger
            />
          </div>
        </>
      )}
    </Card>
  );
};

export default StudentPrograms;


