import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchApi, orderApi, paymentApi } from '../../api';
import { usePaymentPoll } from '../../hooks';
import { extractError } from '../../utils/error';
import { colors, font, spacing, radius, shadows } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import Drawer from '../../components/ui/Drawer';
import type {
  RestaurantDetails,
  MenuItem,
  OrderQuoteResponse,
} from '../../types';

type PaymentMethod = 'wallet' | 'mpesa' | 'stripe';
type OrderType = 'delivery' | 'pickup';

interface CartLine {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

const PAYMENT_METHODS = [
  { label: 'DS Wallet', value: 'wallet' },
  { label: 'M-Pesa', value: 'mpesa' },
  { label: 'Card (Stripe)', value: 'stripe' },
];

function groupByCategory(menu: MenuItem[]): Array<[string, MenuItem[]]> {
  const map = new Map<string, MenuItem[]>();
  for (const item of menu) {
    const cat = item.category?.trim() || 'Menu';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(item);
  }
  return Array.from(map.entries());
}

export default function RestaurantDetail({ navigation, route }: any) {
  const idOrSlug = route?.params?.idOrSlug;

  const [data, setData] = useState<RestaurantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [cartOpen, setCartOpen] = useState(false);

  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [address, setAddress] = useState('');
  const [town, setTown] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [quote, setQuote] = useState<OrderQuoteResponse | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [payMessage, setPayMessage] = useState<string | null>(null);

  const { poll } = usePaymentPoll();

  useEffect(() => {
    if (!idOrSlug) {
      setLoadError('Missing restaurant reference.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchApi
      .restaurantDetails(idOrSlug)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setTown(res.restaurant.town ?? '');
      })
      .catch((err) => {
        if (!cancelled) setLoadError(extractError(err, 'Could not load this restaurant.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [idOrSlug]);

  const lines = useMemo(() => Object.values(cart), [cart]);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + (l.menuItem.discountPrice ?? l.menuItem.price) * l.quantity, 0),
    [lines]
  );

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines]
  );

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev[item._id];
      return {
        ...prev,
        [item._id]: {
          menuItem: item,
          quantity: (existing?.quantity ?? 0) + 1,
          notes: existing?.notes,
        },
      };
    });
  };

