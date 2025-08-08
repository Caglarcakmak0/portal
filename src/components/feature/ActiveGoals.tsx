import React, { useRef } from 'react';
import { Card, Button, Typography, Progress, Tag, Avatar } from 'antd';
import { LeftOutlined, RightOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const { Text, Title } = Typography;

interface Goal {
  id: string;
  universityName: string;
  department: string;
  priority: number;
  progress: number;
  streak: number;
  daysRemaining: number;
  image?: string; // Okul görseli URL'i
}

interface ActiveGoalsProps {
  goals: Goal[];
  loading?: boolean;
}

const ActiveGoals: React.FC<ActiveGoalsProps> = ({ goals, loading = false }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getPriorityColor = (priority: number) => {
    if (priority <= 3) return 'red';
    if (priority <= 6) return 'orange';
    return 'green';
  };

  const getPriorityText = (priority: number) => {
    if (priority <= 3) return 'Yüksek';
    if (priority <= 6) return 'Orta';
    return 'Düşük';
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const defaultImage = isDark 
    ? 'https://via.placeholder.com/80x60/404040/ffffff?text=🎓'
    : 'https://via.placeholder.com/80x60/f0f0f0/666666?text=🎓';

  return (
    <Card 
      title="🎯 Hedef Okullarım" 
      loading={loading}
      extra={
        <Button size="small" onClick={() => navigate('/goals')}>
          Tümünü Gör
        </Button>
      }
    >
      {goals && goals.length > 0 ? (
        <div style={{ position: 'relative' }}>
          {/* Scroll Buttons */}
          {goals.length > 1 && (
            <>
              <Button
                type="text"
                icon={<LeftOutlined />}
                onClick={() => scroll('left')}
                style={{
                  position: 'absolute',
                  left: -8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  background: isDark ? '#1f1f1f' : '#fff',
                  border: '1px solid #d9d9d9',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px'
                }}
              />
              <Button
                type="text"
                icon={<RightOutlined />}
                onClick={() => scroll('right')}
                style={{
                  position: 'absolute',
                  right: -8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  background: isDark ? '#1f1f1f' : '#fff',
                  border: '1px solid #d9d9d9',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px'
                }}
              />
            </>
          )}

          {/* Goals Slider */}
          <div
            ref={scrollContainerRef}
            style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              paddingBottom: '8px'
            }}
            className="goals-slider"
          >
            {goals.map((goal) => (
              <div
                key={goal.id}
                style={{
                  minWidth: '280px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: isDark ? '#262626' : '#fafafa',
                  border: `1px solid ${isDark ? '#434343' : '#e8e8e8'}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = isDark 
                    ? '0 4px 20px rgba(0,0,0,0.5)' 
                    : '0 4px 20px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => navigate('/goals')}
              >
                {/* University Image & Info */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <Avatar
                    size={60}
                    src={goal.image || defaultImage}
                    style={{ 
                      borderRadius: '8px',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Title 
                      level={5} 
                      style={{ 
                        margin: 0, 
                        fontSize: '14px',
                        lineHeight: 1.3,
                        color: isDark ? '#fff' : '#000'
                      }}
                      ellipsis={{ rows: 2 }}
                    >
                      {goal.universityName}
                    </Title>
                    <Text 
                      type="secondary" 
                      style={{ 
                        fontSize: '12px',
                        display: 'block',
                        marginTop: '4px'
                      }}
                      ellipsis
                    >
                      {goal.department}
                    </Text>
                  </div>
                </div>

                {/* Priority Tag */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <Tag 
                    color={getPriorityColor(goal.priority)}
                    style={{ fontSize: '11px' }}
                  >
                    #{goal.priority} - {getPriorityText(goal.priority)} Öncelik
                  </Tag>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <Text style={{ fontSize: '12px' }}>İlerleme</Text>
                    <Text style={{ fontSize: '12px', fontWeight: 500 }}>%{goal.progress}</Text>
                  </div>
                  <Progress 
                    percent={goal.progress} 
                    size="small" 
                    showInfo={false}
                    strokeColor={getPriorityColor(goal.priority)}
                  />
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Text style={{ fontSize: '16px', fontWeight: 600, color: '#ff4d4f' }}>
                      {goal.streak}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      🔥 Seri
                    </Text>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Text style={{ fontSize: '16px', fontWeight: 600, color: '#1890ff' }}>
                      {goal.daysRemaining}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      📅 Gün
                    </Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px 24px',
          background: isDark ? '#262626' : '#fafafa',
          borderRadius: '12px',
          border: `2px dashed ${isDark ? '#434343' : '#d9d9d9'}`
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <Title level={4} type="secondary" style={{ marginBottom: '8px' }}>
            Henüz hedef okul eklemedin
          </Title>
          <Text type="secondary" style={{ marginBottom: '20px', display: 'block' }}>
            YKS yolculuğunda hedeflerini belirlemek için üniversite ve bölüm ekle
          </Text>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/goals')}
            size="large"
          >
            İlk Hedefini Ekle
          </Button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .goals-slider::-webkit-scrollbar {
            display: none;
          }
        `
      }} />
    </Card>
  );
};

export default ActiveGoals;