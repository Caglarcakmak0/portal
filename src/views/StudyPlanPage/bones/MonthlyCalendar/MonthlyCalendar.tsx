import React from 'react';
import { Card, Calendar, Badge, Typography } from 'antd';
import type { CalendarProps } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface MonthlyCalendarProps {
  selectedDate: Dayjs;
  onDateSelect: (date: Dayjs) => void;
  currentPlan?: any;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  selectedDate,
  onDateSelect,
  currentPlan
}) => {
  
  const dateCellRender = (value: Dayjs) => {
    // Mock data for now - will be replaced with real API data
    const dateString = value.format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');
    
    // Simulate some historical data
    const mockData: Record<string, { completionRate: number; netScore: number }> = {};
    
    // Generate realistic mock data for the past week
    for (let i = 7; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      mockData[date] = {
        completionRate: Math.floor(Math.random() * 40) + 60, // 60-100%
        netScore: Math.floor(Math.random() * 30) + 20 // 20-50
      };
    }
    
    const dayData = mockData[dateString];
    if (!dayData && dateString !== today) return null;
    
    // Current day logic
    if (dateString === today && currentPlan) {
      const completionRate = currentPlan.stats?.completionRate || 0;
      const netScore = currentPlan.stats?.netScore || 0;
      
      const status = completionRate >= 90 ? 'success' : 
                    completionRate >= 70 ? 'processing' : 
                    completionRate >= 50 ? 'warning' : 'error';
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '9px' }}>
          <Badge 
            status={status} 
            text={`${Math.round(completionRate)}%`}
            style={{ fontSize: '9px', marginBottom: '2px' }}
          />
          <span style={{ color: '#666', fontSize: '8px' }}>
            Net: {netScore.toFixed(1)}
          </span>
        </div>
      );
    }
    
    // Historical data
    if (dayData) {
      const status = dayData.completionRate >= 90 ? 'success' : 
                    dayData.completionRate >= 70 ? 'processing' : 
                    dayData.completionRate >= 50 ? 'warning' : 'error';
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '9px' }}>
          <Badge 
            status={status} 
            text={`${dayData.completionRate}%`}
            style={{ fontSize: '9px', marginBottom: '2px' }}
          />
          <span style={{ color: '#666', fontSize: '8px' }}>
            Net: {dayData.netScore}
          </span>
        </div>
      );
    }
    
    return null;
  };

  const onPanelChange: CalendarProps<Dayjs>['onPanelChange'] = (value, mode) => {
    console.log('Calendar panel changed:', value.format('YYYY-MM'), mode);
  };

  const onSelect: CalendarProps<Dayjs>['onSelect'] = (value) => {
    onDateSelect(value);
  };

  return (
    <Card title="Aylık Çalışma Takvimi">
      <Calendar
        value={selectedDate}
        onSelect={onSelect}
        onPanelChange={onPanelChange}
        dateCellRender={dateCellRender}
        headerRender={({ value, type, onChange, onTypeChange }) => (
          <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>
              {value.format('MMMM YYYY')}
            </Title>
          </div>
        )}
      />
      
      {/* Legend */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Badge status="success" />
          <Text type="secondary">Mükemmel (90%+)</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Badge status="processing" />
          <Text type="secondary">İyi (70-89%)</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Badge status="warning" />
          <Text type="secondary">Orta (50-69%)</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Badge status="error" />
          <Text type="secondary">Zayıf (50%+)</Text>
        </div>
      </div>
    </Card>
  );
};

export default MonthlyCalendar;