  const decrement = (itemId: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      const qty = existing.quantity - 1;
      const next = { ...prev };
      if (qty <= 0) delete next[itemId];
      else next[itemId] = { ...existing, quantity: qty };
      return next;
    });
  };

  const removeLine = (itemId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const clearCart = () => {
    setCart({});
    setQuote(null);
    setPayError(null);
    setPayMessage(null);
  };

  const resetQuote = () => {
    setQuote(null);
    setPayError(null);
    setPayMessage(null);
  };

  const handleQuote = async () => {
    if (!data) return;
    setQuoteError(null);
    setPayError(null);
    setPayMessage(null);

    if (lines.length === 0) {
      setQuoteError('Add at least one item.');
      return;
    }
    if (orderType === 'delivery' && (!address.trim() || !town.trim())) {
      setQuoteError('Add a delivery address and town.');
      return;
    }
    if (paymentMethod === 'mpesa' && !phone.trim()) {
      setQuoteError('Enter your M-Pesa phone number to continue.');
      return;
    }

    setQuoting(true);
    try {
      const q = await orderApi.quote({
        restaurantId: data.restaurant._id,
        items: lines.map((l) => ({
          menuItem: l.menuItem._id,
          quantity: l.quantity,
          notes: l.notes,
        })),
        type: orderType,
        deliveryAddress:
          orderType === 'delivery'
            ? { address: address.trim(), town: town.trim() }
            : null,
      });
      setQuote(q);
    } catch (err) {
      setQuoteError(extractError(err, 'Could not get a quote'));
    } finally {
      setQuoting(false);
    }
  };

  const handlePayAndPlace = async () => {
    if (!quote) return;

    if (paymentMethod === 'mpesa' && !phone.trim()) {
      setPayError('Enter your M-Pesa phone number.');
      return;
    }
    if (paymentMethod === 'stripe') {
      setPayError('Card payments are being set up. Please choose DS Wallet or M-Pesa for now.');
      return;
    }

    setPaying(true);
    setPayError(null);
    setPayMessage(null);

    try {
      const payment = await paymentApi.initiate({
        method: paymentMethod,
        amount: quote.total,
        currency: quote.currency,
        purpose: 'food_order',
        phone: paymentMethod === 'mpesa' ? phone : undefined,
      });

      if (paymentMethod === 'wallet') {
        if (payment.status !== 'success') {
          setPayError('Wallet payment failed. Check your balance.');
          return;
        }
      } else if (paymentMethod === 'mpesa') {
        setPayMessage('Check your phone and enter your M-Pesa PIN…');
        const result = await poll(payment.reference);
        if (!result.paid) {
          setPayError(result.message ?? 'Payment was not completed.');
          return;
        }
      }

      await orderApi.create({
        quoteId: quote.quoteId,
        paymentReference: payment.reference,
        notes: notes.trim() || undefined,
      });

      setCart({});
      setCartOpen(false);
      setQuote(null);
      setAddress('');
      setNotes('');
      navigation.replace('Order');
    } catch (err) {
      setPayError(extractError(err, 'Could not place order'));
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Spinner size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError || !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
          <Alert variant="danger" title="Restaurant unavailable">
            {loadError ?? 'Not found.'}
          </Alert>
          <Button
            title="Back to restaurants"
            variant="ghost"
            leftIcon={<Ionicons name="arrow-back" size={16} color={colors.text.primary} />}
            onPress={() => navigation.goBack()}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const { restaurant, menu } = data;
  const grouped = groupByCategory(menu);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
            <Ionicons name="arrow-back" size={16} color={colors.text.muted} />
            <Text style={styles.backText}>Back to restaurants</Text>
          </Pressable>

          <View style={styles.heroWrap}>
            {restaurant.coverImage ? (
              <Image source={{ uri: restaurant.coverImage }} style={styles.heroImage} />
            ) : (
              <View style={[styles.heroImage, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="restaurant-outline" size={48} color={colors.text.muted} />
              </View>
            )}
          </View>

          <View style={{ gap: spacing.xs }}>
            <Text style={styles.title}>{restaurant.name}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="location" size={12} color={colors.text.muted} />
                <Text style={styles.metaSmall}>{restaurant.town}</Text>
              </View>
              {restaurant.rating ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="star" size={12} color={colors.secondary[500]} />
                  <Text style={styles.metaSmall}>
                    {restaurant.rating.toFixed(1)}
                    {restaurant.totalRatings ? ` (${restaurant.totalRatings})` : ''}
                  </Text>
                </View>
              ) : null}
              {!restaurant.isAcceptingOrders ? (
                <Badge variant="danger">Not accepting orders</Badge>
              ) : null}
            </View>
          </View>

          {menu.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="restaurant-outline" size={24} color={colors.text.muted} />
              <Text style={styles.metaSmall}>This restaurant hasn't added any menu items yet.</Text>
            </View>
          ) : (
            grouped.map(([category, items]) => (
              <View key={category} style={styles.card}>
                <Text style={styles.categoryTitle}>{category}</Text>
                <View style={{ height: 1, backgroundColor: colors.border, marginTop: spacing.sm }} />
                {items.map((item) => {
                  const qty = cart[item._id]?.quantity ?? 0;
                  const price = item.discountPrice ?? item.price;
                  return (
                    <View key={item._id} style={styles.menuRow}>
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.menuImage} />
                      ) : (
                        <View style={[styles.menuImage, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                          <Ionicons name="restaurant-outline" size={20} color={colors.text.muted} />
                        </View>
                      )}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.menuName} numberOfLines={1}>{item.name}</Text>
                        {item.description ? (
                          <Text style={styles.metaSmall} numberOfLines={2}>{item.description}</Text>
                        ) : null}
                        <Text style={{ fontSize: font.sm, fontWeight: '600', color: colors.text.primary, marginTop: 4 }}>
                          {formatCurrency(price, item.currency || 'KES')}
                          {item.discountPrice ? (
                            <Text style={{ fontSize: 10, color: colors.text.muted, textDecorationLine: 'line-through' }}>
                              {'  '}{formatCurrency(item.price, item.currency || 'KES')}
                            </Text>
                          ) : null}
                        </Text>
                      </View>
                      <View style={{ justifyContent: 'center' }}>
                        {qty === 0 ? (
                          <Pressable
                            onPress={() => addToCart(item)}
                            disabled={!restaurant.isAcceptingOrders}
                            style={[styles.addBtn, !restaurant.isAcceptingOrders && { opacity: 0.5 }]}
                          >
                            <Text style={styles.addBtnText}>Add</Text>
                          </Pressable>
                        ) : (
                          <View style={styles.qtyRow}>
                            <Pressable onPress={() => decrement(item._id)} style={styles.qtyBtn}>
                              <Ionicons name="remove" size={14} color={colors.text.primary} />
                            </Pressable>
                            <Text style={styles.qtyText}>{qty}</Text>
                            <Pressable onPress={() => addToCart(item)} style={styles.qtyBtn}>
                              <Ionicons name="add" size={14} color={colors.text.primary} />
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}

          {lines.length > 0 ? (
            <View style={styles.cartFooter}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.metaSmall}>{itemCount} item{itemCount === 1 ? '' : 's'}</Text>
                <Text style={{ fontSize: font.md, fontWeight: '700', color: colors.text.primary }}>
                  {formatCurrency(subtotal, 'KES')}
                </Text>
              </View>
              <Button
                title="Checkout"
                onPress={() => setCartOpen(true)}
                disabled={!restaurant.isAcceptingOrders}
                rightIcon={<Ionicons name="arrow-forward" size={14} color={colors.white} />}
              />
            </View>
          ) : null}

          <View style={{ height: spacing['3xl'] }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Drawer
        isOpen={cartOpen}
        onClose={() => {
          if (paying) return;
          setCartOpen(false);
          if (!quote) resetQuote();
        }}
        title={quote ? 'Confirm payment' : 'Checkout'}
      >
        {!quote ? (
          <View style={{ gap: spacing.md }}>
            <View>
              <Text style={styles.metaSmall}>Order type</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4 }}>
                <Pressable
                  onPress={() => setOrderType('delivery')}
                  style={[styles.typeBtn, orderType === 'delivery' && styles.typeBtnActive]}
                >
                  <Text style={[styles.typeBtnText, orderType === 'delivery' && { color: colors.secondary[700] }]}>
                    Delivery
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setOrderType('pickup')}
                  style={[styles.typeBtn, orderType === 'pickup' && styles.typeBtnActive]}
                >
                  <Text style={[styles.typeBtnText, orderType === 'pickup' && { color: colors.secondary[700] }]}>
                    Pickup
                  </Text>
                </Pressable>
              </View>
            </View>

            {orderType === 'delivery' ? (
              <View style={{ gap: spacing.sm }}>
                <Input
                  label="Delivery address"
                  placeholder="e.g. Kilimani, Wood Ave 12"
                  value={address}
                  onChangeText={setAddress}
                />
                <Input
                  label="Town"
                  placeholder="Nairobi"
                  value={town}
                  onChangeText={setTown}
                />
              </View>
            ) : null}

            <Select
              label="Payment method"
              value={paymentMethod}
              onChange={(v) => setPaymentMethod(v as PaymentMethod)}
              options={PAYMENT_METHODS}
            />

            {paymentMethod === 'mpesa' ? (
              <View>
                <Input
                  label="M-Pesa phone number"
                  placeholder="254712345678"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
                <Text style={[styles.metaSmall, { marginTop: 4 }]}>
                  Enter the Safaricom number registered with M-Pesa.
                </Text>
              </View>
            ) : null}

            {paymentMethod === 'stripe' ? (
              <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md }}>
                <Text style={styles.metaSmall}>
                  Card payments are being set up. Please choose DS Wallet or M-Pesa for now.
                </Text>
              </View>
            ) : null}

            <Input
              label="Notes (optional)"
              placeholder="Anything the kitchen should know?"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            {quoteError ? (
              <Alert variant="danger" title="Cannot continue">{quoteError}</Alert>
            ) : null}

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Cancel"
                  variant="ghost"
                  onPress={() => setCartOpen(false)}
                  disabled={quoting}
                  fullWidth
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Continue to payment" onPress={handleQuote} loading={quoting} fullWidth />
              </View>
            </View>

            <View style={{ marginTop: spacing.sm }}>
              <Button title="Clear cart" variant="ghost" onPress={clearCart} disabled={paying || quoting} fullWidth />
            </View>

            <View style={styles.cartList}>
              <Text style={styles.categoryTitle}>Your cart</Text>
              {lines.map((l) => {
                const price = l.menuItem.discountPrice ?? l.menuItem.price;
                return (
                  <View key={l.menuItem._id} style={styles.cartLine}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.menuName} numberOfLines={1}>
                        {l.quantity}× {l.menuItem.name}
                      </Text>
                      <Text style={styles.metaSmall}>{formatCurrency(price * l.quantity, 'KES')}</Text>
                    </View>
                    <Pressable onPress={() => removeLine(l.menuItem._id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={14} color={colors.danger} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            <View style={styles.lockedBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#15803D" />
              <Text style={styles.lockedText}>
                Price locked · expires {new Date(quote.expiresAt).toLocaleTimeString()}
              </Text>
            </View>

            <View style={styles.methodBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaSmall}>Payment method</Text>
                <Text style={{ fontSize: font.sm, fontWeight: '600', color: colors.text.primary }}>
                  {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label ?? '—'}
                </Text>
                {paymentMethod === 'mpesa' && phone ? (
                  <Text style={styles.metaSmall}>To: {phone}</Text>
                ) : null}
              </View>
              <Pressable onPress={resetQuote} disabled={paying}>
                <Text style={styles.changeLink}>Change</Text>
              </Pressable>
            </View>

            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.metaSmall}>Subtotal</Text>
                <Text style={styles.metaSmall}>{formatCurrency(quote.subtotal, quote.currency)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.metaSmall}>Delivery</Text>
                <Text style={styles.metaSmall}>{formatCurrency(quote.deliveryFee, quote.currency)}</Text>
              </View>
              <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.xs }]}>
                <Text style={{ fontSize: font.md, fontWeight: '700', color: colors.text.primary }}>Total</Text>
                <Text style={{ fontSize: font.md, fontWeight: '700', color: colors.secondary[600] }}>
                  {formatCurrency(quote.total, quote.currency)}
                </Text>
              </View>
            </View>

            {payMessage ? (
              <Alert variant="info" title="Processing">{payMessage}</Alert>
            ) : null}
            {payError ? (
              <Alert variant="danger" title="Payment failed">{payError}</Alert>
            ) : null}

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button title="Back" variant="ghost" onPress={resetQuote} disabled={paying} fullWidth />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title={paying ? 'Processing…' : `Pay ${formatCurrency(quote.total, quote.currency)}`}
                  onPress={handlePayAndPlace}
                  loading={paying}
                  fullWidth
                />
              </View>
            </View>
          </View>
        )}
      </Drawer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.lg },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: font.xs, color: colors.text.muted },
  heroWrap: { borderRadius: radius.lg, overflow: 'hidden' },
  heroImage: { width: '100%', height: 200 },
  title: { fontSize: font['2xl'], fontWeight: '700', color: colors.text.primary, letterSpacing: -0.4 },
  metaSmall: { fontSize: font.xs, color: colors.text.muted },
  emptyBox: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing['2xl'], alignItems: 'center', gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, ...shadows.card,
  },
  categoryTitle: { fontSize: font.md, fontWeight: '700', color: colors.text.primary },
  menuRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuImage: { width: 72, height: 72, borderRadius: radius.md },
  menuName: { fontSize: font.sm, fontWeight: '700', color: colors.text.primary },
  addBtn: {
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md,
    backgroundColor: colors.secondary[500],
  },
  addBtnText: { fontSize: font.xs, fontWeight: '600', color: colors.white },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  qtyBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  qtyText: { minWidth: 24, textAlign: 'center', fontSize: font.sm, fontWeight: '600' },
  cartFooter: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
    marginTop: spacing.md,
  },
  typeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  typeBtnActive: { borderColor: colors.secondary[500], backgroundColor: colors.secondary[50] },
  typeBtnText: { fontSize: font.sm, fontWeight: '600', color: colors.text.primary },
  lockedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(34,197,94,0.08)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md,
  },
  lockedText: { fontSize: font.xs, color: '#15803D', fontWeight: '600' },
  methodBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md,
  },
  changeLink: { fontSize: font.xs, fontWeight: '600', color: colors.secondary[600], textDecorationLine: 'underline' },
  summaryBox: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cartList: { marginTop: spacing.md, gap: spacing.sm },
  cartLine: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm,
  },
});