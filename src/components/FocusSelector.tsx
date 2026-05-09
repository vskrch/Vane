'use client';

import { cn } from '@/lib/utils';
import { useChat, FocusMode } from '@/lib/hooks/useChat';
import {
  Globe,
  GraduationCap,
  MessageCircle,
  PenLine,
  Sigma,
  Video,
} from 'lucide-react';

const focusModes: {
  key: FocusMode;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    key: 'all',
    label: 'All',
    icon: <Globe size={13} />,
    description: 'Search the entire web',
  },
  {
    key: 'academic',
    label: 'Academic',
    icon: <GraduationCap size={13} />,
    description: 'Search academic papers and research',
  },
  {
    key: 'social',
    label: 'Social',
    icon: <MessageCircle size={13} />,
    description: 'Search social media and discussions',
  },
  {
    key: 'writing',
    label: 'Writing',
    icon: <PenLine size={13} />,
    description: 'Generate written content without search',
  },
  {
    key: 'math',
    label: 'Math',
    icon: <Sigma size={13} />,
    description: 'Solve math problems step by step',
  },
  {
    key: 'video',
    label: 'Video',
    icon: <Video size={13} />,
    description: 'Find and search videos',
  },
];

const FocusSelector = () => {
  const { focusMode, setFocusMode } = useChat();

  return (
    <div className="flex items-center gap-0.5">
      {focusModes.map((mode) => {
        const isActive = focusMode === mode.key;
        return (
          <button
            key={mode.key}
            type="button"
            onClick={() => setFocusMode(mode.key)}
            title={mode.description}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 whitespace-nowrap',
              isActive
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                : 'text-black/50 dark:text-white/50 hover:text-black/70 dark:hover:text-white/70 hover:bg-light-200/70 dark:hover:bg-dark-200/70',
            )}
          >
            {mode.icon}
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default FocusSelector;
