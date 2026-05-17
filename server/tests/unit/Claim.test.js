const mongoose = require('mongoose');
const { Claim, CLAIM_STATUSES } = require('../../src/models/Claim');

const validLlmOutputId = new mongoose.Types.ObjectId();

describe('Claim schema structure', () => {
  it('defines the claimText field as a String type', () => {
    expect(Claim.schema.path('claimText').instance).toBe('String');
  });

  it('defines the llmOutputId field as an ObjectId type', () => {
    expect(Claim.schema.path('llmOutputId').instance).toBe('ObjectId');
  });

  it('defines the extractedAt field as a Date type', () => {
    expect(Claim.schema.path('extractedAt').instance).toBe('Date');
  });

  it('defines the status field as a String type', () => {
    expect(Claim.schema.path('status').instance).toBe('String');
  });

  it('defines the categories field as an Array type', () => {
    expect(Claim.schema.path('categories').instance).toBe('Array');
  });

  it('defines the tags field as an Array type', () => {
    expect(Claim.schema.path('tags').instance).toBe('Array');
  });

  it('defines the metadata field as a Mixed type', () => {
    expect(Claim.schema.path('metadata').instance).toBe('Mixed');
  });

  it('includes createdAt in the schema paths', () => {
    expect(Object.keys(Claim.schema.paths)).toContain('createdAt');
  });

  it('includes updatedAt in the schema paths', () => {
    expect(Object.keys(Claim.schema.paths)).toContain('updatedAt');
  });
});

describe('Claim schema required fields', () => {
  it('marks claimText as required', () => {
    expect(Claim.schema.path('claimText').isRequired).toBe(true);
  });

  it('marks llmOutputId as required', () => {
    expect(Claim.schema.path('llmOutputId').isRequired).toBe(true);
  });

  it('marks extractedAt as required', () => {
    expect(Claim.schema.path('extractedAt').isRequired).toBe(true);
  });

  it('marks status as required', () => {
    expect(Claim.schema.path('status').isRequired).toBe(true);
  });
});

describe('Claim schema validation', () => {
  it('fails validation when claimText is missing', () => {
    const claim = new Claim({ llmOutputId: validLlmOutputId });
    const error = claim.validateSync();
    expect(error.errors.claimText).toBeDefined();
  });

  it('fails validation when llmOutputId is missing', () => {
    const claim = new Claim({ claimText: 'Some claim' });
    const error = claim.validateSync();
    expect(error.errors.llmOutputId).toBeDefined();
  });

  it('fails validation when status is not in the allowed enum values', () => {
    const claim = new Claim({ claimText: 'Some claim', llmOutputId: validLlmOutputId, status: 'invalid' });
    const error = claim.validateSync();
    expect(error.errors.status).toBeDefined();
  });

  it('passes validation when all required fields are present', () => {
    const claim = new Claim({ claimText: 'Some claim', llmOutputId: validLlmOutputId });
    const error = claim.validateSync();
    expect(error).toBeUndefined();
  });
});

describe('Claim schema defaults', () => {
  it('sets the default status to "new"', () => {
    const claim = new Claim({ claimText: 'Some claim', llmOutputId: validLlmOutputId });
    expect(claim.status).toBe('new');
  });

  it('sets the default categories to an empty array', () => {
    const claim = new Claim({ claimText: 'Some claim', llmOutputId: validLlmOutputId });
    expect(claim.categories).toEqual([]);
  });

  it('sets the default tags to an empty array', () => {
    const claim = new Claim({ claimText: 'Some claim', llmOutputId: validLlmOutputId });
    expect(claim.tags).toEqual([]);
  });

  it('sets the default metadata to an empty object', () => {
    const claim = new Claim({ claimText: 'Some claim', llmOutputId: validLlmOutputId });
    expect(claim.metadata).toEqual({});
  });
});

describe('Claim schema enum values', () => {
  it('exports the allowed CLAIM_STATUSES', () => {
    expect(CLAIM_STATUSES).toEqual(['new', 'verified', 'rejected']);
  });

  it('accepts "new" as a valid status', () => {
    const claim = new Claim({ claimText: 'Some claim', llmOutputId: validLlmOutputId, status: 'new' });
    expect(claim.validateSync()).toBeUndefined();
  });

  it('accepts "verified" as a valid status', () => {
    const claim = new Claim({ claimText: 'Some claim', llmOutputId: validLlmOutputId, status: 'verified' });
    expect(claim.validateSync()).toBeUndefined();
  });

  it('accepts "rejected" as a valid status', () => {
    const claim = new Claim({ claimText: 'Some claim', llmOutputId: validLlmOutputId, status: 'rejected' });
    expect(claim.validateSync()).toBeUndefined();
  });
});

describe('Claim creation with all required fields', () => {
  it('creates a Claim instance with all required fields populated', () => {
    const claimData = {
      claimText: 'The Earth is approximately 4.5 billion years old.',
      llmOutputId: validLlmOutputId,
      extractedAt: new Date('2026-05-17T10:00:00Z'),
      status: 'new',
    };

    const claim = new Claim(claimData);

    expect(claim.claimText).toBe(claimData.claimText);
    expect(claim.llmOutputId.toString()).toBe(validLlmOutputId.toString());
    expect(claim.extractedAt).toEqual(claimData.extractedAt);
    expect(claim.status).toBe('new');
  });

  it('creates a Claim instance with optional metadata fields', () => {
    const claim = new Claim({
      claimText: 'LLMs can hallucinate facts.',
      llmOutputId: validLlmOutputId,
      categories: ['AI', 'safety'],
      tags: ['hallucination', 'llm'],
      metadata: { confidence: 0.85, source: 'gpt-4' },
    });

    expect(claim.categories).toEqual(['AI', 'safety']);
    expect(claim.tags).toEqual(['hallucination', 'llm']);
    expect(claim.metadata).toEqual({ confidence: 0.85, source: 'gpt-4' });
  });
});
