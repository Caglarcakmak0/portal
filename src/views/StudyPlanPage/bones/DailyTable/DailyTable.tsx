import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../../../../services/api';
import { 
  Table, 
  Card, 
  Button, 
  Progress, 
  Tag, 
  Space, 
  Typography, 
  Statistic,
  Row,
  Col,
  message,
  Badge,
  Tooltip,
  notification,
  Alert,
  Input,
  InputNumber,
  Slider,
  Divider
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  FireOutlined,
  SyncOutlined,
  WifiOutlined,
  BellOutlined,
  ExclamationCircleOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useIsStudent } from '../../../../contexts/AuthContext';
import SubjectEditModal from './SubjectEditModal';
import './DailyTable.scss';

const { Title, Text } = Typography;

interface Subject {
  subject: string;
  targetQuestions: number;
  targetTime?: number;
  topics: string[];
  description: string;
  
  priority: number;
  completedQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  blankAnswers: number;
  studyTime: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  sessionIds: string[];
}

interface DailyTableProps {
  plan: {
    _id: string;
    date: string;
    title: string;
    subjects: Subject[];
    stats: {
      totalTargetQuestions: number;
      totalCompletedQuestions: number;
      totalTargetTime: number;
      totalStudyTime: number;
      completionRate: number;
      netScore: number;
      successRate: number;
    };
    status: string;
  };
  onSubjectUpdate: (subjectIndex: number, updateData: any) => void;
  onPlanUpdate: (updateData: any) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

const DailyTable: React.FC<DailyTableProps> = ({
  plan,
  onSubjectUpdate,
  onPlanUpdate,
  onRefresh,
  loading = false
}) => {
  const isStudent = useIsStudent();
  const [selectedSubject, setSelectedSubject] = useState<{index: number, subject: Subject} | null>(null);
  const [previewSubjectIndex, setPreviewSubjectIndex] = useState<number | null>(null);
  const [editingSubject, setEditingSubject] = useState<{index: number, subject: Subject} | null>(null);
  
  // Student feedback states
  const [dailyFeedback, setDailyFeedback] = useState<string>('');
  const [motivationScore, setMotivationScore] = useState<number>(5);
  const [subjectInputs, setSubjectInputs] = useState<{[key: string]: {correct: number, wrong: number, blank: number}}>({});
  
  // Real-time sync states
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<number>(0);

  // Advanced notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showMotivationalAlert, setShowMotivationalAlert] = useState(false);

  // Smart notification system
  const showSmartNotification = (type: 'progress' | 'milestone' | 'warning' | 'celebration', data: any) => {
    const notificationConfig = {
      progress: {
        message: '📈 İlerleme Güncellemesi',
        description: `${data.subject} dersi için ${data.completionPercentage}% tamamlandı!`,
        icon: <TrophyOutlined style={{ color: '#1890ff' }} />
      },
      milestone: {
        message: '🎯 Hedef Tamamlandı!',
        description: `Tebrikler! ${data.subject} dersini başarıyla tamamladınız.`,
        icon: <StarOutlined style={{ color: '#52c41a' }} />
      },
      warning: {
        message: '⚠️ Dikkat Gerekli',
        description: data.message,
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />
      },
      celebration: {
        message: '🎉 Harika Performans!',
        description: `Net skoru ${data.netScore} olan mükemmel bir çalışma!`,
        icon: <FireOutlined style={{ color: '#f5222d' }} />
      }
    };

    const config = notificationConfig[type];
    notification.open({
      ...config,
      duration: type === 'milestone' || type === 'celebration' ? 6 : 4,
      placement: 'topRight',
      onClick: () => {
        notification.destroy();
      }
    });
  };

  // Check for milestones and achievements
  const checkAchievements = (subjectData: Subject, completionPercentage: number) => {
    // Milestone notifications
    if (completionPercentage === 100) {
      showSmartNotification('milestone', { subject: getSubjectDisplayName(subjectData.subject) });
    } else if (completionPercentage >= 75 && completionPercentage < 100) {
      showSmartNotification('progress', { 
        subject: getSubjectDisplayName(subjectData.subject), 
        completionPercentage 
      });
    }

    // Performance celebration
    const netScore = calculateNet(subjectData.correctAnswers, subjectData.wrongAnswers);
    if (netScore >= 40) {
      showSmartNotification('celebration', { netScore: netScore.toFixed(1) });
    }

    // Warning for low performance
    const successRate = getSuccessRate(subjectData.correctAnswers, subjectData.wrongAnswers, subjectData.blankAnswers);
    if (successRate < 50 && (subjectData.correctAnswers + subjectData.wrongAnswers + subjectData.blankAnswers) >= 20) {
      showSmartNotification('warning', { 
        message: `${getSubjectDisplayName(subjectData.subject)} dersinde başarı oranınız %${successRate}. Konuları tekrar etmeyi düşünün.`
      });
    }
  };

  // Daily motivation system
  useEffect(() => {
    const checkDailyMotivation = () => {
      const completionRate = plan.stats.completionRate;
      const hour = new Date().getHours();
      
      // Morning motivation (8-10 AM)
      if (hour >= 8 && hour <= 10 && completionRate < 25) {
        setShowMotivationalAlert(true);
      }
      
      // Evening motivation (18-20 PM) 
      if (hour >= 18 && hour <= 20 && completionRate < 75) {
        notification.info({
          message: '🌅 Akşam Motivasyonu',
          description: 'Günü güçlü bir şekilde tamamlamak için son spurt!',
          icon: <BellOutlined style={{ color: '#722ed1' }} />,
          duration: 5,
          placement: 'topRight'
        });
      }
    };

    const motivationTimer = setTimeout(checkDailyMotivation, 1000);
    return () => clearTimeout(motivationTimer);
  }, [plan.stats.completionRate]);

  // Real-time sync effects
  useEffect(() => {
    // Online/offline status monitoring
    const handleOnline = () => {
      setIsOnline(true);
      message.success('Bağlantı tekrar kuruldu!');
      if (pendingUpdates > 0) {
        handleManualRefresh();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      message.warning('İnternet bağlantısı kesildi. Değişiklikler kaydedilecek.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingUpdates]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefreshEnabled && isOnline) {
      refreshIntervalRef.current = setInterval(() => {
        if (onRefresh) {
          onRefresh();
          setLastSync(new Date());
        }
      }, 30000); // 30 saniyede bir yenile
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefreshEnabled, isOnline, onRefresh]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    if (onRefresh) {
      try {
        await onRefresh();
        setLastSync(new Date());
        setPendingUpdates(0);
        message.success('Veriler güncellendi!');
      } catch (error) {
        message.error('Güncelleme başarısız');
      }
    }
  };

  // Toggle auto refresh
  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
    message.info(
      autoRefreshEnabled 
        ? 'Otomatik güncelleme kapatıldı' 
        : 'Otomatik güncelleme açıldı'
    );
  };

  // Subject name mapping
  const getSubjectDisplayName = (subject: string): string => {
    const names: Record<string, string> = {
      matematik: '📐 Matematik',
      turkce: '📚 Türkçe', 
      kimya: '🧪 Kimya',
      fizik: '🔬 Fizik',
      biyoloji: '🌱 Biyoloji',
      tarih: '🏛️ Tarih',
      cografya: '🌍 Coğrafya',
      felsefe: '🤔 Felsefe',
      geometri: '📐 Geometri',
      edebiyat: '📖 Edebiyat',
      ingilizce: '🇬🇧 İngilizce',
      matematik_ayt: '📐 Matematik (AYT)',
      fizik_ayt: '🔬 Fizik (AYT)',
      kimya_ayt: '🧪 Kimya (AYT)',
      biyoloji_ayt: '🌱 Biyoloji (AYT)',
    };
    return names[subject] || subject.charAt(0).toUpperCase() + subject.slice(1);
  };

  // Status color mapping
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      not_started: 'default',
      in_progress: 'processing', 
      completed: 'success',
      skipped: 'error'
    };
    return colors[status] || 'default';
  };

  // Status text mapping
  const getStatusText = (status: string): string => {
    const texts: Record<string, string> = {
      not_started: 'Başlanmadı',
      in_progress: 'Devam Ediyor',
      completed: 'Tamamlandı',
      skipped: 'Atlandı'
    };
    return texts[status] || status;
  };

  // Net score calculation
  const calculateNet = (correct: number, wrong: number): number => {
    return Math.max(correct - (wrong / 4), 0);
  };

  // Completion percentage
  const getCompletionPercentage = (completed: number, target: number): number => {
    if (target === 0) return 0;
    return Math.round((completed / target) * 100);
  };

  // Success rate
  const getSuccessRate = (correct: number, wrong: number, blank: number): number => {
    const total = correct + wrong + blank;
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  };


  // Handle session completion with real-time sync
  const handleSessionComplete = async (sessionData: any) => {
    if (selectedSubject) {
      try {
        // Update subject with session data
        const updateData = {
          correctAnswers: selectedSubject.subject.correctAnswers + (sessionData.questionStats?.correctAnswers || 0),
          wrongAnswers: selectedSubject.subject.wrongAnswers + (sessionData.questionStats?.wrongAnswers || 0),
          blankAnswers: selectedSubject.subject.blankAnswers + (sessionData.questionStats?.blankAnswers || 0),
          studyTime: selectedSubject.subject.studyTime + (sessionData.duration || 0),
          status: 'in_progress' as 'in_progress' | 'completed'
        };

        // Check if completed
        const totalCompleted = updateData.correctAnswers + updateData.wrongAnswers + updateData.blankAnswers;
        if (totalCompleted >= selectedSubject.subject.targetQuestions) {
          updateData.status = 'completed';
        }

        // Update locally first for immediate feedback
        onSubjectUpdate(selectedSubject.index, updateData);
        setSelectedSubject(null);
        
        // Check achievements and show smart notifications
        const completionPercentage = getCompletionPercentage(totalCompleted, selectedSubject.subject.targetQuestions);
        const updatedSubject = { ...selectedSubject.subject, ...updateData };
        checkAchievements(updatedSubject, completionPercentage);
        
        // Real-time sync
        if (isOnline) {
          setLastSync(new Date());
          message.success('Çalışma oturumu tamamlandı ve senkronize edildi!');
        } else {
          setPendingUpdates(prev => prev + 1);
          message.warning('Çalışma oturumu kaydedildi. İnternet bağlantısı kurulduğunda senkronize edilecek.');
        }

        // Refresh data to ensure consistency
        if (onRefresh && isOnline) {
          setTimeout(() => onRefresh(), 1000);
        }
        
      } catch (error) {
        message.error('Oturum kaydedilirken hata oluştu');
        console.error('Session complete error:', error);
      }
    }
  };

  // Handle subject edit
  const handleSubjectEdit = (subjectIndex: number, updatedSubject: Subject) => {
    const subjectWithDefaults = {
      ...updatedSubject,
      sessionIds: updatedSubject.sessionIds || []
    };
    
    onSubjectUpdate(subjectIndex, subjectWithDefaults);
    setEditingSubject(null);
    message.success('Ders bilgileri güncellendi!');
    
    // Real-time sync
    if (isOnline) {
      setLastSync(new Date());
    } else {
      setPendingUpdates(prev => prev + 1);
    }
  };

  // Table columns
  const columns: ColumnsType<Subject & { index: number }> = [
    {
      title: 'Ders',
      dataIndex: 'subject',
      key: 'subject',
      width: 150,
      render: (subject: string, record) => (
        <div className="subject-cell">
          <div className="subject-name">
            {getSubjectDisplayName(subject)}
          </div>
          <Tag color={record.priority <= 3 ? 'red' : record.priority <= 6 ? 'orange' : 'green'}>
            Öncelik {record.priority}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Yapılan',
      key: 'completed',
      width: 80,
      align: 'center',
      render: (_, record) => {
        const completed = record.correctAnswers + record.wrongAnswers + record.blankAnswers;
        return (
          <Text 
            strong 
            style={{ 
              fontSize: '16px',
              color: '#1890ff'
            }}
          >
            {completed}
          </Text>
        );
      },
    },
    {
      title: 'D',
      dataIndex: 'correctAnswers',
      key: 'correct',
      width: 60,
      align: 'center',
      render: (correct: number, record) => {
        if (isStudent) {
          return (
            <InputNumber
              min={0}
              max={999}
              value={subjectInputs[record.subject]?.correct ?? correct}
              onChange={(value) => {
                const newInputs = { ...subjectInputs };
                if (!newInputs[record.subject]) newInputs[record.subject] = { correct: 0, wrong: 0, blank: 0 };
                newInputs[record.subject].correct = value || 0;
                setSubjectInputs(newInputs);
              }}
              size="small"
              style={{ width: '60px' }}
            />
          );
        }
        return <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>{correct}</Text>;
      },
    },
    {
      title: 'Y', 
      dataIndex: 'wrongAnswers',
      key: 'wrong',
      width: 60,
      align: 'center',
      render: (wrong: number, record) => {
        if (isStudent) {
          return (
            <InputNumber
              min={0}
              max={999}
              value={subjectInputs[record.subject]?.wrong ?? wrong}
              onChange={(value) => {
                const newInputs = { ...subjectInputs };
                if (!newInputs[record.subject]) newInputs[record.subject] = { correct: 0, wrong: 0, blank: 0 };
                newInputs[record.subject].wrong = value || 0;
                setSubjectInputs(newInputs);
              }}
              size="small"
              style={{ width: '60px' }}
            />
          );
        }
        return <Text style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{wrong}</Text>;
      },
    },
    {
      title: 'B',
      dataIndex: 'blankAnswers', 
      key: 'blank',
      width: 60,
      align: 'center',
      render: (blank: number, record) => {
        if (isStudent) {
          return (
            <InputNumber
              min={0}
              max={999}
              value={subjectInputs[record.subject]?.blank ?? blank}
              onChange={(value) => {
                const newInputs = { ...subjectInputs };
                if (!newInputs[record.subject]) newInputs[record.subject] = { correct: 0, wrong: 0, blank: 0 };
                newInputs[record.subject].blank = value || 0;
                setSubjectInputs(newInputs);
              }}
              size="small"
              style={{ width: '60px' }}
            />
          );
        }
        return <Text style={{ color: '#8c8c8c', fontWeight: 'bold' }}>{blank}</Text>;
      },
    },
    {
      title: 'Net',
      key: 'net',
      width: 80,
      align: 'center',
      render: (_, record) => {
        const net = calculateNet(record.correctAnswers, record.wrongAnswers);
        return (
          <Text strong style={{ color: '#faad14', fontSize: '16px' }}>
            {net.toFixed(1)}
          </Text>
        );
      },
    },
    {
      title: 'İlerleme',
      key: 'progress',
      width: 120,
      render: (_, record) => {
        const completed = record.correctAnswers + record.wrongAnswers + record.blankAnswers;
        const percentage = getCompletionPercentage(completed, record.targetQuestions);
        return (
          <Progress
            percent={percentage}
            size="small"
            status={percentage === 100 ? 'success' : 'active'}
            format={() => `${percentage}%`}
          />
        );
      },
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => setEditingSubject({ index: record.index, subject: record })}
          />
        </Space>
      ),
    },
  ];

