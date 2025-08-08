import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Select, 
  InputNumber, 
  Row, 
  Col, 
  Space,
  Typography,
  Radio,
  Divider,
  Button,
  Card,
  Tag
} from 'antd';
import { 
  ClockCircleOutlined,
  BookOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export interface StudySessionConfig {
  technique: 'Pomodoro' | 'Stopwatch' | 'Timeblock' | 'Freeform';
  subject: string;
  studyDuration: number; // dakika
  breakDuration: number; // dakika (Pomodoro için)
  targetSessions: number; // cycle sayısı
  longBreakInterval?: number; // kaç pomodoro sonra uzun mola
  longBreakDuration?: number; // uzun mola süresi
}

interface SessionSetupProps {
  /** Modal görünür mü */
  visible: boolean;
  /** Modal kapanma callback */
  onCancel: () => void;
  /** Ayarlar onaylandığında callback */
  onConfirm: (config: StudySessionConfig) => void;
  /** İlk değerler */
  initialConfig?: Partial<StudySessionConfig>;
}

// Ders seçenekleri (StudySession model'den)
const SUBJECTS = [
  { value: 'matematik', label: '🔢 Matematik', category: 'TYT' },
  { value: 'geometri', label: '📐 Geometri', category: 'TYT' },
  { value: 'turkce', label: '📝 Türkçe', category: 'TYT' },
  { value: 'tarih', label: '🏛️ Tarih', category: 'TYT' },
  { value: 'cografya', label: '🌍 Coğrafya', category: 'TYT' },
  { value: 'felsefe', label: '💭 Felsefe', category: 'TYT' },
  { value: 'fizik', label: '⚡ Fizik', category: 'TYT' },
  { value: 'kimya', label: '🧪 Kimya', category: 'TYT' },
  { value: 'biyoloji', label: '🧬 Biyoloji', category: 'TYT' },
  { value: 'matematik_ayt', label: '🔢 Matematik AYT', category: 'AYT' },
  { value: 'fizik_ayt', label: '⚡ Fizik AYT', category: 'AYT' },
  { value: 'kimya_ayt', label: '🧪 Kimya AYT', category: 'AYT' },
  { value: 'biyoloji_ayt', label: '🧬 Biyoloji AYT', category: 'AYT' },
  { value: 'edebiyat', label: '📚 Edebiyat', category: 'AYT' },
  { value: 'tarih_ayt', label: '🏛️ Tarih AYT', category: 'AYT' },
  { value: 'cografya_ayt', label: '🌍 Coğrafya AYT', category: 'AYT' },
  { value: 'ingilizce', label: '🇺🇸 İngilizce', category: 'YDT' },
  { value: 'almanca', label: '🇩🇪 Almanca', category: 'YDT' },
  { value: 'fransizca', label: '🇫🇷 Fransızca', category: 'YDT' },
  { value: 'genel_tekrar', label: '🔄 Genel Tekrar', category: 'Diğer' },
  { value: 'deneme_sinavi', label: '📋 Deneme Sınavı', category: 'Diğer' },
  { value: 'diger', label: '📖 Diğer', category: 'Diğer' }
];


// Technique açıklamaları
const TECHNIQUE_INFO = {
  'Pomodoro': {
    icon: '🍅',
    description: '25 dakika çalışma + 5 dakika mola döngüsü',
    benefits: ['Odaklanmayı artırır', 'Yorgunluğu azaltır', 'İlerleyi ölçer'],
    default: { study: 25, break: 5, sessions: 4 }
  },
  'Timeblock': {
    icon: '📅',
    description: 'Belirli süre için kesintisiz çalışma',
    benefits: ['Derin odaklanma', 'Akış halini korur', 'Büyük görevler için ideal'],
    default: { study: 45, break: 15, sessions: 3 }
  },
  'Stopwatch': {
    icon: '⏱️',
    description: 'Süre takibi yaparak serbest çalışma',
    benefits: ['Esneklik', 'Doğal ritim', 'Baskı hissi yok'],
    default: { study: 60, break: 10, sessions: 2 }
  },
  'Freeform': {
    icon: '🎭',
    description: 'Tamamen serbest, sadece kayıt tutma',
    benefits: ['Tam özgürlük', 'Kendi tempon', 'Stressiz'],
    default: { study: 30, break: 5, sessions: 1 }
  }
};

// Hızlı süre seçenekleri
const QUICK_TIMES = [15, 20, 25, 30, 45, 60, 90];

const SessionSetup: React.FC<SessionSetupProps> = ({
  visible,
  onCancel,
  onConfirm,
  initialConfig
}) => {
  const [form] = Form.useForm();
  const [selectedTechnique, setSelectedTechnique] = useState<string>('Pomodoro');
  
  // Form values'ları watch et
  const studyDuration = Form.useWatch('studyDuration', form);

  // Form başlangıç değerleri
  useEffect(() => {
    if (visible) {
      const defaultConfig = {
        technique: null,
        subject: null,
        studyDuration: null,
        breakDuration: null,
        targetSessions: null,
        longBreakInterval: null,
        longBreakDuration: null,
        ...initialConfig
      };
      
      form.setFieldsValue(defaultConfig);
      setSelectedTechnique(defaultConfig.technique as string);
    }
  }, [visible, initialConfig, form]);

  // Technique değiştiğinde varsayılan değerleri güncelle
  const handleTechniqueChange = (technique: string) => {
    setSelectedTechnique(technique);
    const defaults = TECHNIQUE_INFO[technique as keyof typeof TECHNIQUE_INFO].default;
    
    form.setFieldsValue({
      studyDuration: defaults.study,
      breakDuration: defaults.break,
      targetSessions: defaults.sessions
    });
  };

  // Hızlı süre seçimi
  const handleQuickTime = (duration: number) => {
    form.setFieldValue('studyDuration', duration);
  };

  // Modal kapatılırken form'u resetle
  const handleCancel = () => {
    form.resetFields();
    setSelectedTechnique('Pomodoro');
    onCancel();
  };

  // Form onaylandığında
  const handleConfirm = async () => {
    try {
      const values = await form.validateFields();
      console.log('Form values before submit:', values); // Debug log
      
      // studyDuration kontrolü
      if (!values.studyDuration) {
        console.error('studyDuration is missing!', values);
        return;
      }
      
      onConfirm(values as StudySessionConfig);
    } catch (error: any) {
      console.error('Form validation failed:', error);
      console.error('Error fields:', error.errorFields);
      
      // İlk hatayı göster
      if (error.errorFields && error.errorFields.length > 0) {
        const firstError = error.errorFields[0];
        console.error('First error field:', firstError.name, firstError.errors);
      }
    }
  };

  // Subject'leri kategoriye göre gruplama
  const groupedSubjects = SUBJECTS.reduce((acc, subject) => {
    if (!acc[subject.category]) {
      acc[subject.category] = [];
    }
    acc[subject.category].push(subject);
    return acc;
  }, {} as Record<string, typeof SUBJECTS>);

  const currentTechniqueInfo = TECHNIQUE_INFO[selectedTechnique as keyof typeof TECHNIQUE_INFO];

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>Çalışma Oturumu Ayarları</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          İptal
        </Button>,
        <Button 
          key="confirm" 
          type="primary" 
          icon={<PlayCircleOutlined />}
          onClick={handleConfirm}
          size="large"
        >
          Oturumu Başlat
        </Button>
      ]}
      className="session-setup-modal"
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        preserve={false}
      >
        {/* Technique Selection */}
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>
            <BookOutlined /> Çalışma Tekniği
          </Title>
          
          <Form.Item name="technique" rules={[{ required: true }]}>
            <Radio.Group 
              onChange={(e) => handleTechniqueChange(e.target.value)}
              style={{ width: '100%' }}
            >
              <Row gutter={[12, 12]}>
                {Object.entries(TECHNIQUE_INFO).map(([key, info]) => (
                  <Col xs={12} sm={6} key={key}>
                    <Radio.Button 
                      value={key} 
                      style={{ 
                        width: '100%', 
                        textAlign: 'center',
                        height: 'auto',
                        padding: '12px 8px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '20px', marginBottom: 4 }}>
                          {info.icon}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 500 }}>
                          {key}
                        </div>
                      </div>
                    </Radio.Button>
                  </Col>
                ))}
              </Row>
            </Radio.Group>
          </Form.Item>

          {/* Technique Info Card */}
          <Card size="small" style={{ backgroundColor: '#f8f9fa' }}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Text strong>{currentTechniqueInfo.icon} {selectedTechnique}</Text>
                <Paragraph style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
                  {currentTechniqueInfo.description}
                </Paragraph>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <InfoCircleOutlined /> Avantajları:
                </Text>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: 16, fontSize: '12px' }}>
                  {currentTechniqueInfo.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </Col>
            </Row>
          </Card>
        </div>

        <Divider />

        {/* Subject Selection */}
        <Form.Item label="📚 Ders Seçimi" name="subject" rules={[{ required: true }]}>
          <Select 
            placeholder="Çalışacağın dersi seç"
            size="large"
            showSearch
            optionFilterProp="label"
          >
            {Object.entries(groupedSubjects).map(([category, subjects]) => (
              <Select.OptGroup key={category} label={category}>
                {subjects.map(subject => (
                  <Option key={subject.value} value={subject.value} label={subject.label}>
                    {subject.label}
                  </Option>
                ))}
              </Select.OptGroup>
            ))}
          </Select>
        </Form.Item>

        <Divider />

        {/* Quick Time Selection */}
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>⚡ Hızlı Seçim:</Text>
          <Space wrap>
            {QUICK_TIMES.map(time => (
              <Tag.CheckableTag
                key={time}
                checked={studyDuration === time}
                onChange={() => handleQuickTime(time)}
                style={{ 
                  padding: '4px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px'
                }}
              >
                {time} dakika
              </Tag.CheckableTag>
            ))}
          </Space>
        </div>

        {/* Time Configuration */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label={
              <Space>
                <ClockCircleOutlined />
                <span>Çalışma Süresi (dakika)</span>
              </Space>
            } name="studyDuration" rules={[{ required: true, min: 5, max: 180, type: 'number' }]}>
              <InputNumber
                min={5}
                max={180}
                placeholder="Dakika seçin veya yukarıdan seç"
                style={{ width: '100%' }}
                size="large"
              />
            </Form.Item>
          </Col>

          {selectedTechnique === 'Pomodoro' && (
            <Col xs={24} sm={12}>
              <Form.Item label="☕ Mola Süresi (dakika)" name="breakDuration">
                <InputNumber
                  min={1}
                  max={30}
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
            </Col>
          )}
        </Row>

        {selectedTechnique !== 'Freeform' && (
          <Form.Item label="🎯 Hedef Oturum Sayısı" name="targetSessions">
            <InputNumber
              min={1}
              max={10}
              style={{ width: '100%' }}
              size="large"
            />
          </Form.Item>
        )}

        {selectedTechnique === 'Pomodoro' && (
          <Row gutter={16}>
            <Col xs={12}>
              <Form.Item label="🔄 Uzun Mola Aralığı" name="longBreakInterval">
                <InputNumber
                  min={2}
                  max={8}
                  style={{ width: '100%' }}
                  placeholder="Kaç pomodoro sonra"
                />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="⏰ Uzun Mola Süresi" name="longBreakDuration">
                <InputNumber
                  min={10}
                  max={60}
                  style={{ width: '100%' }}
                  placeholder="Dakika"
                />
              </Form.Item>
            </Col>
          </Row>
        )}
      </Form>
    </Modal>
  );
};

export default SessionSetup;