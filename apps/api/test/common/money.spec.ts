import { Decimal, roundMoney, sumMoney } from '../../src/common/money';
import { computeDiscountAmount } from '../../src/modules/discounts/discounts.service';

describe('roundMoney', () => {
  it('redondea half-up, no al par como el redondeo bancario', () => {
    expect(roundMoney('484.5', 0).toString()).toBe('485');
    expect(roundMoney('0.125', 2).toString()).toBe('0.13');
    expect(roundMoney('-484.5', 0).toString()).toBe('-485');
  });

  it('respeta los decimales de cada moneda', () => {
    expect(roundMoney('1234.567', 0).toString()).toBe('1235');
    expect(roundMoney('1234.565', 2).toString()).toBe('1234.57');
  });

  it('no arrastra errores de coma flotante', () => {
    expect(roundMoney(new Decimal('0.1').plus('0.2'), 2).toString()).toBe('0.3');
  });
});

describe('sumMoney', () => {
  it('ignora nulos', () => {
    expect(sumMoney(['1500', null, undefined, '-500']).toString()).toBe('1000');
  });
});

describe('computeDiscountAmount', () => {
  it('porcentaje redondeado a los decimales de la moneda', () => {
    const discount = { type: 'PERCENTAGE' as const, value: new Decimal(10) };
    expect(computeDiscountAmount(discount, '24545', 0).toString()).toBe('2455');
    expect(computeDiscountAmount(discount, '10.85', 2).toString()).toBe('1.09');
  });

  it('valor fijo nunca supera el total', () => {
    const discount = { type: 'FIXED' as const, value: new Decimal(5000) };
    expect(computeDiscountAmount(discount, '3000', 0).toString()).toBe('3000');
    expect(computeDiscountAmount(discount, '8000', 0).toString()).toBe('5000');
  });
});
