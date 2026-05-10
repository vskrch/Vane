import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExecuteSearch = vi.fn();

vi.mock('../baseSearch', () => ({
  executeSearch: (...args: any[]) => mockExecuteSearch(...args),
}));

vi.mock('@/lib/searxng', () => ({
  searchSearxng: vi.fn(),
}));

vi.mock('@/lib/utils/computeSimilarity', () => ({
  default: vi.fn(),
}));

vi.mock('@/lib/scraper', () => ({
  default: { scrape: vi.fn() },
}));

vi.mock('@/lib/utils/splitText', () => ({
  splitText: vi.fn(),
}));

const { default: webSearchAction } = await import('../webSearch');

describe('webSearchAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('name', () => {
    it('has correct name', () => {
      expect(webSearchAction.name).toBe('web_search');
    });
  });

  describe('schema', () => {
    it('validates correct input', () => {
      const result = webSearchAction.schema.safeParse({
        type: 'web_search',
        queries: ['test query', 'another query'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid input', () => {
      const result = webSearchAction.schema.safeParse({
        type: 'web_search',
        queries: 'not an array',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('getToolDescription', () => {
    it('returns a string', () => {
      const desc = webSearchAction.getToolDescription({ mode: 'balanced' });
      expect(typeof desc).toBe('string');
      expect(desc.length).toBeGreaterThan(0);
    });
  });

  describe('getDescription', () => {
    it('returns speed mode prompt for speed mode', () => {
      const desc = webSearchAction.getDescription({ mode: 'speed' });
      expect(desc).toContain('speed mode');
      expect(desc).toContain('one go');
    });

    it('returns balanced mode prompt for balanced mode', () => {
      const desc = webSearchAction.getDescription({ mode: 'balanced' });
      expect(desc).toContain('broader queries');
      expect(desc).toContain('Tesla');
    });

    it('returns quality mode prompt for quality mode', () => {
      const desc = webSearchAction.getDescription({ mode: 'quality' });
      expect(desc).toContain('5-6 iterations');
    });

    it('returns deep research mode prompt for deep_research mode', () => {
      const desc = webSearchAction.getDescription({ mode: 'deep_research' });
      expect(desc).toContain('DEEP RESEARCH');
      expect(desc).toContain('40 iterations');
      expect(desc).toContain('4-6 times');
    });

    it('falls back to speed mode for unknown mode', () => {
      const desc = webSearchAction.getDescription({
        mode: 'unknown' as any,
      });
      expect(desc).toContain('speed mode');
    });
  });

  describe('enabled', () => {
    it('is enabled for web sources with no skipSearch', () => {
      const result = webSearchAction.enabled({
        sources: ['web'],
        classification: {
          classification: {
            skipSearch: false,
            personalSearch: false,
            academicSearch: false,
            discussionSearch: false,
            showWeatherWidget: false,
            showStockWidget: false,
            showCalculationWidget: false,
          },
          standaloneFollowUp: 'test',
        },
        fileIds: [],
        mode: 'balanced',
      });
      expect(result).toBe(true);
    });

    it('is disabled when sources does not include web', () => {
      const result = webSearchAction.enabled({
        sources: ['academic'],
        classification: {
          classification: {
            skipSearch: false,
            personalSearch: false,
            academicSearch: true,
            discussionSearch: false,
            showWeatherWidget: false,
            showStockWidget: false,
            showCalculationWidget: false,
          },
          standaloneFollowUp: 'test',
        },
        fileIds: [],
        mode: 'balanced',
      });
      expect(result).toBe(false);
    });

    it('is disabled when skipSearch is true', () => {
      const result = webSearchAction.enabled({
        sources: ['web'],
        classification: {
          classification: {
            skipSearch: true,
            personalSearch: false,
            academicSearch: false,
            discussionSearch: false,
            showWeatherWidget: false,
            showStockWidget: false,
            showCalculationWidget: false,
          },
          standaloneFollowUp: 'test',
        },
        fileIds: [],
        mode: 'balanced',
      });
      expect(result).toBe(false);
    });
  });

  describe('execute', () => {
    it('calls executeSearch with correct parameters', async () => {
      mockExecuteSearch.mockResolvedValue([{ content: 'test', metadata: {} }]);

      const mockSession = {
        getBlock: vi.fn().mockReturnValue({
          id: 'block-1',
          type: 'research',
          data: { subSteps: [] },
        }),
        updateBlock: vi.fn(),
      };

      const result = await webSearchAction.execute!(
        { type: 'web_search', queries: ['query1', 'query2'] },
        {
          llm: {} as any,
          embedding: {} as any,
          session: mockSession as any,
          researchBlockId: 'block-1',
          fileIds: [],
          mode: 'balanced',
        },
      );

      expect(mockExecuteSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          queries: ['query1', 'query2'],
          mode: 'balanced',
        }),
      );
      expect(result.type).toBe('search_results');
      if (result.type === 'search_results') {
        expect(result.results).toEqual([{ content: 'test', metadata: {} }]);
      }
    });

    it('handles string query as single element', async () => {
      mockExecuteSearch.mockResolvedValue([]);

      const mockSession = {
        getBlock: vi.fn().mockReturnValue({
          id: 'block-1',
          type: 'research',
          data: { subSteps: [] },
        }),
        updateBlock: vi.fn(),
      };

      const result = await webSearchAction.execute!(
        { type: 'web_search', queries: 'single-query' as any },
        {
          llm: {} as any,
          embedding: {} as any,
          session: mockSession as any,
          researchBlockId: 'block-1',
          fileIds: [],
          mode: 'balanced',
        },
      );

      expect(mockExecuteSearch).toHaveBeenCalledWith(
        expect.objectContaining({ queries: ['single-query'] }),
      );
      expect(result.type).toBe('search_results');
    });

    it('limits queries to 3', async () => {
      mockExecuteSearch.mockResolvedValue([]);

      const mockSession = {
        getBlock: vi.fn().mockReturnValue({
          id: 'block-1',
          type: 'research',
          data: { subSteps: [] },
        }),
        updateBlock: vi.fn(),
      };

      await webSearchAction.execute!(
        {
          type: 'web_search',
          queries: ['q1', 'q2', 'q3', 'q4', 'q5'],
        },
        {
          llm: {} as any,
          embedding: {} as any,
          session: mockSession as any,
          researchBlockId: 'block-1',
          fileIds: [],
          mode: 'balanced',
        },
      );

      expect(mockExecuteSearch).toHaveBeenCalledWith(
        expect.objectContaining({ queries: ['q1', 'q2', 'q3'] }),
      );
    });
  });
});
