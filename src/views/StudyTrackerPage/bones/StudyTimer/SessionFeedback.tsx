import React, { useState } from 'react';
import { Modal, Input, Button, Space, Divider, Typography, message } from 'antd';
import { CheckOutlined, EditOutlined } from '@ant-design/icons';
import QualityRating from './QualityRating';
import MoodSelector from './MoodSelector';
import DistractionCounter from './DistractionCounter';

const { TextArea } = Input;
const { Title, Text } = Typography;

type MoodType = 'Enerjik' | 'Normal' | 'Yorgun' | 'Motivasyonsuz' | 'Stresli' | 'Mutlu';

interface SessionFeedbackData {
  quality: number;
  mood: MoodType;
  distractions: number;
  notes: string;
}

interface SessionFeedbackProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (feedbackData: SessionFeedbackData) => void;
  sessionData?: {
    subject: string;
    technique: string;
    duration: number;
    targetSessions?: number;
    completedSessions?: number;
  };
}

const SessionFeedback: React.FC<SessionFeedbackProps> = ({
  visible,
  onCancel,
  onSubmit,
  sessionData
}) => {
  const [feedback, setFeedback] = useState<SessionFeedbackData>({
    quality: 0,
    mood: 'Normal',
    distractions: 0,
    notes: ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (feedback.quality === 0) {
      message.error('Lütfen çalışma kalitesini değerlendirin!');
      return;
    }

    if (!feedback.mood) {
      message.error('Lütfen ruh halinizi seçin!');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(feedback);
      
      // Reset form
      setFeedback({
        quality: 0,
        mood: 'Normal',
        distractions: 0,
        notes: ''
      });
      
      message.success('Geri bildiriminiz kaydedildi! 🎉');
    } catch (error) {
      message.error('Geri bildirim kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setFeedback({
      quality: 0,
      mood: 'Normal',
      distractions: 0,
      notes: ''
    });
    onCancel();
  };

  const getSessionSummary = () => {
    if (!sessionData) return '';
    
    const { subject, technique, duration, targetSessions, completedSessions } = sessionData;
    let summary = `${technique} - ${subject} (${duration}dk)`;
    
    if (targetSessions && completedSessions !== undefined) {
      summary += ` • ${completedSessions}/${targetSessions} tamamlandı`;
    }
    
    return summary;
  };

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center' }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            🎯 Çalışma Oturumu Tamamlandı!
          </Title>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={
        <Space>
          <Button onClick={handleCancel} disabled={loading}>
            Atla
          </Button>
          <Button 
            type="primary" 
            icon={<CheckOutlined />}
            onClick={handleSubmit}
            loading={loading}
          >
            Geri Bildirimi Kaydet
          </Button>
        </Space>
      }
      width={520}
      centered
      maskClosable={false}
    >
      <div className="session-feedback">
        {/* Session Summary */}
        {sessionData && (
          <div className="session-feedback__summary">
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {getSessionSummary()}
            </Text>
            <Divider />
          </div>
        )}

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Quality Rating */}
          <div className="session-feedback__section">
            <QualityRating
              value={feedback.quality}
              onChange={(quality) => setFeedback(prev => ({ ...prev, quality }))}
              size="large"
            />
          </div>

          {/* Mood Selection */}
          <div className="session-feedback__section">
            <MoodSelector
              value={feedback.mood}
              onChange={(mood) => setFeedback(prev => ({ ...prev, mood }))}
              size="default"
            />
          </div>

          {/* Distraction Counter */}
          <div className="session-feedback__section">
            <DistractionCounter
              value={feedback.distractions}
              onChange={(distractions) => setFeedback(prev => ({ ...prev, distractions }))}
              size="default"
            />
          </div>

          {/* Notes */}
          <div className="session-feedback__section">
            <div className="session-feedback__label">
              <EditOutlined style={{ marginRight: 8 }} />
              Notlar (İsteğe Bağlı)
            </div>
            <TextArea
              placeholder="Bu çalışma oturumu hakkında notlarınızı yazabilirsiniz..."
              value={feedback.notes}
              onChange={(e) => setFeedback(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              maxLength={500}
              showCount
            />
          </div>
        </Space>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Bu veriler çalışma alışkanlıklarınızı analiz etmek için kullanılır
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default SessionFeedback;