'use client';

const getClientConfig = (key: string, defaultVal?: any) => {
  return localStorage.getItem(key) ?? defaultVal ?? undefined;
};

export const getTheme = () => getClientConfig('theme', 'dark');

export const getAutoMediaSearch = () =>
  getClientConfig('autoMediaSearch', 'true') === 'true';

export const getSystemInstructions = () =>
  getClientConfig('systemInstructions', '');

export const getShowWeatherWidget = () =>
  getClientConfig('showWeatherWidget', 'true') === 'true';

export const getShowNewsWidget = () =>
  getClientConfig('showNewsWidget', 'true') === 'true';

export const getMeasurementUnit = () => {
  const value =
    getClientConfig('measureUnit') ??
    getClientConfig('measurementUnit', 'metric');

  if (typeof value !== 'string') return 'metric';

  return value.toLowerCase();
};

export const getHiddenModels = (): string[] => {
  try {
    const raw = localStorage.getItem('hiddenModels');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const setHiddenModels = (models: string[]) => {
  localStorage.setItem('hiddenModels', JSON.stringify(models));
  window.dispatchEvent(new CustomEvent('client-config-changed'));
};

export const toggleHiddenModel = (modelId: string): boolean => {
  const current = getHiddenModels();
  const index = current.indexOf(modelId);
  if (index === -1) {
    setHiddenModels([...current, modelId]);
    return true;
  } else {
    setHiddenModels(current.filter((id) => id !== modelId));
    return false;
  }
};

export const isModelHidden = (modelId: string): boolean => {
  return getHiddenModels().includes(modelId);
};
