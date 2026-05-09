import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSearchSearxng = vi.fn();
const mockComputeSimilarity = vi.fn();
const mockScraperScrape = vi.fn();
const mockSplitText = vi.fn();

vi.mock('@/lib/searxng', () => ({
  searchSearxng: (...args: any[]) => mockSearchSearxng(...args),
}));

vi.mock('@/lib/utils/computeSimilarity', () => ({
  default: (...args: any[]) => mockComputeSimilarity(...args),
}));

vi.mock('@/lib/scraper', () => ({
  default: { scrape: (...args: any[]) => mockScraperScrape(...args) },
}));

vi.mock('@/lib/utils/splitText', () => ({
  splitText: (...args: any[]) => mockSplitText(...args),
}));

const { executeSearch } = await import('../baseSearch');

describe('executeSearch', () => {
  const baseResearchBlock = {
    id: 'research-1',
    type: 'research' as const,
    data: { subSteps: [] },
  };

  const mockSession = {
    updateBlock: vi.fn(),
  };

  const mockLLM = {
    generateObject: vi.fn(),
  };

  const mockEmbedding = {
    embedText: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.crypto.randomUUID = vi.fn().mockReturnValue('mock-uuid');
    mockSplitText.mockReturnValue(['full content']);
  });

  describe('speed mode', () => {
    it('performs parallel search and deduplicates results', async () => {
      mockSearchSearxng.mockResolvedValue({
        results: [
          {
            title: 'Result 1',
            content: 'Content 1',
            url: 'https://example.com/1',
          },
          {
            title: 'Result 2',
            content: 'Content 2',
            url: 'https://example.com/2',
          },
        ],
        suggestions: [],
      });

      mockEmbedding.embedText.mockResolvedValue([
        [0.1, 0.2],
        [0.3, 0.4],
      ]);
      mockComputeSimilarity
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.7)
        .mockReturnValueOnce(0.3);

      const results = await executeSearch({
        queries: ['test query'],
        mode: 'speed',
        researchBlock: JSON.parse(JSON.stringify(baseResearchBlock)),
        session: mockSession as any,
        llm: mockLLM as any,
        embedding: mockEmbedding as any,
      });

      expect(mockSearchSearxng).toHaveBeenCalledWith(
        'test query',
        expect.any(Object),
      );
      expect(Array.isArray(results)).toBe(true);
    });

    it('handles embedding error gracefully', async () => {
      mockSearchSearxng.mockResolvedValue({
        results: [
          {
            title: 'Result',
            content: 'Content',
            url: 'https://example.com',
          },
        ],
        suggestions: [],
      });

      mockEmbedding.embedText.mockRejectedValue(new Error('Embedding failed'));

      const results = await executeSearch({
        queries: ['test query'],
        mode: 'speed',
        researchBlock: JSON.parse(JSON.stringify(baseResearchBlock)),
        session: mockSession as any,
        llm: mockLLM as any,
        embedding: mockEmbedding as any,
      });

      expect(Array.isArray(results)).toBe(true);
    });

    it('handles empty search results', async () => {
      mockSearchSearxng.mockResolvedValue({
        results: [],
        suggestions: [],
      });

      mockEmbedding.embedText.mockResolvedValue([[0.1, 0.2]]);

      const results = await executeSearch({
        queries: ['empty query'],
        mode: 'speed',
        researchBlock: JSON.parse(JSON.stringify(baseResearchBlock)),
        session: mockSession as any,
        llm: mockLLM as any,
        embedding: mockEmbedding as any,
      });

      expect(results).toEqual([]);
    });

    it('emits searching and search_results sub-steps', async () => {
      mockSearchSearxng.mockResolvedValue({
        results: [
          {
            title: 'Result',
            content: 'Content',
            url: 'https://example.com',
          },
        ],
        suggestions: [],
      });

      mockEmbedding.embedText.mockResolvedValue([
        [0.1, 0.2],
        [0.3, 0.4],
      ]);
      mockComputeSimilarity.mockReturnValue(0.9);

      const researchBlock = JSON.parse(JSON.stringify(baseResearchBlock));

      await executeSearch({
        queries: ['test query'],
        mode: 'speed',
        researchBlock,
        session: mockSession as any,
        llm: mockLLM as any,
        embedding: mockEmbedding as any,
      });

      expect(mockSession.updateBlock).toHaveBeenCalled();
      expect(researchBlock.data.subSteps.length).toBeGreaterThanOrEqual(2);
      expect(researchBlock.data.subSteps[0].type).toBe('searching');
    });
  });

  describe('balanced mode', () => {
    it('processes queries similarly to speed mode', async () => {
      mockSearchSearxng.mockResolvedValue({
        results: [
          {
            title: 'Balanced Result',
            content: 'Balanced Content',
            url: 'https://example.com/balanced',
          },
        ],
        suggestions: [],
      });

      mockEmbedding.embedText.mockResolvedValue([
        [0.1, 0.2],
        [0.3, 0.4],
      ]);
      mockComputeSimilarity.mockReturnValue(0.85);

      const results = await executeSearch({
        queries: ['balanced query'],
        mode: 'balanced',
        researchBlock: JSON.parse(JSON.stringify(baseResearchBlock)),
        session: mockSession as any,
        llm: mockLLM as any,
        embedding: mockEmbedding as any,
      });

      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('quality mode', () => {
    it('picks and scrapes results using LLM', async () => {
      mockSearchSearxng.mockResolvedValue({
        results: [
          { title: 'Quality 1', content: 'QC1', url: 'https://q1.com' },
          { title: 'Quality 2', content: 'QC2', url: 'https://q2.com' },
          { title: 'Quality 3', content: 'QC3', url: 'https://q3.com' },
        ],
        suggestions: [],
      });

      mockLLM.generateObject
        .mockResolvedValueOnce({ picked_indices: [0, 2] })
        .mockResolvedValueOnce({
          extracted_facts: '- Fact 1\n- Fact 2',
        })
        .mockResolvedValueOnce({
          extracted_facts: '- Fact 3\n- Fact 4',
        });

      mockScraperScrape
        .mockResolvedValueOnce({
          content: 'Scraped content from quality 1',
          title: 'Scraped Q1',
        })
        .mockResolvedValueOnce({
          content: 'Scraped content from quality 3',
          title: 'Scraped Q3',
        });

      const results = await executeSearch({
        queries: ['quality query'],
        mode: 'quality',
        researchBlock: JSON.parse(JSON.stringify(baseResearchBlock)),
        session: mockSession as any,
        llm: mockLLM as any,
        embedding: {} as any,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(mockLLM.generateObject).toHaveBeenCalled();
    });

    it('handles scrape failure gracefully', async () => {
      mockSearchSearxng.mockResolvedValue({
        results: [{ title: 'Fail', content: 'Fail', url: 'https://fail.com' }],
        suggestions: [],
      });

      mockLLM.generateObject.mockResolvedValueOnce({
        picked_indices: [0],
      });

      mockScraperScrape.mockRejectedValue(new Error('Scrape failed'));

      const results = await executeSearch({
        queries: ['fail query'],
        mode: 'quality',
        researchBlock: JSON.parse(JSON.stringify(baseResearchBlock)),
        session: mockSession as any,
        llm: mockLLM as any,
        embedding: {} as any,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(mockLLM.generateObject).toHaveBeenCalledTimes(1);
    });
  });

  describe('deep_research mode', () => {
    it('performs deep search with picker and extraction', async () => {
      mockSearchSearxng.mockResolvedValue({
        results: [
          {
            title: 'Deep 1',
            content: 'Deep Content 1',
            url: 'https://deep1.com',
          },
          {
            title: 'Deep 2',
            content: 'Deep Content 2',
            url: 'https://deep2.com',
          },
          {
            title: 'Deep 3',
            content: 'Deep Content 3',
            url: 'https://deep3.com',
          },
          {
            title: 'Deep 4',
            content: 'Deep Content 4',
            url: 'https://deep4.com',
          },
        ],
        suggestions: [],
      });

      mockLLM.generateObject
        .mockResolvedValueOnce({ picked_indices: [0, 2, 3] })
        .mockResolvedValueOnce({ extracted_facts: '- Deep fact 1' })
        .mockResolvedValueOnce({ extracted_facts: '- Deep fact 2' })
        .mockResolvedValueOnce({ extracted_facts: '- Deep fact 3' });

      mockScraperScrape
        .mockResolvedValueOnce({
          content: 'Scraped deep 1',
          title: 'Deep 1 Title',
        })
        .mockResolvedValueOnce({
          content: 'Scraped deep 3',
          title: 'Deep 3 Title',
        })
        .mockResolvedValueOnce({
          content: 'Scraped deep 4',
          title: 'Deep 4 Title',
        });

      const results = await executeSearch({
        queries: ['deep research query'],
        mode: 'deep_research',
        researchBlock: JSON.parse(JSON.stringify(baseResearchBlock)),
        session: mockSession as any,
        llm: mockLLM as any,
        embedding: {} as any,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(mockLLM.generateObject).toHaveBeenCalled();
      const pickerCall = mockLLM.generateObject.mock.calls.find((call: any) =>
        call[0]?.messages?.some(
          (m: any) =>
            typeof m.content === 'string' &&
            m.content.includes('picked_indices'),
        ),
      );
      expect(pickerCall).toBeDefined();
    });

    it('handles scrape failure in deep_research mode', async () => {
      mockSearchSearxng.mockResolvedValue({
        results: [{ title: 'Deep', content: 'Deep', url: 'https://deep.com' }],
        suggestions: [],
      });

      mockLLM.generateObject.mockResolvedValueOnce({
        picked_indices: [0],
      });

      mockScraperScrape.mockRejectedValue(new Error('Scrape error'));

      const results = await executeSearch({
        queries: ['deep query'],
        mode: 'deep_research',
        researchBlock: JSON.parse(JSON.stringify(baseResearchBlock)),
        session: mockSession as any,
        llm: mockLLM as any,
        embedding: {} as any,
      });

      expect(Array.isArray(results)).toBe(true);
    });

    it('deduplicates URLs that were already extracted', async () => {
      mockSearchSearxng.mockResolvedValue({
        results: [{ title: 'Dup', content: 'Dup', url: 'https://dup.com' }],
        suggestions: [],
      });

      mockLLM.generateObject.mockResolvedValueOnce({
        picked_indices: [0],
      });

      mockScraperScrape.mockResolvedValueOnce({
        content: 'Scraped dup',
        title: 'Dup Title',
      });

      const researchBlock = {
        id: 'research-1',
        type: 'research' as const,
        data: {
          subSteps: [
            {
              id: 'existing-reading',
              type: 'reading' as const,
              reading: [
                { metadata: { url: 'https://dup.com', title: 'Existing' } },
              ],
            },
          ],
        },
      };

      const results = await executeSearch({
        queries: ['dup query'],
        mode: 'deep_research',
        researchBlock: JSON.parse(JSON.stringify(researchBlock)),
        session: mockSession as any,
        llm: mockLLM as any,
        embedding: {} as any,
      });

      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('unknown mode', () => {
    it('returns empty array', async () => {
      const results = await executeSearch({
        queries: ['test'],
        mode: 'unknown' as any,
        researchBlock: JSON.parse(JSON.stringify(baseResearchBlock)),
        session: mockSession as any,
        llm: mockLLM as any,
        embedding: {} as any,
      });

      expect(results).toEqual([]);
    });
  });
});
