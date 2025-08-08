import React from 'react';
import { Progress, Typography, Switch, Space } from 'antd';
import { ClockCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import './TimerDisplay.scss';

const { Text, Title } = Typography;

interface TimerDisplayProps {
  /** Kalan süre (saniye) */
  currentTime: number;
  /** Toplam süre (saniye) */
  totalTime: number;
  /** Timer çalışıyor mu */
  isRunning: boolean;
  /** Çalışma modu: study/break */
  mode: 'study' | 'break' | 'paused';
  /** UI modu: circular/digital */
  uiMode: 'circular' | 'digital';
  /** UI modu değiştirme */
  onUiModeChange: (mode: 'circular' | 'digital') => void;
  /** Component boyutu */
  size?: 'large' | 'small';
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  currentTime,
  totalTime,
  isRunning,
  mode,
  uiMode,
  onUiModeChange,
  size = 'large'
}) => {
  // Süre formatları
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress hesaplama (ters - kalan süre azaldıkça progress artar)
  const progressPercent = totalTime > 0 ? ((totalTime - currentTime) / totalTime) * 100 : 0;

  // Renk ve gradient ayarları
  const getColors = () => {
    switch (mode) {
      case 'study':
        return {
          primary: '#1890ff', // Mavi
          gradient: { '0%': '#40a9ff', '100%': '#1890ff' },
          text: '#1890ff'
        };
      case 'break':
        return {
          primary: '#52c41a', // Yeşil
          gradient: { '0%': '#73d13d', '100%': '#52c41a' },
          text: '#52c41a'
        };
      case 'paused':
        return {
          primary: '#faad14', // Sarı
          gradient: { '0%': '#ffd666', '100%': '#faad14' },
          text: '#faad14'
        };
    }
  };

  const colors = getColors();
  const circularSize = size === 'large' ? 200 : 100;
  const strokeWidth = size === 'large' ? 8 : 6;

  // Mod etiketleri
  const getModeLabel = () => {
    switch (mode) {
      case 'study': return '📚 Çalışma';
      case 'break': return '☕ Mola';
      case 'paused': return '⏸️ Duraklat';
    }
  };

  return (
    <div className={`timer-display timer-display--${size}`}>
      {/* UI Mode Switch */}
      <div className="timer-display__header">
        <Space align="center">
          <Text type="secondary">Görünüm:</Text>
          <Switch
            checkedChildren={<ClockCircleOutlined />}
            unCheckedChildren="99"
            checked={uiMode === 'circular'}
            onChange={(checked) => onUiModeChange(checked ? 'circular' : 'digital')}
            size={size === 'large' ? 'default' : 'small'}
          />
        </Space>
      </div>

      {/* Timer Display */}
      <div className="timer-display__content">
        {uiMode === 'circular' ? (
          <div className="timer-display__circular">
            <Progress
              type="circle"
              percent={progressPercent}
              size={circularSize}
              strokeWidth={strokeWidth}
              strokeColor={colors.gradient}
              trailColor="rgba(0, 0, 0, 0.06)"
              strokeLinecap="round"
              format={() => (
                <div className="timer-display__circular-content">
                  <Title
                    level={size === 'large' ? 2 : 4}
                    style={{ color: colors.text, margin: 0, fontFamily: 'monospace' }}
                  >
                    {formatTime(currentTime)}
                  </Title>
                  {size === 'large' && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {getModeLabel()}
                    </Text>
                  )}
                </div>
              )}
            />
            
            {/* Running indicator */}
            {isRunning && (
              <div className="timer-display__pulse">
                <PlayCircleOutlined 
                  style={{ 
                    color: colors.primary, 
                    fontSize: size === 'large' ? '24px' : '16px' 
                  }} 
                />
              </div>
            )}
          </div>
        ) : (
          <div className="timer-display__digital">
            <div className="timer-display__digital-time">
              <Title
                level={size === 'large' ? 1 : 3}
                style={{
                  color: colors.text,
                  margin: 0,
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${colors.gradient['0%']}, ${colors.gradient['100%']})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {formatTime(currentTime)}
              </Title>
            </div>
            
            <div className="timer-display__digital-progress">
              <Progress
                percent={progressPercent}
                strokeColor={colors.gradient}
                trailColor="rgba(0, 0, 0, 0.06)"
                strokeWidth={size === 'large' ? 6 : 4}
                showInfo={false}
              />
            </div>
            
            <Text 
              type="secondary" 
              style={{ 
                display: 'block', 
                textAlign: 'center', 
                marginTop: size === 'large' ? 8 : 4 
              }}
            >
              {getModeLabel()}
            </Text>
          </div>
        )}
      </div>

      {/* Progress Info */}
      {size === 'large' && (
        <div className="timer-display__info">
          <Space split={"•"} style={{ width: '100%', justifyContent: 'center' }}>
            <Text type="secondary">Toplam: {formatTime(totalTime)}</Text>
            <Text type="secondary">Kalan: {formatTime(currentTime)}</Text>
            <Text type="secondary">%{Math.round(progressPercent)} tamamlandı</Text>
          </Space>
        </div>
      )}
    </div>
  );
};

export default TimerDisplay;