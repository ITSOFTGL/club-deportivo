'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useCartStore, unitPrice } from '@/store/cartStore';
import ordersApi from '@/lib/api/orders';
import { useBranchesStore } from '@/store/branchesStore';
import { useStudentsStore } from '@/store/studentsStore';
import { resolveMediaUrl } from '@/lib/utils/mediaUrl';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: Props) {
  const { data: session } = useSession();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const { branches, fetchBranches } = useBranchesStore();
  const { students, fetchStudents } = useStudentsStore();

  const [deliveryMethod, setDeliveryMethod] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [pickupBranchId, setPickupBranchId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR'>('CASH');
  const [studentId, setStudentId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBranches();
      if (session?.user?.role === 'PARENT') fetchStudents();
    }
  }, [isOpen, session?.user?.role]);

  const subtotal = items.reduce((s, i) => s + unitPrice(i) * i.quantity, 0);
  const shippingCost = deliveryMethod === 'DELIVERY' ? 15 : 0;
  const total = subtotal + shippingCost;

  const myStudents =
    session?.user?.role === 'PARENT'
      ? students
      : students.filter(() => false);

  const submit = async (mode: 'PAY' | 'RESERVE') => {
    if (!items.length) {
      toast.error('Carrito vacío');
      return;
    }
    if (deliveryMethod === 'PICKUP' && !pickupBranchId) {
      toast.error('Seleccione sucursal de retiro');
      return;
    }
    if (deliveryMethod === 'DELIVERY' && !deliveryAddress.trim()) {
      toast.error('Ingrese dirección de envío');
      return;
    }
    if (paymentMethod === 'CASH' && deliveryMethod === 'DELIVERY') {
      toast.error('Efectivo solo disponible para retiro en sede');
      return;
    }

    setSubmitting(true);
    try {
      await ordersApi.create({
        buyerName: session?.user?.name || 'Cliente',
        buyerEmail: session?.user?.email || '',
        buyerPhone: session?.user?.phone || '0000000',
        studentId: studentId || undefined,
        deliveryMethod,
        pickupBranchId: deliveryMethod === 'PICKUP' ? pickupBranchId : undefined,
        deliveryAddress: deliveryMethod === 'DELIVERY' ? deliveryAddress : undefined,
        shippingCost,
        paymentMethod,
        mode,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
          customization:
            i.customName || i.customNumber
              ? `Nombre: ${i.customName ?? ''}, Número: ${i.customNumber ?? ''}`
              : undefined,
        })),
      });
      toast.success(
        mode === 'RESERVE'
          ? 'Reserva creada — tiene 48 h para pagar'
          : 'Orden registrada — pendiente de confirmación de pago',
      );
      clear();
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Error al procesar la orden';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold mb-4">Checkout</Dialog.Title>

          {items.length === 0 ? (
            <p className="text-gray-500 text-sm">Tu carrito está vacío</p>
          ) : (
            <>
              <ul className="space-y-3 mb-4 border-b pb-4">
                {items.map((item) => {
                  const img = resolveMediaUrl(item.product.mainImage);
                  return (
                    <li key={`${item.productId}-${item.size}`} className="flex gap-3 text-sm">
                      {img && (
                        <img src={img} alt="" className="w-12 h-12 rounded object-cover" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        {item.size && <p className="text-xs text-gray-500">Talla: {item.size}</p>}
                        {item.customName && (
                          <p className="text-xs text-gray-500">
                            {item.customName} #{item.customNumber}
                          </p>
                        )}
                        <p>Bs. {(unitPrice(item) * item.quantity).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="px-2 border rounded"
                            onClick={() => updateQty(item.productId, item.size, -1)}
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            className="px-2 border rounded"
                            onClick={() => updateQty(item.productId, item.size, 1)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="text-xs text-red-600"
                          onClick={() => removeItem(item.productId, item.size)}
                        >
                          Quitar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {myStudents.length > 0 && (
                <div className="mb-3">
                  <label className="text-sm font-medium">Alumno (opcional)</label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">—</option>
                    {myStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-3">
                <label className="text-sm font-medium">Entrega</label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('PICKUP')}
                    className={`flex-1 py-2 rounded-lg border text-sm ${
                      deliveryMethod === 'PICKUP' ? 'border-[#7c0613] bg-[#7c0613]/10' : ''
                    }`}
                  >
                    Retiro en sede
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('DELIVERY')}
                    className={`flex-1 py-2 rounded-lg border text-sm ${
                      deliveryMethod === 'DELIVERY' ? 'border-[#7c0613] bg-[#7c0613]/10' : ''
                    }`}
                  >
                    Envío (+ Bs. 15)
                  </button>
                </div>
              </div>

              {deliveryMethod === 'PICKUP' ? (
                <select
                  value={pickupBranchId}
                  onChange={(e) => setPickupBranchId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
                >
                  <option value="">Sucursal de retiro</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              ) : (
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Dirección completa, ciudad y referencia"
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
                  rows={2}
                />
              )}

              <div className="mb-4">
                <label className="text-sm font-medium">Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'QR')}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="CASH">Efectivo (solo retiro)</option>
                  <option value="QR">QR / Transferencia</option>
                </select>
              </div>

              <div className="text-sm space-y-1 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Bs. {subtotal.toLocaleString()}</span>
                </div>
                {shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span>Envío</span>
                    <span>Bs. {shippingCost.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>Bs. {total.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => submit('PAY')}
                  className="w-full py-2 bg-[#7c0613] text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {submitting ? 'Procesando...' : 'Confirmar compra'}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => submit('RESERVE')}
                  className="w-full py-2 border border-[#7c0613] text-[#7c0613] rounded-lg font-medium disabled:opacity-50"
                >
                  Reservar 48 h sin pago
                </button>
              </div>
            </>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