  // Add index to subjects for table
  const dataSource = plan.subjects.map((subject, index) => ({
    ...subject,
    index,
    key: index
  }));

  return (
    <div className="daily-table">
      {/* Plan Summary with Real-time Status */}
      <Card className="plan-summary" size="small">
        {/* Real-time Sync Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Badge 
              status={isOnline ? 'success' : 'error'} 
              text={isOnline ? 'Çevrimiçi' : 'Çevrimdışı'} 
            />
            {pendingUpdates > 0 && (
              <Badge 
                count={pendingUpdates} 
                style={{ backgroundColor: '#faad14' }} 
                title="Bekleyen güncelleme"
              />
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tooltip title={`Son güncelleme: ${lastSync.toLocaleTimeString()}`}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <WifiOutlined /> {lastSync.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Tooltip>
            
            <Tooltip title="Verileri yenile">
              <Button
                type="text"
                size="small"
                icon={<SyncOutlined spin={loading} />}
                onClick={handleManualRefresh}
                loading={loading}
                disabled={!isOnline}
              />
            </Tooltip>
            
            <Tooltip title={autoRefreshEnabled ? 'Otomatik güncellemeyi durdur' : 'Otomatik güncellemeyi başlat'}>
              <Button
                type="text"
                size="small"
                icon={<WifiOutlined />}
                onClick={toggleAutoRefresh}
                style={{ color: autoRefreshEnabled ? '#52c41a' : '#8c8c8c' }}
              />
            </Tooltip>
          </div>
        </div>

        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Statistic
              title="Toplam Hedef"
              value={plan.stats.totalTargetQuestions}
              prefix={<TrophyOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Tamamlanan"
              value={plan.stats.totalCompletedQuestions}
              suffix={`/${plan.stats.totalTargetQuestions}`}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Toplam Net"
              value={plan.stats.netScore.toFixed(1)}
              prefix={<FireOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Süre"
              value={`${Math.round(plan.stats.totalStudyTime / 60)}s`}
              prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
            />
          </Col>
        </Row>
        
        <div className="overall-progress">
          <Text strong>Genel İlerleme</Text>
          <Progress
            percent={plan.stats.completionRate}
            status={plan.stats.completionRate === 100 ? 'success' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </div>
        
        {/* Motivational Alert */}
        {showMotivationalAlert && (
          <Alert
            message="🌅 Günaydın! Yeni Gün Yeni Umutlar"
            description="Bugünkü hedeflerinize ulaşmak için harika bir gün! Küçük adımlarla büyük başarılar elde edebilirsiniz."
            type="info"
            showIcon
            closable
            onClose={() => setShowMotivationalAlert(false)}
            style={{ 
              marginTop: '12px',
              background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(135, 208, 104, 0.1) 100%)',
              border: '1px solid rgba(24, 144, 255, 0.3)',
              borderRadius: '8px'
            }}
            action={
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  setShowMotivationalAlert(false);
                  notification.success({
                    message: '💪 Motivasyon Yüklendi!',
                    description: 'Başarıya giden yolda her adım değerli!',
                    duration: 3
                  });
                }}
              >
                Başlayalım!
              </Button>
            }
          />
        )}
      </Card>

      {/* Subjects Table */}
      <Card title="Günlük Ders Programı" className="subjects-table">
        {/* Üst bilgi: Seçili ders açıklaması */}
        {typeof previewSubjectIndex === 'number' && plan.subjects[previewSubjectIndex] && (
          <div style={{
            marginBottom: '12px',
            padding: '12px 16px',
            background: '#fff',
            border: '1px solid #f0f0f0',
            borderRadius: 8
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>
                {getSubjectDisplayName(plan.subjects[previewSubjectIndex].subject)} • Açıklama
              </Text>
              <Tag>
                Öncelik {plan.subjects[previewSubjectIndex].priority}
              </Tag>
            </div>
            <div style={{ marginTop: 6 }}>
              <Text>
                {plan.subjects[previewSubjectIndex].description || 'Sistemsel hata tespit edildi, koçunuzu bilgilendiriniz.'}
              </Text>
            </div>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={false}
          size="middle"
          className="subjects-table-content"
          scroll={{ x: 800 }}
          onRow={(record) => ({
            onClick: () => setPreviewSubjectIndex(record.index)
          })}
        />
      </Card>

      {/* Student Feedback Section - Only visible to students */}
      {isStudent && (
        <Card title="Günlük Değerlendirme" style={{ marginTop: '16px' }}>
          <Row gutter={16}>
            {/* Feedback Text Area */}
            <Col xs={24} md={16}>
              <div style={{ marginBottom: '16px' }}>
                <Title level={5} style={{ marginBottom: '8px' }}>
                  📝 Program nasıl geçti, verimli miydi?
                </Title>
                <Input.TextArea
                  value={dailyFeedback}
                  onChange={(e) => setDailyFeedback(e.target.value)}
                  placeholder="Bugünkü çalışma programınız hakkında düşüncelerinizi yazın..."
                  rows={4}
                  maxLength={500}
                  showCount
                  style={{ 
                    borderRadius: '8px',
                    border: '2px solid #f0f0f0'
                  }}
                />
              </div>
            </Col>

            {/* Motivation Score */}
            <Col xs={24} md={8}>
              <div style={{ marginBottom: '16px' }}>
                <Title level={5} style={{ marginBottom: '16px' }}>
                  🎯 Bugün 10 üzerinden kaç motive hissediyorsun?
                </Title>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                    {motivationScore}/10
                  </Text>
                </div>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={motivationScore}
                  onChange={setMotivationScore}
                  marks={{
                    1: '😔',
                    3: '😐',
                    5: '🙂',
                    7: '😊',
                    10: '🔥'
                  }}
                  tooltip={{ formatter: (value) => `${value}/10` }}
                  trackStyle={{ backgroundColor: '#1890ff' }}
                  handleStyle={{ borderColor: '#1890ff' }}
                />
              </div>
            </Col>
          </Row>

          {/* Submit Button */}
          <Divider />
          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={async () => {
                try {
                  // Gather all subject data from inputs
                  const feedbackData: any[] = [];
                  
                  // Process each subject
                  plan.subjects.forEach((subject, index) => {
                    const inputData = subjectInputs[subject.subject];
                    if (inputData && (inputData.correct > 0 || inputData.wrong > 0 || inputData.blank > 0)) {
                      feedbackData.push({
                        subjectIndex: index,
                        correctAnswers: inputData.correct,
                        wrongAnswers: inputData.wrong,
                        blankAnswers: inputData.blank,
                        feedbackText: dailyFeedback,
                        motivationScore: motivationScore
                      });
                    }
                  });
                  
                  if (feedbackData.length === 0) {
                    message.warning('En az bir ders için D-Y-B değerlerini girmelisiniz');
                    return;
                  }
                  
                  // Send feedback for each subject
                  for (const data of feedbackData) {
                    await apiRequest(`/daily-plans/${plan._id}/student-feedback`, {
                      method: 'POST',
                      body: JSON.stringify(data)
                    });
                  }
                  
                  message.success('Günlük değerlendirmeniz koçunuza gönderildi!');
                  
                  // Clear inputs after successful submit
                  setSubjectInputs({});
                  setDailyFeedback('');
                  setMotivationScore(5);
                  
                  // Refresh plan data
                  if (onRefresh) {
                    onRefresh();
                  }
                  
                } catch (error: any) {
                  console.error('Feedback submit error:', error);
                  message.error(error.message || 'Feedback gönderilirken hata oluştu');
                }
              }}
              style={{
                minWidth: '200px',
                height: '40px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)'
              }}
            >
              Raporu Koça Gönder
            </Button>
          </div>
        </Card>
      )}


      {/* Subject Edit Modal */}
      {editingSubject && (
        <SubjectEditModal
          visible={true}
          subject={editingSubject.subject}
          onSave={(updatedSubject) => {
            const normalized: Subject = {
              ...editingSubject.subject,
              ...updatedSubject,
              description: updatedSubject.description ?? editingSubject.subject.description ?? '',
              sessionIds: updatedSubject.sessionIds ?? editingSubject.subject.sessionIds ?? []
            };
            handleSubjectEdit(editingSubject.index, normalized);
          }}
          onCancel={() => setEditingSubject(null)}
        />
      )}
    </div>
  );
};

export default DailyTable;