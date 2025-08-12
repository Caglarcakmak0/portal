import React from 'react';
import { Card, Button, Space, Typography, Avatar } from 'antd';
import { toAbsoluteUrl } from '../../services/api';

type Props = {
  coachName?: string;
  coachEmail?: string;
  coachAvatar?: string | null;
  coachBio?: string;
  assignedAt?: string | Date | null;
  onOpenFeedback?: () => void;
};

const { Text, Title } = Typography;

export const CoachProfile: React.FC<Props> = ({ coachName, coachEmail, coachAvatar, coachBio, assignedAt, onOpenFeedback }) => {
  return (
    <Card>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>Koç Profil</Title>
        <Space align="center" size={12}>
          <Avatar size={56} src={toAbsoluteUrl(coachAvatar) || undefined}>
            {(coachName || 'K')[0]}
          </Avatar>
          <div>
            <Text strong style={{ display: 'block' }}>{coachName || 'Koç'}</Text>
            {coachEmail && <Text type="secondary">{coachEmail}</Text>}
          </div>
        </Space>
        {/* Email zaten üst blokta gösteriliyor; tekrar göstermiyoruz */}
        {coachBio && <Text>{coachBio}</Text>}
        {assignedAt && (
          <Text type="secondary">Atama Tarihi: {new Date(assignedAt).toLocaleDateString('tr-TR')}</Text>
        )}
        <div>
          <Button type="primary" onClick={onOpenFeedback}>Gizli Değerlendirme Gönder</Button>
        </div>
      </Space>
    </Card>
  );
};

export default CoachProfile;


