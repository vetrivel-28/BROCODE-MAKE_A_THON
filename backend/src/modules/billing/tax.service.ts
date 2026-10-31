import { CreateTaxInput, UpdateTaxInput, QueryTaxInput } from './tax.schema.js';

export interface TaxModel {
  id: string;
  tenantId: string;
  name: string;
  rate: number; // e.g. 18.00
  isInclusive: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LineForCalculation {
  quantity: number;
  unitPrice: number; // Paise
  discountAmount?: number; // Paise
  isTaxInclusive?: boolean;
}

export interface LineCalculationResult {
  net: number; // Paise
  taxAmount: number; // Paise
  gross: number; // Paise
}

// In-memory tax store (scoped by tenant) for fast indexed lookups and standalone tests
const taxDatabase = new Map<string, TaxModel>();

export class TaxService {
  /**
   * Half-up rounding helper to guarantee exact integer paise
   */
  public static roundHalfUp(value: number): number {
    return Math.round(value);
  }

  /**
   * Calculates net, taxAmount, and gross for an invoice line.
   * Handles both tax-inclusive and tax-exclusive items.
   * Guarantees: gross === net + taxAmount in integer paise.
   */
  public calculateLine(
    line: LineForCalculation,
    tax?: { rate: number; isInclusive?: boolean } | null
  ): LineCalculationResult {
    const quantity = Math.max(0, Math.floor(line.quantity));
    const unitPrice = Math.max(0, Math.floor(line.unitPrice));
    const discount = Math.max(0, Math.floor(line.discountAmount ?? 0));

    const totalBeforeDiscount = quantity * unitPrice;
    const effectiveAmount = Math.max(0, totalBeforeDiscount - discount);

    if (!tax || tax.rate <= 0) {
      return {
        net: effectiveAmount,
        taxAmount: 0,
        gross: effectiveAmount,
      };
    }

    const isInclusive = line.isTaxInclusive ?? tax.isInclusive ?? false;
    const rate = tax.rate; // e.g. 18

    if (isInclusive) {
      // Inclusive: effectiveAmount is the gross amount
      const gross = effectiveAmount;
      // taxAmount = round(gross * rate / (100 + rate))
      const taxAmount = TaxService.roundHalfUp((gross * rate) / (100 + rate));
      const net = gross - taxAmount;
      return { net, taxAmount, gross };
    } else {
      // Exclusive: effectiveAmount is the net amount
      const net = effectiveAmount;
      // taxAmount = round(net * (rate / 100))
      const taxAmount = TaxService.roundHalfUp((net * rate) / 100);
      const gross = net + taxAmount;
      return { net, taxAmount, gross };
    }
  }

  /**
   * List taxes with pagination and tenant filtering
   */
  public async getTaxes(
    tenantId: string,
    query: QueryTaxInput
  ): Promise<{ data: TaxModel[]; total: number; page: number; limit: number; totalPages: number }> {
    let taxes = Array.from(taxDatabase.values()).filter((t) => t.tenantId === tenantId);

    if (query.isActive !== undefined) {
      taxes = taxes.filter((t) => t.isActive === query.isActive);
    }

    if (query.search) {
      const s = query.search.toLowerCase();
      taxes = taxes.filter((t) => t.name.toLowerCase().includes(s));
    }

    // Sort by name
    taxes.sort((a, b) => a.name.localeCompare(b.name));

    const total = taxes.length;
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const start = (page - 1) * limit;
    const data = taxes.slice(start, start + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  public async getTaxById(tenantId: string, id: string): Promise<TaxModel | null> {
    const tax = taxDatabase.get(id);
    if (!tax || tax.tenantId !== tenantId) {
      return null;
    }
    return tax;
  }

  public async createTax(tenantId: string, input: CreateTaxInput): Promise<TaxModel> {
    const id = `tax_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const tax: TaxModel = {
      id,
      tenantId,
      name: input.name,
      rate: input.rate,
      isInclusive: input.isInclusive,
      isActive: input.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    taxDatabase.set(id, tax);
    return tax;
  }

  public async updateTax(tenantId: string, id: string, input: UpdateTaxInput): Promise<TaxModel | null> {
    const existing = await this.getTaxById(tenantId, id);
    if (!existing) {
      return null;
    }

    const updated: TaxModel = {
      ...existing,
      name: input.name !== undefined ? input.name : existing.name,
      rate: input.rate !== undefined ? input.rate : existing.rate,
      isInclusive: input.isInclusive !== undefined ? input.isInclusive : existing.isInclusive,
      isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
      updatedAt: new Date(),
    };

    taxDatabase.set(id, updated);
    return updated;
  }

  /**
   * Seed GST 5, 12, 18 for a given tenant
   */
  public async seedDefaultTaxes(tenantId: string): Promise<TaxModel[]> {
    const defaultRates = [
      { name: 'GST 5%', rate: 5.0, isInclusive: false },
      { name: 'GST 12%', rate: 12.0, isInclusive: false },
      { name: 'GST 18%', rate: 18.0, isInclusive: false },
    ];

    const seeded: TaxModel[] = [];
    for (const def of defaultRates) {
      // Check if already exists for this tenant
      const existing = Array.from(taxDatabase.values()).find(
        (t) => t.tenantId === tenantId && t.name === def.name
      );
      if (!existing) {
        const created = await this.createTax(tenantId, {
          name: def.name,
          rate: def.rate,
          isInclusive: def.isInclusive,
          isActive: true,
        });
        seeded.push(created);
      } else {
        seeded.push(existing);
      }
    }
    return seeded;
  }

  // Clear helper for tests
  public clearStore(): void {
    taxDatabase.clear();
  }
}

export const taxService = new TaxService();

