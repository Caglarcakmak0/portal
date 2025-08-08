import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Select,
  List,
  Tag,
  Modal,
  InputNumber,
  Popconfirm,
  Upload,
  Avatar,
  Spin,
  App
} from 'antd';
import { 
  AimOutlined, 
  EditOutlined, 
  SaveOutlined, 
  PlusOutlined,
  DeleteOutlined,
  StarOutlined,
  UploadOutlined,
  CameraOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

interface TargetUniversity {
  name: string;
  department: string;
  priority: number;
  image?: string;
  _id?: string;
}

interface GoalsData {
  targetUniversities: TargetUniversity[];
  targetFieldType?: string;
  targetYear?: number;
}

const Goals: React.FC = () => {
  const { user } = useAuth();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [goalsData, setGoalsData] = useState<GoalsData>({ targetUniversities: [] });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<TargetUniversity | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');

  // Popüler üniversiteler listesi
  const popularUniversities = [
    'İstanbul Teknik Üniversitesi',
    'Boğaziçi Üniversitesi', 
    'Orta Doğu Teknik Üniversitesi',
    'İstanbul Üniversitesi',
    'Ankara Üniversitesi',
    'Hacettepe Üniversitesi',
    'Gazi Üniversitesi',
    'Bilkent Üniversitesi',
    'Koç Üniversitesi',
    'Sabancı Üniversitesi',
    'Galatasaray Üniversitesi',
    'Yıldız Teknik Üniversitesi',
    'İzmir Yüksek Teknoloji Enstitüsü',
    'Ege Üniversitesi',
    'Dokuz Eylül Üniversitesi'
  ];

  // Popüler bölümler (alan türüne göre)
  const departmentsByField = {
    sayisal: [
      'Bilgisayar Mühendisliği',
      'Elektrik-Elektronik Mühendisliği', 
      'Makine Mühendisliği',
      'Endüstri Mühendisliği',
      'İnşaat Mühendisliği',
      'Yazılım Mühendisliği',
      'Tıp',
      'Diş Hekimliği',
      'Matematik',
      'Fizik',
      'Kimya',
      'Biyoloji'
    ],
    sozel: [
      'Hukuk',
      'İşletme',
      'Ekonomi',
      'Siyaset Bilimi ve Kamu Yönetimi',
      'Uluslararası İlişkiler',
      'Psikoloji',
      'Türk Dili ve Edebiyatı',
      'Tarih',
      'Sosyoloji',
      'Felsefe',
      'İletişim',
      'Gazetecilik'
    ],
    esit_agirlik: [
      'İşletme',
      'Ekonomi', 
      'Mimarlık',
      'Şehir ve Bölge Planlama',
      'Coğrafya',
      'İstatistik',
      'Jeoloji',
      'Peyzaj Mimarlığı'
    ],
    dil: [
      'İngiliz Dili ve Edebiyatı',
      'Çevirmenlik',
      'Amerikan Kültürü ve Edebiyatı',
      'Alman Dili ve Edebiyatı', 
      'Fransız Dili ve Edebiyatı',
      'Mütercim Tercümanlık',
      'Uluslararası İlişkiler'
    ]
  };

  // Goals verilerini backend'den al
  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/users/profile');
      
      if (response.data) {
        setGoalsData({
          targetUniversities: response.data.targetUniversities || [],
          targetFieldType: response.data.targetFieldType,
          targetYear: response.data.targetYear
        });
      }
    } catch (error) {
      console.error('Goals fetch error:', error);
      message.error('Hedef bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Yeni hedef üniversite ekle/düzenle
  const handleSaveGoal = async (values: any) => {
    try {
      setLoading(true);
      
      if (!user?._id) {
        throw new Error('Kullanıcı bilgisi bulunamadı');
      }

      let updatedGoals = [...goalsData.targetUniversities];
      
      if (editingGoal) {
        // Düzenleme modu
        const index = updatedGoals.findIndex(g => g._id === editingGoal._id || 
          (g.name === editingGoal.name && g.department === editingGoal.department));
        if (index !== -1) {
          updatedGoals[index] = { ...values };
        }
      } else {
        // Yeni ekleme
        updatedGoals.push(values);
      }

      // Priority'lere göre sırala
      updatedGoals.sort((a, b) => a.priority - b.priority);
      
      const response = await apiRequest(`/users/${user._id}`, {
        method: 'PUT',
        body: JSON.stringify({ targetUniversities: updatedGoals })
      });
      
      message.success(editingGoal ? 'Hedef güncellendi!' : 'Yeni hedef eklendi!');
      setGoalsData({ ...goalsData, targetUniversities: updatedGoals });
      setIsModalVisible(false);
      setEditingGoal(null);
      form.resetFields();
    } catch (error: any) {
      console.error('Goals save error:', error);
      message.error(error.message || 'Hedef kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  // Hedef sil
  const handleDeleteGoal = async (goalToDelete: TargetUniversity) => {
    try {
      setLoading(true);
      
      if (!user?._id) {
        throw new Error('Kullanıcı bilgisi bulunamadı');
      }

      const updatedGoals = goalsData.targetUniversities.filter(goal => 
        !(goal.name === goalToDelete.name && goal.department === goalToDelete.department)
      );
      
      await apiRequest(`/users/${user._id}`, {
        method: 'PUT',
        body: JSON.stringify({ targetUniversities: updatedGoals })
      });
      
      message.success('Hedef silindi!');
      setGoalsData({ ...goalsData, targetUniversities: updatedGoals });
    } catch (error: any) {
      console.error('Goals delete error:', error);
      message.error(error.message || 'Hedef silinemedi');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (goal?: TargetUniversity) => {
    if (goal) {
      setEditingGoal(goal);
      // Image URL'ini tam URL'ye çevir (eğer relative ise)
      const imageUrl = goal.image ? 
        (goal.image.startsWith('http') ? goal.image : `http://localhost:8000${goal.image}`) 
        : '';
      setCurrentImageUrl(imageUrl);
      form.setFieldsValue({...goal, image: imageUrl});
    } else {
      setEditingGoal(null);
      setCurrentImageUrl('');
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingGoal(null);
    setCurrentImageUrl('');
    form.resetFields();
  };

  // Image upload handler
  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);

      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'exists' : 'not found');

      const formData = new FormData();
      formData.append('universityImage', file);

      console.log('Uploading to:', 'http://localhost:8000/api/image/university-upload');

      const response = await fetch('http://localhost:8000/api/image/university-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.data || !result.data.imageUrl) {
        throw new Error('Invalid response format');
      }

      const fullImageUrl = `http://localhost:8000${result.data.imageUrl}`;
      setCurrentImageUrl(fullImageUrl);
      form.setFieldValue('image', fullImageUrl);
      message.success('Fotoğraf başarıyla yüklendi!');

      return fullImageUrl;

    } catch (error) {
      console.error('Image upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      message.error(`Fotoğraf yüklenirken hata oluştu: ${errorMessage}`);
      return false;
    } finally {
      setUploadingImage(false);
    }
  };

  // Upload component props
  const uploadProps = {
    name: 'universityImage',
    showUploadList: false,
    beforeUpload: (file: File) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
      if (!isJpgOrPng) {
        message.error('Sadece JPG, PNG, WEBP formatında dosyalar yükleyebilirsiniz!');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Dosya boyutu 5MB\'dan küçük olmalıdır!');
        return false;
      }
      
      handleImageUpload(file);
      return false; // Prevent default upload
    },
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 3) return 'red';
    if (priority <= 6) return 'orange'; 
    return 'green';
  };

  const getPriorityText = (priority: number) => {
    if (priority <= 3) return 'Yüksek Öncelik';
    if (priority <= 6) return 'Orta Öncelik';
    return 'Düşük Öncelik';
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <Title level={2}>
        <AimOutlined /> Hedeflerim
      </Title>

      {/* Alan Türü ve Yıl Bilgisi */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={12}>
          <Card size="small">
            <Text strong>Hedef Alan Türü: </Text>
            <Tag color="blue">
              {goalsData.targetFieldType === 'sayisal' ? 'Sayısal (SAY)' :
               goalsData.targetFieldType === 'sozel' ? 'Sözel (SÖZ)' :
               goalsData.targetFieldType === 'esit_agirlik' ? 'Eşit Ağırlık (EA)' :
               goalsData.targetFieldType === 'dil' ? 'Dil (DİL)' : 'Belirtilmemiş'}
            </Tag>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small">
            <Text strong>Hedef Yıl: </Text>
            <Tag color="green">{goalsData.targetYear || 'Belirtilmemiş'}</Tag>
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={4}>Hedef Üniversiteler ({goalsData.targetUniversities.length})</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => openModal()}
            disabled={goalsData.targetUniversities.length >= 10}
          >
            Hedef Ekle
          </Button>
        </div>

        {goalsData.targetUniversities.length > 0 ? (
          <List
            dataSource={goalsData.targetUniversities}
            renderItem={(goal) => (
              <List.Item
                actions={[
                  <Button 
                    type="text" 
                    icon={<EditOutlined />}
                    onClick={() => openModal(goal)}
                  >
                    Düzenle
                  </Button>,
                  <Popconfirm
                    title="Bu hedefi silmek istediğinizden emin misiniz?"
                    onConfirm={() => handleDeleteGoal(goal)}
                    okText="Evet"
                    cancelText="Hayır"
                  >
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />}
                    >
                      Sil
                    </Button>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    goal.image ? (
                      <Avatar 
                        size={64} 
                        src={goal.image.startsWith('http') ? goal.image : `http://localhost:8000${goal.image}`} 
                        style={{ borderRadius: '8px' }}
                      />
                    ) : (
                      <Avatar 
                        size={64} 
                        style={{ 
                          borderRadius: '8px', 
                          backgroundColor: '#f0f0f0',
                          color: '#999',
                          fontSize: '24px'
                        }}
                        icon={<StarOutlined />}
                      />
                    )
                  }
                  title={
                    <div>
                      <Text strong>{goal.name}</Text>
                      <Tag 
                        color={getPriorityColor(goal.priority)} 
                        style={{ marginLeft: '8px' }}
                      >
                        #{goal.priority} - {getPriorityText(goal.priority)}
                      </Tag>
                    </div>
                  }
                  description={goal.department}
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px', 
            backgroundColor: '#fafafa', 
            borderRadius: '8px',
            border: '2px dashed #d9d9d9'
          }}>
            <AimOutlined style={{ fontSize: '48px', color: '#bfbfbf', marginBottom: '16px' }} />
            <Title level={4} type="secondary">Henüz hedef üniversite eklemedin</Title>
            <Text type="secondary">YKS yolculuğunda hedeflerini belirlemek için üniversite ve bölüm ekle</Text>
            <br />
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => openModal()}
              style={{ marginTop: '16px' }}
            >
              İlk Hedefini Ekle
            </Button>
          </div>
        )}
      </Card>

      {/* Hedef Ekleme/Düzenleme Modal */}
      <Modal
        title={editingGoal ? 'Hedef Düzenle' : 'Yeni Hedef Ekle'}
        open={isModalVisible}
        onCancel={closeModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveGoal}
        >
          <Form.Item
            label="Üniversite Adı"
            name="name"
            rules={[
              { required: true, message: 'Üniversite adı gereklidir' },
              { max: 100, message: 'Üniversite adı en fazla 100 karakter olabilir' }
            ]}
          >
            <Select
              showSearch
              placeholder="Üniversite seçin veya yazın"
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {popularUniversities.map(uni => (
                <Option key={uni} value={uni}>{uni}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Bölüm"
            name="department"
            rules={[
              { required: true, message: 'Bölüm adı gereklidir' },
              { max: 100, message: 'Bölüm adı en fazla 100 karakter olabilir' }
            ]}
          >
            <Select
              showSearch
              placeholder="Bölüm seçin veya yazın"
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {goalsData.targetFieldType && departmentsByField[goalsData.targetFieldType as keyof typeof departmentsByField] ? 
                departmentsByField[goalsData.targetFieldType as keyof typeof departmentsByField].map(dept => (
                  <Option key={dept} value={dept}>{dept}</Option>
                )) : 
                Object.values(departmentsByField).flat().map(dept => (
                  <Option key={dept} value={dept}>{dept}</Option>
                ))
              }
            </Select>
          </Form.Item>

          <Form.Item
            label="Öncelik Sırası"
            name="priority"
            rules={[
              { required: true, message: 'Öncelik sırası gereklidir' },
              { type: 'number', min: 1, max: 10, message: 'Öncelik 1-10 arası olmalıdır' }
            ]}
            help="1=En yüksek öncelik, 10=En düşük öncelik"
          >
            <InputNumber 
              min={1} 
              max={10} 
              style={{ width: '100%' }}
              placeholder="Öncelik sırası (1-10)"
            />
          </Form.Item>

          {/* Üniversite Fotoğrafı */}
          <Form.Item
            label="Üniversite Fotoğrafı"
            name="image"
            help="Opsiyonel - Dashboard'da gösterilecek üniversite görseli (Max 5MB)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Mevcut fotoğraf preview */}
              {currentImageUrl && (
                <Avatar 
                  size={80} 
                  src={currentImageUrl} 
                  style={{ 
                    borderRadius: '8px',
                    border: '2px solid #d9d9d9'
                  }}
                />
              )}
              
              {/* Upload area */}
              <div style={{ flex: 1 }}>
                <Upload {...uploadProps}>
                  <Button 
                    icon={uploadingImage ? <LoadingOutlined /> : <CameraOutlined />}
                    loading={uploadingImage}
                    style={{ width: '100%' }}
                  >
                    {currentImageUrl ? 'Fotoğrafı Değiştir' : 'Fotoğraf Yükle'}
                  </Button>
                </Upload>
                
                {currentImageUrl && (
                  <Button 
                    type="link" 
                    danger 
                    size="small"
                    onClick={() => {
                      setCurrentImageUrl('');
                      form.setFieldValue('image', '');
                    }}
                    style={{ padding: '4px 0', height: 'auto' }}
                  >
                    Fotoğrafı Kaldır
                  </Button>
                )}
              </div>
            </div>
          </Form.Item>

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={closeModal}>İptal</Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              {editingGoal ? 'Güncelle' : 'Kaydet'}
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default Goals;