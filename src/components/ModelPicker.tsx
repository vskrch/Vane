'use client';

import {
  ChevronDown,
  Cpu,
  Loader2,
  Search,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { useEffect, useMemo, useState } from 'react';
import { MinimalProvider } from '@/lib/models/types';
import { useChat } from '@/lib/hooks/useChat';
import { AnimatePresence, motion } from 'motion/react';
import {
  getHiddenModels,
  toggleHiddenModel,
  isModelHidden,
} from '@/lib/config/clientRegistry';

const ModelPicker = ({ compact = false }: { compact?: boolean }) => {
  const [providers, setProviders] = useState<MinimalProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hiddenModels, setHiddenModelsState] = useState<string[]>([]);

  const { setChatModelProvider, chatModelProvider } = useChat();

  useEffect(() => {
    const loadProviders = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/providers');

        if (!res.ok) {
          throw new Error('Failed to fetch providers');
        }

        const data: { providers: MinimalProvider[] } = await res.json();
        setProviders(data.providers);
        setHiddenModelsState(getHiddenModels());
      } catch (error) {
        console.error('Error loading providers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProviders();
  }, []);

  const currentModelName = useMemo(() => {
    if (!chatModelProvider) return 'Select model';
    for (const p of providers) {
      const model = p.chatModels.find((m) => m.key === chatModelProvider.key);
      if (model && p.id === chatModelProvider.providerId) {
        return model.name;
      }
    }
    return 'Select model';
  }, [providers, chatModelProvider]);

  const orderedProviders = useMemo(() => {
    if (!chatModelProvider?.providerId) return providers;
    const currentProviderIndex = providers.findIndex(
      (p) => p.id === chatModelProvider.providerId,
    );
    if (currentProviderIndex === -1) return providers;
    const selectedProvider = providers[currentProviderIndex];
    const remainingProviders = providers.filter(
      (_, index) => index !== currentProviderIndex,
    );
    return [selectedProvider, ...remainingProviders];
  }, [providers, chatModelProvider]);

  const handleModelSelect = (providerId: string, modelKey: string) => {
    setChatModelProvider({ providerId, key: modelKey });
    localStorage.setItem('chatModelProviderId', providerId);
    localStorage.setItem('chatModelKey', modelKey);
  };

  const handleToggleVisibility = (
    e: React.MouseEvent,
    providerId: string,
    modelKey: string,
  ) => {
    e.stopPropagation();
    const modelId = `${providerId}/${modelKey}`;
    const nowHidden = toggleHiddenModel(modelId);
    setHiddenModelsState(getHiddenModels());
  };

  const filteredProviders = orderedProviders
    .map((provider) => ({
      ...provider,
      chatModels: provider.chatModels.filter(
        (model) =>
          model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          provider.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((provider) => provider.chatModels.length > 0);

  const visibleProviders = searchQuery
    ? filteredProviders
    : filteredProviders
        .map((provider) => ({
          ...provider,
          chatModels: provider.chatModels.filter(
            (model) => !hiddenModels.includes(`${provider.id}/${model.key}`),
          ),
        }))
        .filter((provider) => provider.chatModels.length > 0);

  const displayProviders =
    visibleProviders.length > 0 ? visibleProviders : filteredProviders;

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <PopoverButton
            type="button"
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 focus:outline-none group',
              compact ? 'text-xs' : 'text-sm',
              open
                ? 'bg-light-200 dark:bg-dark-200 text-black dark:text-white'
                : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-light-200/50 dark:hover:bg-dark-200/50',
            )}
          >
            <Cpu size={compact ? 14 : 16} className="text-sky-500 shrink-0" />
            <span className="font-medium truncate max-w-[120px] sm:max-w-[180px]">
              {currentModelName}
            </span>
            <ChevronDown
              size={compact ? 12 : 14}
              className={cn(
                'shrink-0 transition-transform duration-200',
                open && 'rotate-180',
              )}
            />
          </PopoverButton>
          <AnimatePresence>
            {open && (
              <PopoverPanel className="absolute z-50 left-0 mt-1" static>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="origin-top-left bg-light-primary dark:bg-dark-primary border border-light-200 dark:border-dark-200 rounded-xl shadow-lg shadow-black/10 dark:shadow-black/30 w-[240px] sm:w-[280px] overflow-hidden"
                >
                  <div className="p-2 border-b border-light-200 dark:border-dark-200">
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40"
                      />
                      <input
                        type="text"
                        placeholder="Search models..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-light-secondary dark:bg-dark-secondary rounded-lg placeholder:text-xs text-xs text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none border border-transparent focus:border-light-300 dark:focus:border-dark-300 transition duration-200"
                      />
                    </div>
                  </div>

                  <div className="max-h-[320px] overflow-y-auto">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2
                          className="animate-spin text-black/40 dark:text-white/40"
                          size={20}
                        />
                      </div>
                    ) : displayProviders.length === 0 ? (
                      <div className="text-center py-12 px-4 text-black/60 dark:text-white/60 text-xs">
                        {searchQuery
                          ? 'No models found'
                          : 'No chat models configured'}
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {displayProviders.map((provider, providerIndex) => (
                          <div key={provider.id}>
                            <div className="px-3 py-2 sticky top-0 bg-light-primary dark:bg-dark-primary border-b border-light-200/50 dark:border-dark-200/50">
                              <p className="text-[11px] text-black/50 dark:text-white/50 uppercase tracking-wider font-medium">
                                {provider.name}
                              </p>
                            </div>
                            <div className="flex flex-col p-1">
                              {provider.chatModels.map((model) => {
                                const isSelected =
                                  chatModelProvider?.providerId ===
                                    provider.id &&
                                  chatModelProvider?.key === model.key;
                                const modelId = `${provider.id}/${model.key}`;
                                const isHidden = hiddenModels.includes(modelId);

                                return (
                                  <button
                                    key={model.key}
                                    onClick={() =>
                                      handleModelSelect(provider.id, model.key)
                                    }
                                    type="button"
                                    className={cn(
                                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 text-xs group',
                                      isSelected
                                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                                        : 'text-black/70 dark:text-white/70 hover:bg-light-secondary dark:hover:bg-dark-secondary',
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        'w-4 h-4 rounded flex items-center justify-center shrink-0',
                                        isSelected
                                          ? 'text-sky-500'
                                          : 'text-black/30 dark:text-white/30',
                                      )}
                                    >
                                      {isSelected && <Check size={14} />}
                                    </div>
                                    <span className="truncate flex-1">
                                      {model.name}
                                    </span>
                                    <button
                                      onClick={(e) =>
                                        handleToggleVisibility(
                                          e,
                                          provider.id,
                                          model.key,
                                        )
                                      }
                                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 transition-all duration-150"
                                      title={
                                        isHidden
                                          ? 'Show in picker'
                                          : 'Hide from picker'
                                      }
                                    >
                                      {isHidden ? (
                                        <EyeOff size={12} />
                                      ) : (
                                        <Eye size={12} />
                                      )}
                                    </button>
                                  </button>
                                );
                              })}
                            </div>
                            {providerIndex < displayProviders.length - 1 && (
                              <div className="h-px bg-light-200 dark:bg-dark-200 mx-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </PopoverPanel>
            )}
          </AnimatePresence>
        </>
      )}
    </Popover>
  );
};

export default ModelPicker;
