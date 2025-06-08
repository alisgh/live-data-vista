
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
    green: isOn ? 'bg-green-500 shadow-green-400/50 ring-green-400/30' : 'bg-green-200/20 border-green-600/30',
    red: isOn ? 'bg-red-500 shadow-red-400/50 ring-red-400/30' : 'bg-red-200/20 border-red-600/30',
    blue: isOn ? 'bg-blue-500 shadow-blue-400/50 ring-blue-400/30' : 'bg-blue-200/20 border-blue-600/30',
    yellow: isOn ? 'bg-yellow-500 shadow-yellow-400/50 ring-yellow-400/30' : 'bg-yellow-200/20 border-yellow-600/30',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        rounded-full 
        border-2
        transition-all duration-300 ease-in-out
        ${isOn ? 'shadow-lg animate-pulse ring-2 ring-offset-2 ring-offset-gray-800' : 'border-2'}
        ${isOn ? 'scale-110' : 'scale-100'}
        hover:scale-125
      `}
    />
  );
};

export default LEDIndicator;
