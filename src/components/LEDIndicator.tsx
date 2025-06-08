
import React from 'react';

interface LEDIndicatorProps {
  isOn: boolean;
  color?: 'green' | 'red' | 'blue' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
}

const LEDIndicator: React.FC<LEDIndicatorProps> = ({ 
  isOn, 
  color = 'green', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const colorClasses = {
    green: isOn ? 'bg-green-500 shadow-green-400' : 'bg-green-200',
    red: isOn ? 'bg-red-500 shadow-red-400' : 'bg-red-200',
    blue: isOn ? 'bg-blue-500 shadow-blue-400' : 'bg-blue-200',
    yellow: isOn ? 'bg-yellow-500 shadow-yellow-400' : 'bg-yellow-200',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        rounded-full 
        ${isOn ? 'shadow-lg animate-pulse' : ''}
        transition-all duration-200
      `}
    />
  );
};

export default LEDIndicator;
