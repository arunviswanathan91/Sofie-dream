import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, Switch, Alert, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { format, addDays } from 'date-fns';
import { useOrders } from '../../hooks/useOrders';
import { useCategories } from '../../hooks/useCategories';
import { useTheme } from '../../context/ThemeContext';
import { TagChip } from '../../components/TagChip';
import type { OrderItem } from '../../types';
import { generateId } from '../../lib/localStore';
import { useInventory } from '../../context/InventoryContext';

const CURRENCIES = ['EUR', 'GBP', 'USD', 'CHF', 'INR'];
const PRESET_TAGS = ['rush', 'custom', 'gift', 'large', 'repeat customer'];

interface FormState {
  orderName: string; description: string; craftCategory: string;
  tags: string[]; photos: string[]; sourceLink: string;
  customerName: string; customerAddress: string; customerPhone: string;
  customerInstagram: string; deliveryTime: string; askingPrice: string;
  currency: string; isPaid: boolean; paymentNotes: string;
  dueDateText: string; internalNotes: string;
  completionPercent: number;
}

const INITIAL: FormState = {
  orderName: '', description: '', craftCategory: '', tags: [], photos: [],
  sourceLink: '', customerName: '', customerAddress: '', customerPhone: '',
  customerInstagram: '', deliveryTime: '', askingPrice: '', currency: 'EUR',
  isPaid: false, paymentNotes: '',
  dueDateText: format(addDays(new Date(), 7), 'yyyy-MM-dd'), internalNotes: '',
  completionPercent: 0,
};

