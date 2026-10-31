import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { taxService } from '../tax.service.js';

describe('Tax Calculation Engine', () => {
  it('calculates exclusive tax correctly with half-up rounding', () => {
    // 1 item @ Rs 100.00 (10000 paise), 18% exclusive tax
    const result = taxService.calculateLine(
      { quantity: 1, unitPrice: 10000 },
      { rate: 18, isInclusive: false }
    );

    assert.equal(result.net, 10000);
    assert.equal(result.taxAmount, 1800);
    assert.equal(result.gross, 11800);
    assert.equal(result.gross, result.net + result.taxAmount);
  });

  it('calculates inclusive tax correctly with half-up rounding', () => {
    // 1 item @ Rs 118.00 (11800 paise), 18% inclusive tax
    const result = taxService.calculateLine(
      { quantity: 1, unitPrice: 11800, isTaxInclusive: true },
      { rate: 18 }
    );

    // gross = 11800
    // tax = round(11800 * 18 / 118) = 1800
    // net = 11800 - 1800 = 10000
    assert.equal(result.gross, 11800);
    assert.equal(result.taxAmount, 1800);
    assert.equal(result.net, 10000);
    assert.equal(result.gross, result.net + result.taxAmount);
  });

  it('handles odd-paise rounding with half-up precision', () => {
    // 1 item @ Rs 10.00 (1000 paise), 18% inclusive tax
    // tax = round(1000 * 18 / 118) = round(152.542...) = 153 paise
    // net = 1000 - 153 = 847 paise
    const result = taxService.calculateLine(
      { quantity: 1, unitPrice: 1000, isTaxInclusive: true },
      { rate: 18 }
    );

    assert.equal(result.gross, 1000);
    assert.equal(result.taxAmount, 153);
    assert.equal(result.net, 847);
    assert.equal(result.gross, result.net + result.taxAmount);
  });

  it('handles odd-paise rounding in exclusive tax', () => {
    // 1 item @ Rs 8.47 (847 paise), 18% exclusive tax
    // tax = round(847 * 0.18) = round(152.46) = 152 paise
    // gross = 847 + 152 = 999 paise
    const result = taxService.calculateLine(
      { quantity: 1, unitPrice: 847 },
      { rate: 18, isInclusive: false }
    );

    assert.equal(result.net, 847);
    assert.equal(result.taxAmount, 152);
    assert.equal(result.gross, 999);
    assert.equal(result.gross, result.net + result.taxAmount);
  });

  it('handles discount before tax calculation', () => {
    // 2 items @ Rs 50.00 (5000 paise each = 10000 paise)
    // Discount = Rs 20.00 (2000 paise)
    // Net before tax = 10000 - 2000 = 8000 paise
    // Tax 12% exclusive = round(8000 * 0.12) = 960 paise
    // Gross = 8960 paise
    const result = taxService.calculateLine(
      { quantity: 2, unitPrice: 5000, discountAmount: 2000 },
      { rate: 12, isInclusive: false }
    );

    assert.equal(result.net, 8000);
    assert.equal(result.taxAmount, 960);
    assert.equal(result.gross, 8960);
    assert.equal(result.gross, result.net + result.taxAmount);
  });

  it('handles zero tax or null tax gracefully', () => {
    const result = taxService.calculateLine(
      { quantity: 3, unitPrice: 2500 },
      null
    );

    assert.equal(result.net, 7500);
    assert.equal(result.taxAmount, 0);
    assert.equal(result.gross, 7500);
  });
});

