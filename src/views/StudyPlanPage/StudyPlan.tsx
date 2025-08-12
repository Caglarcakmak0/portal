import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Space, 
  Row, 
  Col, 
  Button,
  DatePicker,
  Tabs,
  message
} from 'antd';
import { 
  CalendarOutlined,
  TableOutlined,
  BarChartOutlined,
  PlusOutlined,
  BulbOutlined,
  TrophyOutlined,
  GiftOutlined
} from '@ant-design/icons';
import { useAuth, useIsStudent, useIsCoach } from '../../contexts/AuthContext';
import { apiRequest } from '../../services/api';
import DailyTable from './bones/DailyTable/DailyTable';
import MonthlyCalendar from './bones/MonthlyCalendar/MonthlyCalendar';
import PlanSummary from './bones/PlanSummary/PlanSummary';
import CreatePlanModal from './bones/CreatePlan/CreatePlanModal';
import AdvancedAnalytics from './bones/AdvancedAnalytics/AdvancedAnalytics';
import StudyRecommendations from './bones/StudyRecommendations/StudyRecommendations';
import Leaderboard from './bones/Leaderboard/Leaderboard';
import Achievements from './bones/Achievements/Achievements';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface DailyPlan {
  _id: string;
  date: string;
  title: string;
  subjects: Array<{
    subject: string;
    targetQuestions: number;
    targetTime?: number;
    topics: string[];
    priority: number;
    completedQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    blankAnswers: number;
    studyTime: number;
    status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
    sessionIds: string[];
  }>;
  mockExam?: {
    isScheduled: boolean;
    examType: string;
    scheduledTime: string;
    duration: number;
    subjects: string[];
    isCompleted: boolean;
  };
  stats: {
    totalTargetQuestions: number;
    totalCompletedQuestions: number;
    totalTargetTime: number;
    totalStudyTime: number;
    completionRate: number;
    netScore: number;
    successRate: number;
  };
  status: 'draft' | 'active' | 'completed' | 'failed' | 'archived';
  motivationNote?: string;
  dailyGoal?: string;
}