export default function NewOrderScreen() {
  const router = useRouter();
  const { addOrder } = useOrders();
  const insets = useSafeAreaInsets();
  const { categories } = useCategories();
  const { colors } = useTheme();
  const { products: inventoryProducts, addProduct } = useInventory();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [customTag, setCustomTag] = useState('');
  const [saving, setSaving] = useState(false);

  // Multiple order items
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');

  // Item edit state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemQty, setEditItemQty] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemName, setEditItemName] = useState('');

  const set = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
  }, []);

  const addTag = useCallback((tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t) setForm((p) => ({ ...p, tags: p.tags.includes(t) ? p.tags : [...p.tags, t] }));
  }, []);

  const pickPhoto = useCallback(async () => {
    if (form.photos.length >= 5) { Alert.alert('Max 5 photos'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!r.canceled && r.assets[0]) set('photos', [...form.photos, r.assets[0].uri]);
  }, [form.photos, set]);

  const recalcTotal = useCallback((items: OrderItem[]) => {
    const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    if (total > 0) setForm((p) => ({ ...p, askingPrice: total.toFixed(2) }));
  }, []);

  const addItem = useCallback(() => {
    const name = newItemName.trim();
    if (!name) { Alert.alert('Required', 'Item name is required.'); return; }
    const qty = Math.max(1, parseInt(newItemQty) || 1);
    const price = parseFloat(newItemPrice) || 0;
    // Use null instead of undefined — Firestore rejects undefined
    const item: OrderItem = { id: generateId(), name, description: newItemDesc.trim() || undefined, quantity: qty, price };
    setOrderItems((prev) => {
      const next = [...prev, item];
      recalcTotal(next);
      return next;
    });
    setNewItemName('');
    setNewItemDesc('');
    setNewItemQty('1');
    setNewItemPrice('');
    setShowAddItem(false);
  }, [newItemName, newItemDesc, newItemQty, newItemPrice, recalcTotal]);

  // Add an inventory product as an order item
  const addInventoryChip = useCallback((productId: string) => {
    const product = inventoryProducts.find((p) => p.id === productId);
    if (!product) return;
    // Check if already added
    const existing = orderItems.find((i) => i.name === product.name);
    if (existing) {
      // Increment quantity
      setOrderItems((prev) => {
        const next = prev.map((i) => i.name === product.name ? { ...i, quantity: i.quantity + 1 } : i);
        recalcTotal(next);
        return next;
      });
    } else {
      const item: OrderItem = {
        id: generateId(),
        name: product.name,
        description: undefined,
        quantity: 1,
        price: product.suggestedPrice,
      };
      setOrderItems((prev) => {
        const next = [...prev, item];
        recalcTotal(next);
        return next;
      });
    }
  }, [inventoryProducts, orderItems, recalcTotal]);

  const removeItem = useCallback((id: string) => {
    setOrderItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      recalcTotal(next);
      return next;
    });
  }, [recalcTotal]);

  const startEditItem = useCallback((item: OrderItem) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemQty(String(item.quantity));
    setEditItemPrice(String(item.price));
    setShowAddItem(false);
  }, []);

  const saveEditItem = useCallback(() => {
    if (!editingItemId) return;
    setOrderItems((prev) => {
      const next = prev.map((i) => {
        if (i.id !== editingItemId) return i;
        return {
          ...i,
          name: editItemName.trim() || i.name,
          quantity: Math.max(1, parseInt(editItemQty) || 1),
          price: parseFloat(editItemPrice) || i.price,
        };
      });
      recalcTotal(next);
      return next;
    });
    setEditingItemId(null);
  }, [editingItemId, editItemName, editItemQty, editItemPrice, recalcTotal]);

  const parsedDue = (() => { const d = new Date(form.dueDateText); return isNaN(d.getTime()) ? addDays(new Date(), 7) : d; })();

  const save = useCallback(async () => {
    Keyboard.dismiss();
    if (!form.orderName.trim()) { Alert.alert('Required', 'Order name is required.'); return; }
    if (!form.customerName.trim()) { Alert.alert('Required', 'Customer name is required.'); return; }
    setSaving(true);
    try {
      const id = await addOrder({
        orderName: form.orderName.trim(),
        description: form.description.trim(),
        craftCategory: form.craftCategory,
        tags: form.tags,
        photos: form.photos,
        sourceLink: form.sourceLink.trim() || undefined,
        orderItems: orderItems.length > 0 ? orderItems : undefined,
        customerName: form.customerName.trim(),
        customerAddress: form.customerAddress.trim(),
        deliveryTime: form.deliveryTime.trim(),
        customerPhone: form.customerPhone.trim() || undefined,
        customerInstagram: form.customerInstagram.trim() || undefined,
        askingPrice: parseFloat(form.askingPrice) || 0,
        currency: form.currency,
        isPaid: form.isPaid,
        paymentNotes: form.paymentNotes.trim() || undefined,
        dueDate: parsedDue,
        internalNotes: form.internalNotes.trim() || undefined,
        completionPercent: form.completionPercent,
      });

      // After saving, check for items not in inventory
      const inventoryNames = inventoryProducts.map((p) => p.name.toLowerCase());
      const newItems = orderItems.filter(
        (item) => !inventoryNames.some((n) => n === item.name.toLowerCase())
      );
      if (newItems.length > 0) {
        const names = newItems.map((i) => `"${i.name}"`).join(', ');
        Alert.alert(
          'Add to Inventory?',
          `${names} ${newItems.length === 1 ? 'is' : 'are'} not in your inventory. Add ${newItems.length === 1 ? 'it' : 'them'} now?`,
          [
            { text: 'Not now', style: 'cancel', onPress: () => router.replace(`/order/${id}`) },
            {
              text: 'Add to Inventory',
              onPress: async () => {
                for (const item of newItems) {
                  await addProduct({
                    name: item.name,
                    description: undefined,
                    category: undefined,
                    emoji: '🧶',
                    materials: [],
                    markup: 1.5,
                    notes: `Added from order: ${form.orderName}`,
                    remindInterval: undefined,
                    remindUnit: undefined,
                    nextReminderDate: undefined,
                  });
                }
                router.replace(`/order/${id}`);
              },
            },
          ]
        );
      } else {
        router.replace(`/order/${id}`);
      }
    } catch (e) {
      Alert.alert('Error', `Could not save: ${(e as Error).message}`);
      setSaving(false);
    }
  }, [form, parsedDue, orderItems, addOrder, addProduct, inventoryProducts, router]);

  const itemsTotal = orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0);

  // Find matching inventory product by name (soft match) for price warning
  const inventoryMatch = useMemo(() => {
    if (!form.orderName.trim()) return null;
    const q = form.orderName.trim().toLowerCase();
    return inventoryProducts.find((p) => p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase())) ?? null;
  }, [form.orderName, inventoryProducts]);
  const inventorySuggestedPrice = inventoryMatch?.suggestedPrice ?? 0;
  const askingPriceNum = parseFloat(form.askingPrice) || 0;
  const inventoryWarning = inventoryMatch && askingPriceNum > 0 && askingPriceNum < inventorySuggestedPrice;

  const c = colors; // shorthand

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: c.bg }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={[s.cancel, { color: c.subText }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: c.primary }]}>New Order</Text>
        <TouchableOpacity onPress={save} style={[s.saveBtn, { backgroundColor: c.primaryContainer }, saving && { opacity: 0.5 }]} disabled={saving}>
          <Text style={[s.saveTxt, { color: c.onPrimary }]}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>

          <Block title="Order Details" colors={c}>
            <F label="Order Name *" colors={c}><TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text }]} value={form.orderName} onChangeText={(v) => set('orderName', v)} placeholder="e.g. Floral Hoodie Set" placeholderTextColor={c.outline} /></F>
            <F label="Description" colors={c}><TextInput style={[s.input, s.multi, { backgroundColor: c.surfaceLow, color: c.text }]} value={form.description} onChangeText={(v) => set('description', v)} placeholder="Describe the order…" placeholderTextColor={c.outline} multiline numberOfLines={3} textAlignVertical="top" /></F>

            <F label="Craft Category" colors={c}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {categories.map((cat) => (
                  <TagChip key={cat.id} label={`${cat.emoji} ${cat.name}`}
                    selected={form.craftCategory === cat.name}
                    onPress={() => set('craftCategory', form.craftCategory === cat.name ? '' : cat.name)}
                    color={form.craftCategory === cat.name ? cat.color : undefined} />
                ))}
              </ScrollView>
            </F>

            <F label="Tags" colors={c}>
              <View style={s.tagsWrap}>
                {form.tags.map((t) => <TagChip key={t} label={t} onRemove={() => set('tags', form.tags.filter((x) => x !== t))} />)}
                {PRESET_TAGS.filter((t) => !form.tags.includes(t)).map((t) => <TagChip key={t} label={`+ ${t}`} onPress={() => addTag(t)} />)}
              </View>
              <View style={s.row}>
                <TextInput style={[s.input, { flex: 1, marginBottom: 0, backgroundColor: c.surfaceLow, color: c.text }]} value={customTag} onChangeText={setCustomTag} placeholder="Custom tag…" placeholderTextColor={c.outline} returnKeyType="done" onSubmitEditing={() => { addTag(customTag); setCustomTag(''); }} />
                <TouchableOpacity style={[s.addBtn, { backgroundColor: c.primaryContainer }]} onPress={() => { addTag(customTag); setCustomTag(''); }}><Text style={[s.addTxt, { color: c.onPrimary }]}>Add</Text></TouchableOpacity>
              </View>
            </F>

            <F label={`Photos (${form.photos.length}/5)`} colors={c}>
              <TouchableOpacity style={[s.photoBtn, { backgroundColor: c.surfaceLow, borderColor: c.outlineVariant }]} onPress={pickPhoto}><Text style={[s.photoBtnTxt, { color: c.primary }]}>{form.photos.length === 0 ? '📎  Attach photos' : `📎  ${form.photos.length} attached — add more`}</Text></TouchableOpacity>
            </F>
            <F label="Source Link (optional)" colors={c}><TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text }]} value={form.sourceLink} onChangeText={(v) => set('sourceLink', v)} placeholder="Instagram / WhatsApp link" placeholderTextColor={c.outline} autoCapitalize="none" keyboardType="url" /></F>
          </Block>

          {/* Order Items */}
          <Block title="Order Items" colors={c}>
            <Text style={[s.hint, { color: c.primaryContainer }]}>Tap inventory items below to add them, or create custom items manually.</Text>

            {/* Inventory quick-add chips */}
            {inventoryProducts.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={[s.chipSectionLabel, { color: c.subText }]}>From Inventory</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                  {inventoryProducts.map((product) => {
                    const currency = product.materials[0]?.currency ?? 'INR';
                    return (
                      <TouchableOpacity
                        key={product.id}
                        style={[s.inventoryChip, { backgroundColor: c.surfaceContainer, borderColor: c.outlineVariant }]}
                        onPress={() => addInventoryChip(product.id)}
                      >
                        <Text style={{ fontSize: 16 }}>{product.emoji ?? '🧶'}</Text>
                        <View style={{ marginLeft: 6 }}>
                          <Text style={[s.inventoryChipName, { color: c.text }]}>{product.name}</Text>
                          <Text style={[s.inventoryChipPrice, { color: c.primary }]}>{currency} {product.suggestedPrice.toFixed(0)}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Added items */}
            {orderItems.map((item) => (
              <View key={item.id}>
                {editingItemId === item.id ? (
                  // Inline edit form
                  <View style={[s.editItemForm, { backgroundColor: c.surfaceContainer }]}>
                    <F label="Name" colors={c}>
                      <TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text, marginBottom: 8 }]} value={editItemName} onChangeText={setEditItemName} placeholderTextColor={c.outline} />
                    </F>
                    <View style={s.row}>
                      <View style={{ flex: 1 }}>
                        <F label="Qty" colors={c}><TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text, marginBottom: 0 }]} value={editItemQty} onChangeText={setEditItemQty} keyboardType="number-pad" /></F>
                      </View>
                      <View style={{ flex: 2 }}>
                        <F label="Price each" colors={c}><TextInput style={[s.input, s.priceInput, { backgroundColor: c.surfaceLow, color: c.text, marginBottom: 0 }]} value={editItemPrice} onChangeText={setEditItemPrice} keyboardType="decimal-pad" /></F>
                      </View>
                    </View>
                    <View style={s.row}>
                      <TouchableOpacity style={[s.addBtn, { flex: 1, backgroundColor: c.primaryContainer }]} onPress={saveEditItem}>
                        <Text style={[s.addTxt, { color: c.onPrimary }]}>Done</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.addBtn, { flex: 1, backgroundColor: c.surfaceHigh }]} onPress={() => setEditingItemId(null)}>
                        <Text style={[s.addTxt, { color: c.subText }]}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={[s.itemRow, { borderBottomColor: c.outlineVariant }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.itemName, { color: c.text }]}>{item.name}</Text>
                      {item.description ? <Text style={[s.itemDesc, { color: c.subText }]}>{item.description}</Text> : null}
                      <Text style={[s.itemMeta, { color: c.subText }]}>{item.quantity}× · {form.currency} {(item.price).toFixed(2)} each</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={[s.itemTotal, { color: c.primary }]}>{form.currency} {(item.price * item.quantity).toFixed(2)}</Text>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity onPress={() => startEditItem(item)}>
                          <Text style={{ color: c.primary, fontSize: 12, fontFamily: 'DMSans' }}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeItem(item.id)}>
                          <Text style={{ color: colors.error, fontSize: 12, fontFamily: 'DMSans' }}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))}

            {orderItems.length > 0 && (
              <View style={[s.itemsSummary, { borderTopColor: c.outlineVariant }]}>
                <Text style={[s.itemsSummaryLabel, { color: c.subText }]}>Items Total</Text>
                <Text style={[s.itemsSummaryValue, { color: c.primary }]}>{form.currency} {itemsTotal.toFixed(2)}</Text>
              </View>
            )}

            {showAddItem ? (
              <View style={[s.addItemForm, { backgroundColor: c.surfaceContainer }]}>
                <F label="Item Name *" colors={c}><TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text }]} value={newItemName} onChangeText={setNewItemName} placeholder="e.g. Hand-knit scarf" placeholderTextColor={c.outline} /></F>
                <F label="Description (optional)" colors={c}><TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text }]} value={newItemDesc} onChangeText={setNewItemDesc} placeholder="Details…" placeholderTextColor={c.outline} /></F>
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <F label="Qty" colors={c}><TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text }]} value={newItemQty} onChangeText={setNewItemQty} keyboardType="number-pad" placeholder="1" placeholderTextColor={c.outline} /></F>
                  </View>
                  <View style={{ flex: 2 }}>
                    <F label="Price each" colors={c}><TextInput style={[s.input, s.priceInput, { backgroundColor: c.surfaceLow, color: c.text }]} value={newItemPrice} onChangeText={setNewItemPrice} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={c.outline} /></F>
                  </View>
                </View>
                <View style={s.row}>
                  <TouchableOpacity style={[s.addBtn, { flex: 1, backgroundColor: c.primaryContainer }]} onPress={addItem}><Text style={[s.addTxt, { color: c.onPrimary }]}>Add Item</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.addBtn, { backgroundColor: c.surfaceHigh, flex: 1 }]} onPress={() => setShowAddItem(false)}><Text style={[s.addTxt, { color: c.subText }]}>Cancel</Text></TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={[s.photoBtn, { backgroundColor: c.surfaceLow, borderColor: c.outlineVariant }]} onPress={() => setShowAddItem(true)}>
                <Text style={[s.photoBtnTxt, { color: c.primary }]}>+ Add Custom Item</Text>
              </TouchableOpacity>
            )}
          </Block>

          <Block title="Customer Info" colors={c}>
            <F label="Customer Name *" colors={c}><TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text }]} value={form.customerName} onChangeText={(v) => set('customerName', v)} placeholder="Emma Kowalski" placeholderTextColor={c.outline} /></F>
            <F label="Address" colors={c}><TextInput style={[s.input, s.multi, { backgroundColor: c.surfaceLow, color: c.text }]} value={form.customerAddress} onChangeText={(v) => set('customerAddress', v)} placeholder="Street, City, Country" placeholderTextColor={c.outline} multiline numberOfLines={2} textAlignVertical="top" /></F>
            <F label="Phone" colors={c}><TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text }]} value={form.customerPhone} onChangeText={(v) => set('customerPhone', v)} placeholder="+49 123 456789" placeholderTextColor={c.outline} keyboardType="phone-pad" /></F>
            <F label="Instagram" colors={c}><TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text }]} value={form.customerInstagram} onChangeText={(v) => set('customerInstagram', v)} placeholder="@username" placeholderTextColor={c.outline} autoCapitalize="none" /></F>
            <F label="Delivery Time" colors={c}><TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text }]} value={form.deliveryTime} onChangeText={(v) => set('deliveryTime', v)} placeholder="e.g. 3:00 PM" placeholderTextColor={c.outline} /></F>
          </Block>

          <Block title="Financials" colors={c}>
            <F label="Currency" colors={c}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {CURRENCIES.map((cur) => (
                  <TouchableOpacity key={cur} style={[s.chip, { backgroundColor: c.surfaceHighest }, form.currency === cur && { backgroundColor: c.primary }]} onPress={() => set('currency', cur)}>
                    <Text style={[s.chipTxt, { color: c.subText }, form.currency === cur && { color: c.onPrimary }]}>{cur}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </F>
            <F label="Total Asking Price" colors={c}>
              <TextInput style={[s.input, s.priceInput, { backgroundColor: c.surfaceLow, color: c.text }]} value={form.askingPrice} onChangeText={(v) => set('askingPrice', v)} placeholder="0.00" placeholderTextColor={c.outline} keyboardType="decimal-pad" />
              {orderItems.length > 0 && (
                <Text style={[s.hint, { color: c.primaryContainer }]}>Items total: {form.currency} {itemsTotal.toFixed(2)}{parseFloat(form.askingPrice) < itemsTotal ? ' ⚠ Price is below items total' : ''}</Text>
              )}
              {inventoryWarning && (
                <View style={[s.inventoryWarning, { backgroundColor: c.accentContainer }]}>
                  <Text style={[s.inventoryWarningTxt, { color: c.accent }]}>
                    💡 Your inventory suggests at least {inventoryMatch!.materials[0]?.currency ?? form.currency} {inventorySuggestedPrice.toFixed(0)} for "{inventoryMatch!.name}" (material cost: {inventoryMatch!.materials[0]?.currency ?? form.currency} {inventoryMatch!.totalMaterialCost.toFixed(0)})
                  </Text>
                </View>
              )}
            </F>
            <View style={[s.toggleRow, { backgroundColor: c.surfaceLow }]}><Text style={[s.toggleLbl, { color: c.text }]}>Already paid</Text><Switch value={form.isPaid} onValueChange={(v) => set('isPaid', v)} trackColor={{ false: c.outlineVariant, true: c.primaryContainer }} thumbColor="#FFFFFF" /></View>
            <F label="Payment Notes" colors={c}><TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text }]} value={form.paymentNotes} onChangeText={(v) => set('paymentNotes', v)} placeholder="Bank transfer, PayPal…" placeholderTextColor={c.outline} /></F>
          </Block>

          <Block title="Dates & Progress" colors={c} last>
            <F label="Due Date (YYYY-MM-DD)" colors={c}>
              <TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text }]} value={form.dueDateText} onChangeText={(v) => set('dueDateText', v)} placeholder="2025-04-15" placeholderTextColor={c.outline} keyboardType="numbers-and-punctuation" />
              <Text style={[s.hint, { color: c.primaryContainer }]}>{format(parsedDue, 'EEEE, MMMM d, yyyy')}</Text>
            </F>

            {/* Completion slider */}
            <F label={`Completion: ${form.completionPercent}%`} colors={c}>
              <View style={s.sliderContainer}>
                <View style={[s.sliderTrack, { backgroundColor: c.outlineVariant }]}>
                  <View style={[s.sliderFill, { width: `${form.completionPercent}%`, backgroundColor: c.accent }]} />
                </View>
                <View style={s.sliderBtns}>
                  {[0, 25, 50, 75, 100].map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[s.sliderBtn, { backgroundColor: c.surfaceHighest }, form.completionPercent === v && { backgroundColor: c.accent }]}
                      onPress={() => set('completionPercent', v)}
                    >
                      <Text style={[s.sliderBtnTxt, { color: c.subText }, form.completionPercent === v && { color: c.onPrimary }]}>{v}%</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </F>

            <F label="Internal Notes" colors={c}><TextInput style={[s.input, s.multi, { backgroundColor: c.surfaceLow, color: c.text }]} value={form.internalNotes} onChangeText={(v) => set('internalNotes', v)} placeholder="Private notes…" placeholderTextColor={c.outline} multiline numberOfLines={3} textAlignVertical="top" /></F>
          </Block>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky bottom save button */}
      <View style={[s.stickyBar, { paddingBottom: insets.bottom + 8, backgroundColor: c.bg, borderTopColor: c.outlineVariant }]}>
        <TouchableOpacity
          onPress={save}
          style={[s.stickySaveBtn, { backgroundColor: c.primaryContainer }, saving && { opacity: 0.5 }]}
          disabled={saving}
        >
          <Text style={[s.stickySaveTxt, { color: c.onPrimary }]}>{saving ? 'Saving…' : 'Save Order'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Block({ title, children, last, colors }: { title: string; children: React.ReactNode; last?: boolean; colors: any }) {
  return (
    <View style={[s.block, !last && s.blockBorder, !last && { borderBottomColor: colors.outlineVariant }]}>
      <Text style={[s.blockTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}
function F({ label, children, colors }: { label: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={[s.lbl, { color: colors.subText }]}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  cancel: { fontSize: 15, fontFamily: 'DMSans', fontWeight: '500' },
  headerTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay', fontWeight: '700' },
  saveBtn: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  saveTxt: { fontFamily: 'DMSans', fontSize: 14, fontWeight: '700' },
  block: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  blockBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  blockTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay', fontWeight: '700', marginBottom: 16 },
  lbl: { fontSize: 11, fontFamily: 'DMSans', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 4 },
  input: { borderRadius: 999, paddingHorizontal: 20, paddingVertical: 14, fontFamily: 'DMSans', fontSize: 15, marginBottom: 12 },
  multi: { minHeight: 80, paddingTop: 14, borderRadius: 16 },
  priceInput: { fontSize: 22, fontWeight: '700' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, gap: 6 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' },
  addBtn: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 14, justifyContent: 'center', alignItems: 'center' },
  addTxt: { fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },
  photoBtn: { borderRadius: 16, paddingVertical: 16, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', marginBottom: 12 },
  photoBtnTxt: { fontFamily: 'DMSans', fontSize: 14, fontWeight: '500' },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, marginRight: 8 },
  chipTxt: { fontSize: 13, fontFamily: 'DMSans', fontWeight: '600' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 14, marginBottom: 12 },
  toggleLbl: { fontSize: 15, fontFamily: 'DMSans' },
  hint: { fontSize: 12, fontFamily: 'DMSans', marginTop: -8, marginBottom: 12, paddingHorizontal: 4 },
  inventoryWarning: { borderRadius: 12, padding: 12, marginBottom: 8 },
  inventoryWarningTxt: { fontSize: 12, fontFamily: 'DMSans', lineHeight: 18 },
  // Inventory chips
  chipSectionLabel: { fontSize: 11, fontFamily: 'DMSans', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  inventoryChip: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  inventoryChipName: { fontSize: 13, fontFamily: 'DMSans', fontWeight: '600' },
  inventoryChipPrice: { fontSize: 11, fontFamily: 'DMMono', marginTop: 1 },
  // Order items
  itemRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'flex-start' },
  itemName: { fontSize: 14, fontFamily: 'DMSans', fontWeight: '700' },
  itemDesc: { fontSize: 12, fontFamily: 'DMSans', marginTop: 2 },
  itemMeta: { fontSize: 12, fontFamily: 'DMMono', marginTop: 2 },
  itemTotal: { fontSize: 14, fontFamily: 'DMMono', fontWeight: '700' },
  itemsSummary: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, marginTop: 4 },
  itemsSummaryLabel: { fontSize: 13, fontFamily: 'DMSans', fontWeight: '600' },
  itemsSummaryValue: { fontSize: 15, fontFamily: 'DMMono', fontWeight: '700' },
  addItemForm: { borderRadius: 16, padding: 12, marginBottom: 12 },
  editItemForm: { borderRadius: 16, padding: 12, marginBottom: 8 },
  // Completion slider
  sliderContainer: { marginBottom: 12 },
  sliderTrack: { height: 8, borderRadius: 4, marginBottom: 12, overflow: 'hidden' },
  sliderFill: { height: 8, borderRadius: 4 },
  sliderBtns: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  sliderBtnTxt: { fontSize: 12, fontFamily: 'DMSans', fontWeight: '600' },
  stickyBar: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 12 },
  stickySaveBtn: { borderRadius: 999, paddingVertical: 17, alignItems: 'center', elevation: 6 },
  stickySaveTxt: { fontFamily: 'DMSans', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
