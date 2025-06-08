
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit3, Calendar, Sprout } from 'lucide-react';

interface PlantInfoProps {
  plantName: string;
  growDays: number;
  onNameChange: (name: string) => void;
}

const PlantInfo: React.FC<PlantInfoProps> = ({ plantName, growDays, onNameChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(plantName);

  const handleSave = () => {
    if (tempName.trim()) {
      onNameChange(tempName.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setTempName(plantName);
    setIsEditing(false);
  };

  const getGrowthStage = () => {
    if (growDays < 14) return { stage: 'Seedling', color: 'text-blue-400' };
    if (growDays < 35) return { stage: 'Vegetative', color: 'text-green-400' };
    if (growDays < 70) return { stage: 'Flowering', color: 'text-purple-400' };
    return { stage: 'Harvest Ready', color: 'text-yellow-400' };
  };

  const growth = getGrowthStage();

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-400">
          <Sprout className="h-5 w-5" />
          Plant Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plant Name */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Plant Name</label>
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Enter plant name"
              />
              <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-white">{plantName}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-white"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Grow Days */}
        <div className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-lg">
          <Calendar className="h-8 w-8 text-green-400" />
          <div>
            <div className="text-2xl font-bold text-white">{growDays}</div>
            <div className="text-sm text-gray-400">Days of Growth</div>
          </div>
        </div>

        {/* Growth Stage */}
        <div className="p-4 bg-gray-700/30 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Growth Stage</div>
          <div className={`text-lg font-semibold ${growth.color}`}>
            {growth.stage}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlantInfo;
