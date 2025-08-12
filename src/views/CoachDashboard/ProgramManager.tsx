import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Space, Tag, Form, Select, DatePicker, Modal, Input, message, Switch, Popconfirm } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { apiRequest } from '../../services/api';

interface ProgramRow {
  _id: string;
  title: string;
  date: string;
  student?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  subjectsCount: number;
  status: 'draft' | 'active' | 'completed' | 'failed' | 'archived';
}

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

const ProgramManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ current: 1, pageSize: 10, total: 0 });

  // Filters
  const [students, setStudents] = useState<{ value: string; label: string }[]>([]);
  const [filters, setFilters] = useState<{ studentId?: string; date?: Dayjs | null }>({});

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editing, setEditing] = useState<{ id: string; title: string; coachNotes: string; date: Dayjs | null } | null>(null);
  const [hideMock, setHideMock] = useState<boolean>(true);
  const [deletingMock, setDeletingMock] = useState<boolean>(false);

  const columns: ColumnsType<ProgramRow> = [
    {
      title: 'Öğrenci',
      dataIndex: ['student', 'name'],
      key: 'student',
      render: (_: any, record) => record.student ? (
        <div>
          <div style={{ fontWeight: 600 }}>{record.student.name}</div>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>{record.student.email}</div>
        </div>
      ) : <span>-</span>
    },
    { title: 'Başlık', dataIndex: 'title', key: 'title' },
    {
      title: 'Tarih',
      dataIndex: 'date',
      key: 'date',
      render: (value: string) => dayjs(value).format('DD/MM/YYYY'),
      width: 130
    },
    {
      title: 'Ders Sayısı',
      dataIndex: 'subjectsCount',
      key: 'subjectsCount',
      align: 'center',
      width: 110
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
          status === 'failed' ? 'error' :
          status === 'archived' ? 'default' : 'default';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>Düzenle</Button>
          <Popconfirm
            title="Bu program silinsin mi?"
            okText="Evet"
            cancelText="Hayır"
            onConfirm={() => deleteProgram(record._id)}
          >
            <Button size="small" danger>Sil</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const fetchStudents = async () => {
    try {
      const res = await apiRequest(`/coach/students?page=1&limit=100`);
      const items = (res.data || []).map((s: any) => ({
        value: s._id,
        label: s.fullName || s.email
      }));
      setStudents(items);
    } catch (e: any) {
      message.error(e.message || 'Öğrenci listesi getirilemedi');
    }
  };

  const fetchPrograms = async (page = pagination.current, pageSize = pagination.pageSize) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (filters.studentId) params.set('studentId', filters.studentId);
      if (filters.date) params.set('date', filters.date!.format('YYYY-MM-DD'));

      const res = await apiRequest(`/coach/programs?${params.toString()}`);
      setPrograms(res.data || []);
      setPagination({
        current: page,
        pageSize,
        total: res.pagination?.total || 0
      });
    } catch (e: any) {
      message.error(e.message || 'Program listesi getirilemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramDetail = async (id: string) => {
    const res = await apiRequest(`/coach/programs/${id}`);
    return res.data;
  };

  const openEdit = async (row: ProgramRow) => {
    try {
      setEditLoading(true);
      const detail = await fetchProgramDetail(row._id);
      setEditing({
        id: row._id,
        title: detail?.title || row.title || '',
        coachNotes: detail?.coachNotes || '',
        date: detail?.date ? dayjs(detail.date) : (row.date ? dayjs(row.date) : null)
      });
      setEditOpen(true);
    } catch (e: any) {
      message.error(e.message || 'Program detayı yüklenemedi');
    } finally {
      setEditLoading(false);
    }
  };

  const submitEdit = async () => {
    if (!editing) return;
    try {
      setEditLoading(true);
      await apiRequest(`/coach/programs/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editing.title,
          coachNotes: editing.coachNotes,
          date: editing.date ? editing.date.format('YYYY-MM-DD') : undefined
          // Not: İleride subjects düzenlemesi eklenecek (backend PUT bunu da destekliyor)
        })
      });
      message.success('Program güncellendi');
      setEditOpen(false);
      setEditing(null);
      fetchPrograms();
    } catch (e: any) {
      message.error(e.message || 'Program güncellenemedi');
    } finally {
      setEditLoading(false);
    }
  };

  const isMockProgram = (row: ProgramRow): boolean => {
    const email = row.student?.email?.toLowerCase() || '';
    const title = (row.title || '').toLowerCase();
    if (email.includes('@example.com')) return true;
    if (email === 'student@yks.com') return true;
    if (title.includes('test')) return true;
    return false;
  };

  const deleteProgram = async (id: string) => {
    try {
      await apiRequest(`/coach/programs/${id}`, { method: 'DELETE' });
      message.success('Program silindi');
      fetchPrograms();
    } catch (e: any) {
      message.error(e.message || 'Program silinemedi');
    }
  };

  const mockCount = useMemo(() => programs.filter(p => isMockProgram(p)).length, [programs]);

  const deleteMockPrograms = async () => {
    const targets = programs.filter(p => isMockProgram(p));
    if (targets.length === 0) {
      message.info('Silinecek test verisi bulunamadı');
      return;
    }
    try {
      setDeletingMock(true);
      let success = 0;
      for (const p of targets) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await apiRequest(`/coach/programs/${p._id}`, { method: 'DELETE' });
          success += 1;
        } catch {}
      }
      message.success(`${success}/${targets.length} mock program silindi`);
      fetchPrograms();
    } catch (e: any) {
      message.error(e.message || 'Mock programlar silinirken hata oluştu');
    } finally {
      setDeletingMock(false);
    }
  };

  const handleTableChange = (p: TablePaginationConfig) => {
    fetchPrograms(p.current || 1, p.pageSize || 10);
  };

  const applyFilters = () => {
    fetchPrograms(1, pagination.pageSize);
  };

  const resetFilters = () => {
    setFilters({});
    fetchPrograms(1, pagination.pageSize);
  };

  useEffect(() => {
    fetchStudents();
    fetchPrograms(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Card title="Program Yönetimi" style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item label="Öğrenci">
            <Select
              allowClear
              placeholder="Öğrenci seçin"
              options={students}
              value={filters.studentId}
              style={{ minWidth: 220 }}
              onChange={(val) => setFilters(prev => ({ ...prev, studentId: val }))}
            />
          </Form.Item>
          <Form.Item label="Tarih">
            <DatePicker
              allowClear
              placeholder="Tarih seç"
              value={filters.date || null}
              onChange={(val) => setFilters(prev => ({ ...prev, date: val }))}
              style={{ minWidth: 160 }}
              format="DD/MM/YYYY"
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" onClick={applyFilters}>Uygula</Button>
              <Button onClick={resetFilters}>Temizle</Button>
              <span style={{ marginLeft: 12 }}>
                Test verilerini gizle
                <Switch
                  style={{ marginLeft: 8 }}
                  checked={hideMock}
                  onChange={setHideMock}
                />
              </span>
              <Popconfirm
                title={`Mock programları sil (${mockCount} adet)?`}
                okText="Evet"
                cancelText="Hayır"
                onConfirm={deleteMockPrograms}
                disabled={mockCount === 0 || deletingMock}
              >
                <Button danger disabled={mockCount === 0 || deletingMock} loading={deletingMock}>
                  Mock'ları Sil ({mockCount})
                </Button>
              </Popconfirm>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          rowKey="_id"
          loading={loading}
          columns={columns}
          dataSource={hideMock ? programs.filter(p => !isMockProgram(p)) : programs}
          pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title="Programı Düzenle"
        open={editOpen}
        onCancel={() => { setEditOpen(false); setEditing(null); }}
        onOk={submitEdit}
        confirmLoading={editLoading}
        okText="Kaydet"
        cancelText="İptal"
      >
        {editing && (
          <Form layout="vertical">
            <Form.Item label="Başlık">
              <Input
                placeholder="Program başlığı"
                value={editing.title}
                onChange={(e) => setEditing(prev => prev ? { ...prev, title: e.target.value } : prev)}
              />
            </Form.Item>
            <Form.Item label="Program Tarihi">
              <DatePicker
                value={editing.date}
                onChange={(val) => setEditing(prev => prev ? { ...prev, date: val } : prev)}
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
              />
            </Form.Item>
            <Form.Item label="Koç Notları">
              <Input.TextArea
                rows={4}
                placeholder="Örn: Genel hat düzeltmeleri / duyurular"
                value={editing.coachNotes}
                onChange={(e) => setEditing(prev => prev ? { ...prev, coachNotes: e.target.value } : prev)}
                maxLength={1000}
                showCount
              />
            </Form.Item>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              İpucu: Ders bazlı düzenlemeleri ileride ekleyeceğiz. Şimdilik başlık, tarih ve koç notlarını güncelleyebilirsiniz.
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default ProgramManager;