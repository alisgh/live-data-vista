
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit3, Calendar, Sprout, Loader2, AlertCircle, Plus } from 'lucide-react';
import { usePlantData } from '@/hooks/usePlantData';
import { useToast } from '@/hooks/use-toast';

const PlantInfo: React.FC = () => {
  const { plantData, isLoading, error, updatePlant, createPlant, refetch } = usePlantData();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempStartDate, setTempStartDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlantName, setNewPlantName] = useState('');
  const [newPlantStartDate, setNewPlantStartDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleStartEdit = () => {
    if (plantData) {
      setTempName(plantData.name);
      setTempStartDate(plantData.startDate);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!tempName.trim() || !plantData) return;
    
    setIsSaving(true);
    const updates: Partial<typeof plantData> = {};
    
    if (tempName.trim() !== plantData.name) {
      updates.name = tempName.trim();
    }
    
    if (tempStartDate !== plantData.startDate) {
      updates.start_date = tempStartDate;
    }
    
    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      setIsSaving(false);
      return;
    }
    
    const success = await updatePlant(plantData.id, updates);
    
    if (success) {
      setIsEditing(false);
      toast({
        title: "Plant Updated",
        description: "Plant information has been updated successfully",
        duration: 2000,
      });
    } else {
      toast({
        title: "Update Failed",
        description: "Failed to update plant information. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
    
    setIsSaving(false);
  };

  const handleCancel = () => {
    if (plantData) {
      setTempName(plantData.name);
      setTempStartDate(plantData.startDate);
    }
    setIsEditing(false);
  };

  const handleCreatePlant = async () => {
    if (!newPlantName.trim() || !newPlantStartDate) return;
    
    setIsCreating(true);
    const newPlant = await createPlant({
      name: newPlantName.trim(),
      start_date: newPlantStartDate,
    });
    
    if (newPlant) {
      setShowCreateForm(false);
      setNewPlantName('');
      setNewPlantStartDate('');
      toast({
        title: "Plant Created",
        description: `New plant "${newPlant.name}" created successfully`,
        duration: 2000,
      });
      refetch(); // Refresh to show the latest plant
    } else {
      toast({
        title: "Creation Failed",
        description: "Failed to create new plant. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
    
    setIsCreating(false);
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
          <CardTitle className="flex items-center justify-between text-green-400">
            <div className="flex items-center gap-2">
              <Sprout className="h-5 w-5" />
              Plant Information
            </div>
            <Button
              size="sm"
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Create Plant
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCreateForm ? (
            <div className="space-y-4 p-4 bg-gray-700/30 rounded-lg">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Plant Name</label>
                <Input
                  value={newPlantName}
                  onChange={(e) => setNewPlantName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter plant name"
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Start Date</label>
                <Input
                  type="date"
                  value={newPlantStartDate}
                  onChange={(e) => setNewPlantStartDate(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  disabled={isCreating}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreatePlant}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isCreating || !newPlantName.trim() || !newPlantStartDate}
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              No plant data available. Create your first plant to get started!
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const growth = getGrowthStage(plantData.growDays);

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-green-400">
          <div className="flex items-center gap-2">
            <Sprout className="h-5 w-5" />
            Plant Information
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            New Plant
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreateForm && (
          <div className="space-y-4 p-4 bg-gray-700/30 rounded-lg mb-4">
            <h4 className="text-sm font-medium text-gray-300">Create New Plant</h4>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Plant Name</label>
              <Input
                value={newPlantName}
                onChange={(e) => setNewPlantName(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Enter plant name"
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Start Date</label>
              <Input
                type="date"
                value={newPlantStartDate}
                onChange={(e) => setNewPlantStartDate(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                disabled={isCreating}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleCreatePlant}
                className="bg-green-600 hover:bg-green-700"
                disabled={isCreating || !newPlantName.trim() || !newPlantStartDate}
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

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

        {/* Start Date */}
        {isEditing && (
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Start Date</label>
            <Input
              type="date"
              value={tempStartDate}
              onChange={(e) => setTempStartDate(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              disabled={isSaving}
            />
          </div>
        )}

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

        {/* Plant Details */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>Plant ID: {plantData.id}</div>
          <div>Started: {new Date(plantData.startDate).toLocaleDateString()}</div>
          {plantData.updatedAt && (
            <div>Last updated: {new Date(plantData.updatedAt).toLocaleDateString()}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlantInfo;
