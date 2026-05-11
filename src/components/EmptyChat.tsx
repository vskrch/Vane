'use client';

import { useEffect, useState } from 'react';
import EmptyChatMessageInput from './EmptyChatMessageInput';
import WeatherWidget from './WeatherWidget';
import NewsArticleWidget from './NewsArticleWidget';
import SettingsButtonMobile from '@/components/Settings/SettingsButtonMobile';
import { useChat } from '@/lib/hooks/useChat';
import {
  getShowNewsWidget,
  getShowWeatherWidget,
} from '@/lib/config/clientRegistry';

const suggestedQuestions = [
  'What are the latest breakthroughs in AI?',
  'Explain quantum computing in simple terms',
  'Best practices for React performance optimization',
  'How does the Federal Reserve affect inflation?',
];

const EmptyChat = () => {
  const { sendMessage } = useChat();
  const [showWeather, setShowWeather] = useState(() =>
    typeof window !== 'undefined' ? getShowWeatherWidget() : false,
  );
  const [showNews, setShowNews] = useState(() =>
    typeof window !== 'undefined' ? getShowNewsWidget() : false,
  );

  useEffect(() => {
    const updateWidgetVisibility = () => {
      setShowWeather(getShowWeatherWidget());
      setShowNews(getShowNewsWidget());
    };

    updateWidgetVisibility();

    window.addEventListener('client-config-changed', updateWidgetVisibility);
    window.addEventListener('storage', updateWidgetVisibility);

    return () => {
      window.removeEventListener(
        'client-config-changed',
        updateWidgetVisibility,
      );
      window.removeEventListener('storage', updateWidgetVisibility);
    };
  }, []);

  return (
    <div className="relative flex flex-col min-h-screen">
      <div className="absolute w-full flex flex-row items-center justify-end mr-5 mt-5">
        <SettingsButtonMobile />
      </div>
      <div className="flex flex-col items-center justify-center flex-1 px-4 -mt-16">
        <div className="flex flex-col items-center w-full max-w-screen-md mx-auto space-y-8">
          <div className="flex flex-col items-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-black/80 dark:text-white/80">
              Direct your curiosity
            </h1>
            <p className="text-sm text-black/50 dark:text-white/50">
              Ask anything, search the web, or dive deep into research
            </p>
          </div>
          <div className="w-full">
            <EmptyChatMessageInput />
          </div>
          <div className="w-full">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="px-3 py-1.5 text-xs sm:text-sm rounded-full border border-light-200 dark:border-dark-200 bg-light-secondary dark:bg-dark-secondary text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:border-light-300 dark:hover:border-dark-300 transition-all duration-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {(showWeather || showNews) && (
        <div className="pb-12 px-4">
          <div className="flex flex-col w-full max-w-screen-md mx-auto gap-4 sm:flex-row sm:justify-center">
            {showWeather && (
              <div className="flex-1 w-full">
                <WeatherWidget />
              </div>
            )}
            {showNews && (
              <div className="flex-1 w-full">
                <NewsArticleWidget />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmptyChat;
