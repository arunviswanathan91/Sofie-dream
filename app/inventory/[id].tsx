/**
 * Inventory product detail — view/edit a product with all its materials.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useInventory } from '../../context/InventoryContext';
import { useTheme } from '../../context/ThemeContext';
import { generateId } from '../../lib/localStore';
import { getCurrencySymbol } from '../../lib/theme';
import type { InventoryMaterial } from '../../types';

const UNITS = ['grams', 'meters', 'pieces', 'skeins', 'ml', 'liters', 'cm', 'yards', 'rolls'];
const CURRENCIES = ['INR', 'EUR', 'GBP', 'USD'];
const EMOJIS = ['🧶', '🪡', '💡', '🪢', '🧵', '🪔', '🎨', '✂️', '🪴', '🧲', '🪣', '🔮'];

export default function InventoryProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { products, updateProduct, deleteProduct } = useInventory();
  const { colors } = useTheme();

  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product?.name ?? '');
  const [category, setCategory] = useState(product?.category ?? '');
  const [notes, setNotes] = useState(product?.notes ?? '');
  const [markup, setMarkup] = useState(String(product?.markup ?? 1.5));
  const [emoji, setEmoji] = useState(product?.emoji ?? '🧶');
  const [materials, setMaterials] = useState<InventoryMaterial[]>(product?.materials ?? []);
  const [showAddMat, setShowAddMat] = useState(false);
  const [matName, setMatName] = useState('');
  const [matQty, setMatQty] = useState('1');
  const [matUnit, setMatUnit] = useState('pieces');
  const [matCost, setMatCost] = useState('');
  const [matCurrency, setMatCurrency] = useState(product?.materials[0]?.currency ?? 'INR');
  const [saving, setSaving] = useState(false);

  // Material edit state
  const [editingMatId, setEditingMatId] = useState<string | null>(null);
  const [editMatName, setEditMatName] = useState('');
  const [editMatQty, setEditMatQty] = useState('');
  const [editMatUnit, setEditMatUnit] = useState('pieces');
  const [editMatCost, setEditMatCost] = useState('');
  const [editMatCurrency, setEditMatCurrency] = useState('INR');

  if (!product) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
        <Text style={[s.notFound, { color: colors.subText }]}>Product not found.</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: colors.primary, fontFamily: 'DMSans', textAlign: 'center' }}>Go back</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  const c = colors;
  const totalCost = materials.reduce((sum, m) => sum + m.costPerUnit * m.quantity, 0);
  const markupNum = parseFloat(markup) || product.markup;
  const suggestedPrice = totalCost * markupNum;
  const currency = materials[0]?.currency ?? product.materials[0]?.currency ?? 'INR';
  const sym = getCurrencySymbol(currency);
  const hasReminder = !!product.nextReminderDate;
  const reminderOverdue = hasReminder && new Date(product.nextReminderDate!) <= new Date();

  const addMaterial = () => {
    const mName = matName.trim();
    if (!mName) { Alert.alert('Required', 'Material name is required.'); return; }
    const qty = Math.max(0.01, parseFloat(matQty) || 1);
    const cost = parseFloat(matCost) || 0;
    const mat: InventoryMaterial = { id: generateId(), name: mName, quantity: qty, unit: matUnit, costPerUnit: cost, currency: matCurrency };
    setMaterials((prev) => [...prev, mat]);
    setMatName(''); setMatQty('1'); setMatCost('');
    setShowAddMat(false);
  };

  const startEditMaterial = (m: InventoryMaterial) => {
    setEditingMatId(m.id);
    setEditMatName(m.name);
    setEditMatQty(String(m.quantity));
    setEditMatUnit(m.unit);
    setEditMatCost(String(m.costPerUnit));
    setEditMatCurrency(m.currency);
    setShowAddMat(false);
  };

  const saveEditMaterial = () => {
    if (!editingMatId) return;
    setMaterials((prev) => prev.map((m) => {
      if (m.id !== editingMatId) return m;
      return {
        ...m,
        name: editMatName.trim() || m.name,
        quantity: Math.max(0.01, parseFloat(editMatQty) || m.quantity),
        unit: editMatUnit,
        costPerUnit: parseFloat(editMatCost) || m.costPerUnit,
        currency: editMatCurrency,
      };
    }));
    setEditingMatId(null);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Product name is required.'); return; }
    setSaving(true);
    try {
      await updateProduct(id, {
        name: name.trim(),
        emoji,
        category: category.trim() || undefined,
        notes: notes.trim() || undefined,
        markup: Math.max(1, parseFloat(markup) || 1.5),
        materials,
      });
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
    setSaving(false);
  };

  const handleSnoozeReminder = async () => {
    const next = new Date();
    if (product.remindUnit === 'days') next.setDate(next.getDate() + (product.remindInterval ?? 7));
    else if (product.remindUnit === 'weeks') next.setDate(next.getDate() + (product.remindInterval ?? 1) * 7);
    else next.setMonth(next.getMonth() + (product.remindInterval ?? 1));
    await updateProduct(id, { nextReminderDate: next });
    Alert.alert('Snoozed', `Next reminder: ${format(next, 'MMM d, yyyy')}`);
  };

  const handleDelete = () => {
    Alert.alert('Delete', `Delete "${product.name}" from inventory?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteProduct(id); router.back(); } },
    ]);
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.bg }]}>
      <View style={[s.header, { backgroundColor: c.bg }]}>
        <TouchableOpacity onPress={() => router.back()} style={[s.backPill, { backgroundColor: c.surfaceContainer }]} hitSlop={12}>
          <Text style={[s.backChevron, { color: c.primary }]}>‹</Text>
          <Text style={[s.back, { color: c.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: c.text }]} numberOfLines={1}>{product.name}</Text>
        {editing ? (
          <TouchableOpacity onPress={handleSave} style={[s.saveBtn, { backgroundColor: c.primaryContainer }, saving && { opacity: 0.5 }]} disabled={saving}>
            <Text style={[s.saveBtnTxt, { color: c.onPrimary }]}>{saving ? '…' : 'Save'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)} style={[s.editBtn, { backgroundColor: c.surfaceContainer }]}>
            <Text style={[s.editBtnTxt, { color: c.primary }]}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}>

        {/* Hero */}
        <View style={[s.heroCard, { backgroundColor: c.surfaceLow }]}>
          <View style={s.heroTop}>
            {editing ? (
              <View>
                <Text style={{ fontSize: 32, marginBottom: 4 }}>{emoji}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {EMOJIS.map((e) => (
                    <TouchableOpacity
                      key={e}
                      style={[s.emojiBtn, { backgroundColor: c.surfaceContainer }, emoji === e && { backgroundColor: c.primaryContainer }]}
                      onPress={() => setEmoji(e)}
                    >
                      <Text style={{ fontSize: 18 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <Text style={{ fontSize: 40 }}>{emoji}</Text>
            )}
            <View style={{ flex: 1 }}>
              {editing ? (
                <TextInput style={[s.heroInput, { color: c.text, borderBottomColor: c.outlineVariant }]} value={name} onChangeText={setName} placeholder="Product name" placeholderTextColor={c.outline} />
              ) : (
                <Text style={[s.heroName, { color: c.text }]}>{product.name}</Text>
              )}
              {editing ? (
                <TextInput style={[s.heroCategoryInput, { color: c.subText, borderBottomColor: c.outlineVariant }]} value={category} onChangeText={setCategory} placeholder="Category" placeholderTextColor={c.outline} />
              ) : product.category ? (
                <Text style={[s.heroCategory, { color: c.subText }]}>{product.category}</Text>
              ) : null}
            </View>
          </View>
          <View style={s.heroStats}>
            <View style={s.heroStat}>
              <Text style={[s.heroStatVal, { color: c.text }]}>{sym}{editing ? totalCost.toFixed(0) : product.totalMaterialCost.toFixed(0)}</Text>
              <Text style={[s.heroStatLbl, { color: c.subText }]}>MATERIAL COST</Text>
            </View>
            <View style={[s.heroStatDivider, { backgroundColor: c.outlineVariant }]} />
            <View style={s.heroStat}>
              <Text style={[s.heroStatVal, { color: c.accent }]}>{sym}{editing ? suggestedPrice.toFixed(0) : product.suggestedPrice.toFixed(0)}</Text>
              <Text style={[s.heroStatLbl, { color: c.subText }]}>SUGGESTED PRICE</Text>
            </View>
            <View style={[s.heroStatDivider, { backgroundColor: c.outlineVariant }]} />
            <View style={s.heroStat}>
              <Text style={[s.heroStatVal, { color: c.text }]}>{((( editing ? markupNum : product.markup) - 1) * 100).toFixed(0)}%</Text>
              <Text style={[s.heroStatLbl, { color: c.subText }]}>MARKUP</Text>
            </View>
          </View>
        </View>

        {/* Reminder alert */}
        {reminderOverdue && (
          <View style={[s.reminderAlert, { backgroundColor: c.accentContainer }]}>
            <Text style={[s.reminderAlertTxt, { color: c.accent }]}>⏰ Usage reminder is due!</Text>
            <TouchableOpacity onPress={handleSnoozeReminder} style={[s.snoozeBtn, { backgroundColor: c.accent }]}>
              <Text style={[s.snoozeBtnTxt, { color: c.onPrimary }]}>Snooze</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Materials */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: c.text }]}>Materials</Text>
          <View style={[s.card, { backgroundColor: c.surfaceLowest }]}>
            {materials.map((m) => (
              <View key={m.id}>
                {editing && editingMatId === m.id ? (
                  // Inline material edit form
                  <View style={[s.editMatForm, { backgroundColor: c.surfaceContainer }]}>
                    <TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text }]} value={editMatName} onChangeText={setEditMatName} placeholder="Material name" placeholderTextColor={c.outline} />
                    <View style={s.row}>
                      <TextInput style={[s.input, { flex: 1, marginBottom: 0, backgroundColor: c.surfaceLow, color: c.text }]} value={editMatQty} onChangeText={setEditMatQty} keyboardType="decimal-pad" placeholder="Qty" placeholderTextColor={c.outline} />
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {UNITS.map((u) => (
                          <TouchableOpacity key={u} style={[s.miniChip, { backgroundColor: c.surfaceHighest }, editMatUnit === u && { backgroundColor: c.primary }]} onPress={() => setEditMatUnit(u)}>
                            <Text style={[s.miniChipTxt, { color: c.subText }, editMatUnit === u && { color: c.onPrimary }]}>{u}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    <View style={[s.row, { marginTop: 8 }]}>
                      <TextInput style={[s.input, { flex: 1, marginBottom: 0, fontWeight: '700', backgroundColor: c.surfaceLow, color: c.text }]} value={editMatCost} onChangeText={setEditMatCost} keyboardType="decimal-pad" placeholder="Cost/unit" placeholderTextColor={c.outline} />
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {CURRENCIES.map((cur) => (
                          <TouchableOpacity key={cur} style={[s.miniChip, { backgroundColor: c.surfaceHighest }, editMatCurrency === cur && { backgroundColor: c.primary }]} onPress={() => setEditMatCurrency(cur)}>
                            <Text style={[s.miniChipTxt, { color: c.subText }, editMatCurrency === cur && { color: c.onPrimary }]}>{cur}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    <View style={[s.row, { marginTop: 8 }]}>
                      <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: c.primaryContainer }]} onPress={saveEditMaterial}><Text style={[s.btnTxt, { color: c.onPrimary }]}>Done</Text></TouchableOpacity>
                      <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: c.surfaceHigh }]} onPress={() => setEditingMatId(null)}><Text style={[s.btnTxt, { color: c.subText }]}>Cancel</Text></TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={[s.matRow, { borderBottomColor: c.outlineVariant }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.matName, { color: c.text }]}>{m.name}</Text>
                      <Text style={[s.matDetail, { color: c.subText }]}>{m.quantity} {m.unit} × {m.currency} {m.costPerUnit.toFixed(2)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={[s.matTotal, { color: c.primary }]}>{m.currency} {(m.costPerUnit * m.quantity).toFixed(2)}</Text>
                      {editing && (
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <TouchableOpacity onPress={() => startEditMaterial(m)}>
                            <Text style={{ color: c.primary, fontSize: 11, fontFamily: 'DMSans' }}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setMaterials((prev) => prev.filter((x) => x.id !== m.id))}>
                            <Text style={{ color: c.error, fontSize: 11, fontFamily: 'DMSans' }}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            ))}
            <View style={[s.matTotalRow, { borderTopColor: c.primary }]}>
              <Text style={[s.matTotalLabel, { color: c.text }]}>Total</Text>
              <Text style={[s.matTotalVal, { color: c.primary }]}>{currency} {totalCost.toFixed(2)}</Text>
            </View>

            {editing && (showAddMat ? (
              <View style={[s.addMatForm, { backgroundColor: c.surfaceContainer }]}>
                <TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text }]} value={matName} onChangeText={setMatName} placeholder="Material name" placeholderTextColor={c.outline} />
                <View style={s.row}>
                  <TextInput style={[s.input, { flex: 1, marginBottom: 0, backgroundColor: c.surfaceLow, color: c.text }]} value={matQty} onChangeText={setMatQty} keyboardType="decimal-pad" placeholder="Qty" placeholderTextColor={c.outline} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {UNITS.map((u) => (
                      <TouchableOpacity key={u} style={[s.miniChip, { backgroundColor: c.surfaceHighest }, matUnit === u && { backgroundColor: c.primary }]} onPress={() => setMatUnit(u)}>
                        <Text style={[s.miniChipTxt, { color: c.subText }, matUnit === u && { color: c.onPrimary }]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={s.row}>
                  <TextInput style={[s.input, { flex: 1, marginBottom: 0, fontWeight: '700', backgroundColor: c.surfaceLow, color: c.text }]} value={matCost} onChangeText={setMatCost} keyboardType="decimal-pad" placeholder="Cost/unit" placeholderTextColor={c.outline} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {CURRENCIES.map((cur) => (
                      <TouchableOpacity key={cur} style={[s.miniChip, { backgroundColor: c.surfaceHighest }, matCurrency === cur && { backgroundColor: c.primary }]} onPress={() => setMatCurrency(cur)}>
                        <Text style={[s.miniChipTxt, { color: c.subText }, matCurrency === cur && { color: c.onPrimary }]}>{cur}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={s.row}>
                  <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: c.primaryContainer }]} onPress={addMaterial}><Text style={[s.btnTxt, { color: c.onPrimary }]}>Add</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: c.surfaceHigh }]} onPress={() => setShowAddMat(false)}><Text style={[s.btnTxt, { color: c.subText }]}>Cancel</Text></TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={[s.addMatBtn, { backgroundColor: c.surfaceLow, borderColor: c.outlineVariant }]} onPress={() => setShowAddMat(true)}>
                <Text style={[s.addMatBtnTxt, { color: c.primary }]}>+ Add Material</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Markup */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: c.text }]}>Pricing & Markup</Text>
          <View style={[s.card, { backgroundColor: c.surfaceLowest }]}>
            {/* Always show explainer */}
            <View style={[s.markupExplainer, { backgroundColor: c.surfaceContainer }]}>
              <Text style={[s.markupExplainerTitle, { color: c.primary }]}>What is markup?</Text>
              <Text style={[s.markupExplainerBody, { color: c.subText }]}>
                Markup multiplies your material cost to set a selling price.{'\n'}
                • 1.0 = sell at cost (no profit){'\n'}
                • 1.5 = 50% profit above material cost{'\n'}
                • 2.0 = double your material cost{'\n'}
                Example: materials cost {currency} 100 × markup 1.5 = {currency} 150 selling price.
              </Text>
            </View>
            {editing ? (
              <TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text, marginTop: 8 }]} value={markup} onChangeText={setMarkup} keyboardType="decimal-pad" placeholder="1.5" placeholderTextColor={c.outline} />
            ) : (
              <View style={s.pricingRow}>
                <Text style={[s.pricingLabel, { color: c.subText }]}>Markup</Text>
                <Text style={[s.pricingVal, { color: c.text, fontWeight: '700' }]}>{product.markup}× ({((product.markup - 1) * 100).toFixed(0)}% profit)</Text>
              </View>
            )}
            <View style={[s.pricingInfo, { backgroundColor: c.surfaceContainer }]}>
              <View style={s.pricingRow}>
                <Text style={[s.pricingLabel, { color: c.subText }]}>Material Cost</Text>
                <Text style={[s.pricingVal, { color: c.text }]}>{currency} {(editing ? totalCost : product.totalMaterialCost).toFixed(2)}</Text>
              </View>
              <View style={s.pricingRow}>
                <Text style={[s.pricingLabel, { color: c.subText, fontWeight: '700' }]}>Suggested Price</Text>
                <Text style={[s.pricingVal, { color: c.accent, fontWeight: '700' }]}>{currency} {(editing ? suggestedPrice : product.suggestedPrice).toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: c.text }]}>Notes</Text>
          <View style={[s.card, { backgroundColor: c.surfaceLowest }]}>
            {editing ? (
              <TextInput style={[s.input, { borderRadius: 12, minHeight: 64, textAlignVertical: 'top', paddingTop: 12, backgroundColor: c.surfaceLow, color: c.text }]} value={notes} onChangeText={setNotes} placeholder="Notes about this product…" placeholderTextColor={c.outline} multiline />
            ) : (
              <Text style={{ fontFamily: 'DMSans', fontSize: 14, color: notes ? c.text : c.outline }}>
                {notes || 'No notes.'}
              </Text>
            )}
          </View>
        </View>

        {/* Reminder info */}
        {product.remindInterval && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: c.text }]}>Reminder</Text>
            <View style={[s.card, { backgroundColor: c.surfaceLowest }]}>
              <Text style={{ fontFamily: 'DMSans', fontSize: 14, color: c.text }}>
                Every {product.remindInterval} {product.remindUnit}
              </Text>
              {product.nextReminderDate && (
                <Text style={{ fontFamily: 'DMSans', fontSize: 12, color: c.subText, marginTop: 4 }}>
                  Next: {format(new Date(product.nextReminderDate), 'MMM d, yyyy')}
                </Text>
              )}
              <TouchableOpacity style={[s.btn, { marginTop: 12, backgroundColor: c.primaryContainer }]} onPress={handleSnoozeReminder}>
                <Text style={[s.btnTxt, { color: c.onPrimary }]}>Reschedule Reminder</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Meta */}
        <View style={s.section}>
          <View style={[s.card, { backgroundColor: c.surfaceLowest }]}>
            <View style={s.metaRow}>
              <Text style={[s.metaLabel, { color: c.subText }]}>Created</Text>
              <Text style={[s.metaVal, { color: c.text }]}>{format(new Date(product.createdAt), 'MMM d, yyyy')}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={[s.metaLabel, { color: c.subText }]}>Last updated</Text>
              <Text style={[s.metaVal, { color: c.text }]}>{format(new Date(product.updatedAt), 'MMM d, yyyy')}</Text>
            </View>
          </View>
        </View>

        {/* Delete */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <TouchableOpacity style={[s.deleteBtn, { backgroundColor: c.surfaceLow }]} onPress={handleDelete}>
            <Text style={[s.deleteBtnTxt, { color: c.error }]}>Delete Product</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  notFound: { textAlign: 'center', fontFamily: 'DMSans', paddingTop: 80 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backPill: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, gap: 2 },
  backChevron: { fontSize: 20, lineHeight: 20, fontWeight: '300', marginTop: -1 },
  back: { fontSize: 13, fontFamily: 'DMSans', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay', fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  saveBtn: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7 },
  saveBtnTxt: { fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },
  editBtn: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7 },
  editBtnTxt: { fontFamily: 'DMSans', fontSize: 13, fontWeight: '600' },
  heroCard: { margin: 16, borderRadius: 20, padding: 20, gap: 16 },
  heroTop: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  emojiBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  heroName: { fontSize: 22, fontFamily: 'PlayfairDisplay', fontWeight: '700' },
  heroCategory: { fontSize: 13, fontFamily: 'DMSans', marginTop: 4 },
  heroInput: { fontSize: 18, fontFamily: 'PlayfairDisplay', fontWeight: '700', borderBottomWidth: 1, paddingBottom: 4 },
  heroCategoryInput: { fontSize: 13, fontFamily: 'DMSans', marginTop: 4, borderBottomWidth: 1 },
  heroStats: { flexDirection: 'row', justifyContent: 'space-around' },
  heroStat: { alignItems: 'center', gap: 4 },
  heroStatVal: { fontSize: 20, fontFamily: 'DMMono', fontWeight: '700' },
  heroStatLbl: { fontSize: 9, fontFamily: 'DMSans', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroStatDivider: { width: 1, alignSelf: 'stretch' },
  reminderAlert: { marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reminderAlertTxt: { fontFamily: 'DMSans', fontSize: 13, fontWeight: '600' },
  snoozeBtn: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  snoozeBtnTxt: { fontFamily: 'DMSans', fontSize: 12, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay', fontWeight: '700', marginBottom: 8 },
  card: { borderRadius: 16, padding: 16, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  matRow: { flexDirection: 'row', gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'flex-start' },
  matName: { fontSize: 14, fontFamily: 'DMSans', fontWeight: '700' },
  matDetail: { fontSize: 12, fontFamily: 'DMMono', marginTop: 2 },
  matTotal: { fontSize: 14, fontFamily: 'DMMono', fontWeight: '700' },
  matTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1 },
  matTotalLabel: { fontSize: 14, fontFamily: 'DMSans', fontWeight: '700' },
  matTotalVal: { fontSize: 16, fontFamily: 'DMMono', fontWeight: '700' },
  editMatForm: { borderRadius: 12, padding: 12, marginVertical: 4 },
  addMatBtn: { borderRadius: 12, paddingVertical: 12, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', marginTop: 8 },
  addMatBtnTxt: { fontFamily: 'DMSans', fontSize: 13, fontWeight: '500' },
  addMatForm: { borderRadius: 12, padding: 12, marginTop: 8 },
  input: { borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12, fontFamily: 'DMSans', fontSize: 14, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  miniChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, marginRight: 6 },
  miniChipTxt: { fontSize: 12, fontFamily: 'DMSans', fontWeight: '600' },
  btn: { borderRadius: 999, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },
  markupExplainer: { borderRadius: 12, padding: 14, marginBottom: 4 },
  markupExplainerTitle: { fontSize: 13, fontFamily: 'DMSans', fontWeight: '700', marginBottom: 6 },
  markupExplainerBody: { fontSize: 12, fontFamily: 'DMSans', lineHeight: 20 },
  pricingInfo: { borderRadius: 12, padding: 14, gap: 8, marginTop: 8 },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pricingLabel: { fontSize: 13, fontFamily: 'DMSans' },
  pricingVal: { fontSize: 14, fontFamily: 'DMMono' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  metaLabel: { fontSize: 13, fontFamily: 'DMSans' },
  metaVal: { fontSize: 13, fontFamily: 'DMMono' },
  deleteBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  deleteBtnTxt: { fontFamily: 'DMSans', fontSize: 15, fontWeight: '600' },
});
