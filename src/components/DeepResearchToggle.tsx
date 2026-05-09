'use client';

import { cn } from '@/lib/utils';
import { useChat } from '@/lib/hooks/useChat';
import { Sparkles } from 'lucide-react';

const DeepResearchToggle = () => {
  const { deepResearch, setDeepResearch } = useChat();

  return (
    <button
      type="button"
      onClick={() => setDeepResearch(!deepResearch)}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 whitespace-nowrap',
        deepResearch
          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/15'
          : 'text-black/50 dark:text-white/50 hover:text-black/70 dark:hover:text-white/70 hover:bg-light-200/70 dark:hover:bg-dark-200/70',
      )}
    >
      <Sparkles
        size={13}
        className={cn(
          'transition-transform duration-200',
          deepResearch && 'text-purple-500',
        )}
      />
      <span>{deepResearch ? 'Deep Research' : 'Deep Research'}</span>
    </button>
  );
};

export default DeepResearchToggle;
