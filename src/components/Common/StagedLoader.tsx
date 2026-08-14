import React, { useState, useEffect } from 'react';


interface StagedLoaderProps {
  stages: Array<{
    id: string;
    name: string;
    component: React.ComponentType;
    priority: 'critical' | 'high' | 'medium' | 'low';
  }>;
  onStageComplete?: (stageId: string) => void;
  onAllStagesComplete?: () => void;
}

export const StagedLoader: React.FC<StagedLoaderProps> = ({
  stages,
  onStageComplete,
  onAllStagesComplete
}) => {
  const [completedStages, setCompletedStages] = useState<Set<string>>(new Set());
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  // Sort stages by priority
  const sortedStages = [...stages].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Load stages sequentially based on priority
  useEffect(() => {
    if (currentStageIndex < sortedStages.length) {
      const stage = sortedStages[currentStageIndex];
      
      // Simulate loading completion
      const timer = setTimeout(() => {
        setCompletedStages(prev => {
          const newSet = new Set(prev);
          newSet.add(stage.id);
          return newSet;
        });
        
        if (onStageComplete) {
          onStageComplete(stage.id);
        }
        
        // Move to next stage
        setCurrentStageIndex(prev => prev + 1);
      }, 100); // Minimal delay to simulate async loading
      
      return () => clearTimeout(timer);
    } else if (currentStageIndex >= sortedStages.length && onAllStagesComplete) {
      onAllStagesComplete();
    }
  }, [currentStageIndex, sortedStages, onStageComplete, onAllStagesComplete]);

  // Render completed stages
  const renderCompletedStages = () => {
    return sortedStages
      .filter(stage => completedStages.has(stage.id))
      .map(stage => {
        const Component = stage.component;
        return <Component key={stage.id} />;
      });
  };

  // Get current loading stage name
  const getCurrentStageName = () => {
    if (currentStageIndex < sortedStages.length) {
      return sortedStages[currentStageIndex].name;
    }
    return 'Complete';
  };

  return (
    <div className="staged-loader">
      {renderCompletedStages()}
      
      {currentStageIndex < sortedStages.length && (
        <div className="loading-overlay">
          <></>
        </div>
      )}
    </div>
  );
};