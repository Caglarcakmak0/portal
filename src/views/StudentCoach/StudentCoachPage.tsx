import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Spin, Typography } from 'antd';
import { getMyCoach, getCoachFeedbackStatus } from '../../services/api';
import CoachProfile from './CoachProfile';
import SecretFeedbackForm from './SecretFeedbackForm';
import StudentPrograms from './StudentPrograms';

const { Title, Text } = Typography;

export const StudentCoachPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState<{ id: string; name: string; email: string; avatar?: string | null; bio?: string; assignedAt: string | Date } | null>(null);
  const [status, setStatus] = useState<{ dueThisMonth: boolean; coachId: string | null; lastSubmittedAt: string | null; countThisMonth: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [coachRes, statusRes] = await Promise.all([getMyCoach(), getCoachFeedbackStatus()]);
      setCoach(coachRes.coach);
      setStatus(statusRes);
    } catch (e) {
      // noop - apiRequest already throws; UI minimal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const banner = useMemo(() => {
    if (!coach || !status) return null;
    if (status.dueThisMonth) {
      return (
        <Alert
          type="warning"
          message="Aylık gizli koç değerlendirmesi bekleniyor"
          description={
            <span>
              Bu ay henüz değerlendirme göndermediniz. Lütfen koçunuzu gizli olarak değerlendirin.
              {status.lastSubmittedAt && (
                <>
                  <br />
                  <Text type="secondary">Son gönderim: {new Date(status.lastSubmittedAt).toLocaleDateString('tr-TR')} · Bu ay: {status.countThisMonth} kez</Text>
                </>
              )}
            </span>
          }
          showIcon
          action={<a onClick={() => setModalOpen(true)}>Değerlendirme Yap</a>}
          style={{ marginBottom: 16 }}
        />
      );
    }
    return (
      <Alert
        type="success"
        message="Teşekkürler!"
        description={
          <span>
            Bu ay gizli koç değerlendirmesini tamamladınız. İsterseniz tekrar değerlendirme gönderebilirsiniz.
            {status.lastSubmittedAt && (
              <>
                <br />
                <Text type="secondary">Son gönderim: {new Date(status.lastSubmittedAt).toLocaleDateString('tr-TR')} · Bu ay: {status.countThisMonth} kez</Text>
              </>
            )}
          </span>
        }
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }, [coach, status]);

  if (loading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (!coach) {
    return (
      <Card>
        <Title level={5}>Aktif koç bulunamadı</Title>
        <Text type="secondary">Admin tarafından bir koç atandığında burada görünecek.</Text>
      </Card>
    );
  }

  return (
    <div>
      {banner}
      <CoachProfile
        coachName={coach.name}
        coachEmail={coach.email}
        coachAvatar={coach.avatar || null}
        coachBio={coach.bio}
        assignedAt={coach.assignedAt}
        onOpenFeedback={() => setModalOpen(true)}
      />
      <div style={{ marginTop: 16 }}>
        <StudentPrograms />
      </div>
      <SecretFeedbackForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        coachId={coach.id}
        coachName={coach.name}
        onSubmitted={load}
      />
    </div>
  );
};

export default StudentCoachPage;


