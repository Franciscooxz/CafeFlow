import { CreateOrderDto, OrderItemDto } from '../../src/modules/pos/dto/create-order.dto';
import { Cafe } from './factory';

export function orderDto(
  cafe: Cafe,
  items: OrderItemDto[],
  extra: Partial<CreateOrderDto> = {},
): CreateOrderDto {
  return {
    storeId: cafe.store.id,
    shiftId: cafe.shift.id,
    paymentMethod: 'CASH',
    items,
    ...extra,
  };
}
