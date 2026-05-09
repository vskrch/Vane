import { describe, it, expect } from 'vitest';

const { default: doneAction } = await import('../done');

describe('doneAction', () => {
  describe('name', () => {
    it('has correct name', () => {
      expect(doneAction.name).toBe('done');
    });
  });

  describe('schema', () => {
    it('validates empty object', () => {
      const result = doneAction.schema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('enabled', () => {
    it('is always enabled', () => {
      expect(doneAction.enabled({} as any)).toBe(true);
      expect(doneAction.enabled({ mode: 'speed' } as any)).toBe(true);
      expect(doneAction.enabled({ mode: 'deep_research' } as any)).toBe(true);
    });
  });

  describe('execute', () => {
    it('returns done type', async () => {
      const result = await doneAction.execute!({}, {} as any);
      expect(result.type).toBe('done');
    });
  });

  describe('getToolDescription', () => {
    it('returns a non-empty string', () => {
      const desc = doneAction.getToolDescription();
      expect(typeof desc).toBe('string');
      expect(desc.length).toBeGreaterThan(0);
    });
  });

  describe('getDescription', () => {
    it('returns a non-empty string', () => {
      const desc = doneAction.getDescription({} as any);
      expect(typeof desc).toBe('string');
      expect(desc.length).toBeGreaterThan(0);
    });
  });
});