const StudyPlan: React.FC = () => {
  const { user } = useAuth();
  const isStudent = useIsStudent();
  const isCoach = useIsCoach();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [currentPlan, setCurrentPlan] = useState<DailyPlan | null>(null);
  const [activeTab, setActiveTab] = useState<string>('daily');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Günlük plan getir
  const fetchDailyPlan = async (date: Dayjs) => {
    try {
      setLoading(true);
      const dateString = date.format('YYYY-MM-DD');
      
      const response = await apiRequest(`/daily-plans/by-date/${dateString}`);
      
      if (response.data) {
        setCurrentPlan(response.data);
      } else {
        setCurrentPlan(null);
      }
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('Bu tarih için plan bulunamadı')) {
        setCurrentPlan(null); // Plan yok - bu normal bir durum
      } else {
        console.error('Plan fetch error:', error);
        message.error('Plan yüklenirken hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  // Plan oluştur
  const handleCreatePlan = async (planData: any) => {
    try {
      setLoading(true);
      
      const response = await apiRequest('/daily-plans', {
        method: 'POST',
        body: JSON.stringify({
          ...planData,
          date: selectedDate.toISOString()
        })
      });
      
      if (response.data) {
        message.success('Günlük plan başarıyla oluşturuldu!');
        setCurrentPlan(response.data);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Plan create error:', error);
      message.error('Plan oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Plan güncelle
  const handleUpdatePlan = async (planId: string, updateData: any) => {
    try {
      const response = await apiRequest(`/daily-plans/${planId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      if (response.data) {
        setCurrentPlan(response.data);
        message.success('Plan başarıyla güncellendi!');
      }
    } catch (error) {
      console.error('Plan update error:', error);
      message.error('Plan güncellenirken hata oluştu');
    }
  };

  // Subject progress güncelle
  const handleSubjectUpdate = async (subjectIndex: number, updateData: any) => {
    if (!currentPlan) return;
    
    try {
      const response = await apiRequest(
        `/daily-plans/${currentPlan._id}/subjects/${subjectIndex}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData)
        }
      );
      
      if (response.data) {
        setCurrentPlan(response.data);
      }
    } catch (error) {
      console.error('Subject update error:', error);
      message.error('Ders ilerlemesi güncellenirken hata oluştu');
    }
  };

  // Tarih değiştiğinde plan getir
  useEffect(() => {
    fetchDailyPlan(selectedDate);
  }, [selectedDate]);

  // Plan var mı kontrolü
  const hasPlan = currentPlan !== null;

  return (
    <div className="study-plan-page">
      {/* Header */}
      <div className="page-header">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>
              <CalendarOutlined /> Çalışma Programı
            </Title>
            <Text type="secondary">
              Günlük hedeflerinizi belirleyin ve ilerlemelerinizi takip edin
            </Text>
          </Col>
          <Col>
            <Space>
              <DatePicker
                value={selectedDate}
                onChange={(date) => date && setSelectedDate(date)}
                format="DD MMMM YYYY"
                placeholder="Tarih seçin"
              />
              {!hasPlan && isCoach && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowCreateModal(true)}
                  loading={loading}
                >
                  Plan Oluştur
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      {/* Content */}
      <div className="page-content">
        {hasPlan ? (
          // Plan var - Tabs ile farklı görünümler
          <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
            <TabPane 
              tab={
                <span>
                  <TableOutlined />
                  Günlük Tablo
                </span>
              } 
              key="daily"
            >
              <DailyTable
                plan={currentPlan}
                onSubjectUpdate={handleSubjectUpdate}
                onPlanUpdate={(updateData) => handleUpdatePlan(currentPlan._id, updateData)}
                onRefresh={() => fetchDailyPlan(selectedDate)}
                loading={loading}
              />
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <BarChartOutlined />
                  İstatistikler
                </span>
              } 
              key="stats"
            >
              <PlanSummary
                plan={currentPlan}
                onRefresh={() => fetchDailyPlan(selectedDate)}
              />
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <CalendarOutlined />
                  Aylık Görünüm
                </span>
              } 
              key="monthly"
            >
              <MonthlyCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                currentPlan={currentPlan}
              />
            </TabPane>
            
            <TabPane 
              tab={
                <span style={{ opacity: 0.5 }}>
                  <BarChartOutlined />
                  İleri Analitik
                  <span style={{ fontSize: '10px', marginLeft: '8px', color: '#999' }}>(Yakında)</span>
                </span>
              } 
              key="analytics"
              disabled
            >
              <AdvancedAnalytics
                plan={currentPlan}
                selectedDate={selectedDate}
                onRefresh={() => fetchDailyPlan(selectedDate)}
              />
            </TabPane>
            
            <TabPane 
              tab={
                <span style={{ opacity: 0.5 }}>
                  <BulbOutlined />
                  AI Öneriler
                  <span style={{ fontSize: '10px', marginLeft: '8px', color: '#999' }}>(Yakında)</span>
                </span>
              } 
              key="recommendations"
              disabled
            >
              <StudyRecommendations
                plan={currentPlan}
                selectedDate={selectedDate}
                onStartRecommendation={(rec) => {
                  message.info(`${rec.title} başlatıldı! Timer sayfasına yönlendiriliyorsunuz.`);
                  // Navigate to timer or start session logic would go here
                }}
              />
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <TrophyOutlined />
                  Liderlik Tablosu
                </span>
              } 
              key="leaderboard"
            >
              <Leaderboard />
            </TabPane>
            
            <TabPane 
              tab={
                <span style={{ opacity: 0.5 }}>
                  <GiftOutlined />
                  Rozetlerim
                  <span style={{ fontSize: '10px', marginLeft: '8px', color: '#999' }}>(Yakında)</span>
                </span>
              } 
              key="achievements"
              disabled
            >
              <Achievements />
            </TabPane>
          </Tabs>
        ) : (
          // Plan yok - Boş durum
          <Card>
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: 'linear-gradient(135deg, #f6f9fc 0%, #e9ecef 100%)',
              borderRadius: '12px'
            }}>
              <CalendarOutlined style={{ 
                fontSize: '72px', 
                color: '#1890ff', 
                marginBottom: '24px' 
              }} />
              <Title level={3}>
                {selectedDate.format('DD MMMM YYYY')} için plan yok
              </Title>
              <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '32px' }}>
                {isStudent 
                  ? 'Bu tarih için koçunuz tarafından bir program oluşturulmamış'
                  : 'Bu tarih için çalışma programı oluşturarak hedeflerinizi belirleyin'
                }
              </Text>
              
              <Space size="large">
                {isCoach && (
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={() => setShowCreateModal(true)}
                    loading={loading}
                  >
                    Yeni Plan Oluştur
                  </Button>
                )}
                
                <Button
                  size="large"
                  onClick={() => setSelectedDate(dayjs())}
                  disabled={selectedDate.isSame(dayjs(), 'day')}
                >
                  Bugüne Dön
                </Button>
              </Space>
              
              {/* Quick suggestions */}
              <div style={{ marginTop: '32px', textAlign: 'left', maxWidth: '400px', margin: '32px auto 0' }}>
                <Text strong>💡 Plan önerileri:</Text>
                <ul style={{ marginTop: '8px', color: '#8c8c8c' }}>
                  <li>Hedef soru sayılarını belirleyin</li>
                  <li>Çalışma sürelerini planlayın</li>
                  <li>Konuları öncelik sırasına koyun</li>
                  <li>Deneme sınavı ekleyin</li>
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Create Plan Modal */}
      <CreatePlanModal
        visible={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        onSubmit={handleCreatePlan}
        selectedDate={selectedDate}
        loading={loading}
      />
    </div>
  );
};

export default StudyPlan;