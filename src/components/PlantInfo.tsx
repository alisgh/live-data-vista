
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit3, Calendar, Sprout, Loader2, AlertCircle } from 'lucide-react';
import { usePlantData } from '@/hooks/usePlantData';
import { useToast } from '@/hooks/use-toast';

const PlantInfo: React.FC = () => {
  const { plantData, isLoading, error, updatePlantName } = usePlantData();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    if (plantData) {
      setTempName(plantData.name);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!tempName.trim()) return;
    
    setIsSaving(true);
    const success = await updatePlantName(tempName.trim());
    
    if (success) {
      setIsEditing(false);
      toast({
        title: "Plant Info Updated",
        description: `Plant name changed to "${tempName.trim()}"`,
        duration: 2000,
      });
    } else {
      toast({
        title: "Update Failed",
        description: "Failed to update plant name. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
    
    setIsSaving(false);
  };

  const handleCancel = () => {
    if (plantData) {
      setTempName(plantData.name);
    }
    setIsEditing(false);
  };

  const getGrowthStage = (growDays: number) => {
    if (growDays < 14) return { stage: 'Seedling', color: 'text-blue-400' };
    if (growDays < 35) return { stage: 'Vegetative', color: 'text-green-400' };
    if (growDays < 70) return { stage: 'Flowering', color: 'text-purple-400' };
    return { stage: 'Harvest Ready', color: 'text-yellow-400' };
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Sprout className="h-5 w-5" />
            Plant Information
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading plant data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Sprout className="h-5 w-5" />
            Plant Information
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!plantData) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Sprout className="h-5 w-5" />
            Plant Information
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-gray-400">No plant data available</div>
        </CardContent>
      </Card>
    );
  }

  const growth = getGrowthStage(plantData.growDays);

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
                disabled={isSaving}
              />
              <Button 
                size="sm" 
                onClick={handleSave} 
                className="bg-green-600 hover:bg-green-700"
                disabled={isSaving || !tempName.trim()}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-white">{plantData.name}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleStartEdit}
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
            <div className="text-2xl font-bold text-white">{plantData.growDays}</div>
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

        {/* Start Date */}
        <div className="text-xs text-gray-500">
          Started: {new Date(plantData.startDate).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlantInfo;
