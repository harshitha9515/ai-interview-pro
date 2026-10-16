import React from 'react';
import { AIStatus } from '../../types/interview';
import { AIInterviewerAvatar } from './AIInterviewerAvatar';

export interface AIAvatarProps {
  status: AIStatus;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatusBadge?: boolean;
  showControls?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const AIAvatar: React.FC<AIAvatarProps> = (props) => {
  return <AIInterviewerAvatar {...props} />;
};
