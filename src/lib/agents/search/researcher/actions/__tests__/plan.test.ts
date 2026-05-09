import { describe, it, expect } from 'vitest';

const { default: planAction } = await import('../plan');

describe('planAction (__reasoning_preamble)', () => {
  describe('name', () => {
    it('has correct name', () => {
      expect(planAction.name).toBe('__reasoning_preamble');
    });
  });

  describe('schema', () => {
    it('validates correct input', () => {
      const result = planAction.schema.safeParse({
        plan: 'I will search for information about AI.',
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty plan (schema allows any string)', () => {
      const result = planAction.schema.safeParse({ plan: '' });
      expect(result.success).toBe(true);
    });
  });

  describe('enabled', () => {
    it('is enabled for balanced mode', () => {
      expect(planAction.enabled({ mode: 'balanced' } as any)).toBe(true);
    });

    it('is enabled for quality mode', () => {
      expect(planAction.enabled({ mode: 'quality' } as any)).toBe(true);
    });

    it('is enabled for deep_research mode', () => {
      expect(planAction.enabled({ mode: 'deep_research' } as any)).toBe(true);
    });

    it('is disabled for speed mode', () => {
      expect(planAction.enabled({ mode: 'speed' } as any)).toBe(false);
    });
  });

  describe('execute', () => {
    it('returns reasoning type with the plan', async () => {
      const result = await planAction.execute!(
        { plan: 'Searching for information...' },
        {} as any,
      );
      expect(result.type).toBe('reasoning');
      expect(result.reasoning).toBe('Searching for information...');
    });
  });

  describe('getToolDescription', () => {
    it('returns a non-empty string', () => {
      const desc = planAction.getToolDescription();
      expect(typeof desc).toBe('string');
      expect(desc.length).toBeGreaterThan(0);
    });
  });

  describe('getDescription', () => {
    it('returns a non-empty string', () => {
      const desc = planAction.getDescription({} as any);
      expect(typeof desc).toBe('string');
      expect(desc.length).toBeGreaterThan(0);
    });
  });
});
