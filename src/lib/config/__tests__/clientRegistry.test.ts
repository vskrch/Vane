import { describe, it, expect, beforeEach, vi } from 'vitest';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

const dispatchEventMock = vi.fn();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'window', {
  value: { dispatchEvent: dispatchEventMock },
  writable: true,
});

const {
  getTheme,
  getAutoMediaSearch,
  getSystemInstructions,
  getShowWeatherWidget,
  getShowNewsWidget,
  getMeasurementUnit,
  getHiddenModels,
  setHiddenModels,
  toggleHiddenModel,
  isModelHidden,
} = await import('../clientRegistry');

describe('clientRegistry', () => {
  beforeEach(() => {
    localStorageMock.clear();
    dispatchEventMock.mockClear();
  });

  describe('getTheme', () => {
    it('returns dark as default', () => {
      expect(getTheme()).toBe('dark');
    });

    it('returns stored theme value', () => {
      localStorageMock.setItem('theme', 'light');
      expect(getTheme()).toBe('light');
    });
  });

  describe('getAutoMediaSearch', () => {
    it('returns true as default', () => {
      expect(getAutoMediaSearch()).toBe(true);
    });

    it('returns false when set to false', () => {
      localStorageMock.setItem('autoMediaSearch', 'false');
      expect(getAutoMediaSearch()).toBe(false);
    });

    it('returns true when set to true', () => {
      localStorageMock.setItem('autoMediaSearch', 'true');
      expect(getAutoMediaSearch()).toBe(true);
    });
  });

  describe('getSystemInstructions', () => {
    it('returns empty string as default', () => {
      expect(getSystemInstructions()).toBe('');
    });

    it('returns stored instructions', () => {
      localStorageMock.setItem('systemInstructions', 'Be helpful');
      expect(getSystemInstructions()).toBe('Be helpful');
    });
  });

  describe('getShowWeatherWidget', () => {
    it('returns true as default', () => {
      expect(getShowWeatherWidget()).toBe(true);
    });

    it('returns false when set to false', () => {
      localStorageMock.setItem('showWeatherWidget', 'false');
      expect(getShowWeatherWidget()).toBe(false);
    });
  });

  describe('getShowNewsWidget', () => {
    it('returns true as default', () => {
      expect(getShowNewsWidget()).toBe(true);
    });

    it('returns false when set to false', () => {
      localStorageMock.setItem('showNewsWidget', 'false');
      expect(getShowNewsWidget()).toBe(false);
    });
  });

  describe('getMeasurementUnit', () => {
    it('returns metric as default', () => {
      expect(getMeasurementUnit()).toBe('metric');
    });

    it('returns imperial when set', () => {
      localStorageMock.setItem('measureUnit', 'imperial');
      expect(getMeasurementUnit()).toBe('imperial');
    });

    it('reads from legacy measurementUnit key', () => {
      localStorageMock.setItem('measurementUnit', 'IMPERIAL');
      expect(getMeasurementUnit()).toBe('imperial');
    });

    it('lowercases the value', () => {
      localStorageMock.setItem('measureUnit', 'METRIC');
      expect(getMeasurementUnit()).toBe('metric');
    });
  });

  describe('hidden models', () => {
    describe('getHiddenModels', () => {
      it('returns empty array when no hidden models', () => {
        expect(getHiddenModels()).toEqual([]);
      });

      it('returns stored hidden models', () => {
        const models = ['prov1/gpt-4', 'prov2/claude-3'];
        localStorageMock.setItem('hiddenModels', JSON.stringify(models));
        expect(getHiddenModels()).toEqual(models);
      });

      it('returns empty array for invalid JSON', () => {
        localStorageMock.setItem('hiddenModels', 'not-json');
        expect(getHiddenModels()).toEqual([]);
      });

      it('returns empty array for non-array JSON', () => {
        localStorageMock.setItem('hiddenModels', '{"key": "value"}');
        expect(getHiddenModels()).toEqual([]);
      });
    });

    describe('setHiddenModels', () => {
      it('saves to localStorage', () => {
        const models = ['prov1/gpt-4'];
        setHiddenModels(models);
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'hiddenModels',
          JSON.stringify(models),
        );
      });

      it('dispatches client-config-changed event', () => {
        setHiddenModels(['prov1/gpt-4']);
        expect(dispatchEventMock).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'client-config-changed' }),
        );
      });
    });

    describe('toggleHiddenModel', () => {
      it('adds a model to hidden list', () => {
        const result = toggleHiddenModel('prov1/gpt-4');
        expect(result).toBe(true);
        expect(getHiddenModels()).toContain('prov1/gpt-4');
      });

      it('removes a model from hidden list', () => {
        setHiddenModels(['prov1/gpt-4']);
        const result = toggleHiddenModel('prov1/gpt-4');
        expect(result).toBe(false);
        expect(getHiddenModels()).not.toContain('prov1/gpt-4');
      });

      it('handles multiple models', () => {
        setHiddenModels(['prov1/gpt-4', 'prov2/claude-3']);
        toggleHiddenModel('prov1/gpt-4');
        expect(getHiddenModels()).toEqual(['prov2/claude-3']);
        toggleHiddenModel('prov2/claude-3');
        expect(getHiddenModels()).toEqual([]);
      });
    });

    describe('isModelHidden', () => {
      it('returns true when model is hidden', () => {
        setHiddenModels(['prov1/gpt-4']);
        expect(isModelHidden('prov1/gpt-4')).toBe(true);
      });

      it('returns false when model is not hidden', () => {
        setHiddenModels(['prov1/gpt-4']);
        expect(isModelHidden('prov2/claude-3')).toBe(false);
      });

      it('returns false when no models are hidden', () => {
        expect(isModelHidden('prov1/gpt-4')).toBe(false);
      });
    });
  });
});
