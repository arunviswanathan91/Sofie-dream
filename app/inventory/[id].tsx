/**
 * Inventory product detail — view/edit a product with all its materials.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, TextInput, Switch,
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

const T = {
  bg: '#FFF8F5',
  surfaceLow: '#F9F2EF',
  surfaceContainer: '#F3ECEA',
  surfaceHigh: '#EDE7E4',
  surfaceHighest: '#E8E1DE',
  surfaceLowest: '#FFFFFF',
  primary: '#864D5F',
  primaryContainer: '#C9879A',
  onPrimary: '#FFFFFF',
  tertiary: '#994530',
  tertiaryFixed: '#FFDAD2',
  secondary: '#625E5A',
  text: '#1D1B1A',
  subText: '#514346',
  outline: '#837376',
  outlineVariant: '#D5C2C5',
  error: '#BA1A1A',
};

const UNITS = ['grams', 'meters', 'pieces', 'skeins', 'ml', 'liters', 'cm', 'yards', 'rolls'];
const CURRENCIES = ['INR', 'EUR', 'GBP', 'USD'];

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
  const [materials, setMaterials] = useState<InventoryMaterial[]>(product?.materials ?? []);
  const [showAddMat, setShowAddMat] = useState(false);
  const [matName, setMatName] = useState('');
  const [matQty, setMatQty] = useState('1');
  const [matUnit, setMatUnit] = useState('pieces');
  const [matCost, setMatCost] = useState('');
  const [matCurrency, setMatCurrency] = useState(product?.materials[0]?.currency ?? 'INR');
  const [saving, setSaving] = useState(false);

  if (!product) {
    return (
      <SafeAreaView style={s.container}>
        <Text style={s.notFound}>Product not found.</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: T.primary, fontFamily: 'DMSans', textAlign: 'center' }}>Go back</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  const totalCost = materials.reduce((sum, m) => sum + m.costPerUnit * m.quantity, 0);
  const suggestedPrice = totalCost * (parseFloat(markup) || product.markup);
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

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Product name is required.'); return; }
    setSaving(true);
    try {
      await updateProduct(id, {
        name: name.trim(),
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
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <View style={[s.header, { backgroundColor: colors.bg }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backPill} hitSlop={12}>
          <Text style={s.backChevron}>‹</Text>
          <Text style={s.back}>Back</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
        {editing ? (
          <TouchableOpacity onPress={handleSave} style={[s.saveBtn, saving && { opacity: 0.5 }]} disabled={saving}>
            <Text style={s.saveBtnTxt}>{saving ? '…' : 'Save'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)} style={s.editBtn}>
            <Text style={s.editBtnTxt}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}>

        {/* Hero */}
        <View style={s.heroCard}>
          <View style={s.heroTop}>
            <Text style={{ fontSize: 40 }}>{product.emoji ?? '🧶'}</Text>
            <View style={{ flex: 1 }}>
              {editing ? (
                <TextInput style={s.heroInput} value={name} onChangeText={setName} placeholder="Product name" placeholderTextColor={T.outline} />
              ) : (
                <Text style={s.heroName}>{product.name}</Text>
              )}
              {editing ? (
                <TextInput style={s.heroCategoryInput} value={category} onChangeText={setCategory} placeholder="Category" placeholderTextColor={T.outline} />
              ) : product.category ? (
                <Text style={s.heroCategory}>{product.category}</Text>
              ) : null}
            </View>
          </View>
          <View style={s.heroStats}>
            <View style={s.heroStat}>
              <Text style={s.heroStatVal}>{sym}{product.totalMaterialCost.toFixed(0)}</Text>
              <Text style={s.heroStatLbl}>MATERIAL COST</Text>
            </View>
            <View style={s.heroStatDivider} />
            <View style={s.heroStat}>
              <Text style={[s.heroStatVal, { color: T.tertiary }]}>{sym}{product.suggestedPrice.toFixed(0)}</Text>
              <Text style={s.heroStatLbl}>SUGGESTED PRICE</Text>
            </View>
            <View style={s.heroStatDivider} />
            <View style={s.heroStat}>
              <Text style={s.heroStatVal}>{((product.markup - 1) * 100).toFixed(0)}%</Text>
              <Text style={s.heroStatLbl}>MARKUP</Text>
            </View>
          </View>
        </View>

        {/* Reminder alert */}
        {reminderOverdue && (
          <View style={s.reminderAlert}>
            <Text style={s.reminderAlertTxt}>⏰ Usage reminder is due!</Text>
            <TouchableOpacity onPress={handleSnoozeReminder} style={s.snoozeBtn}>
              <Text style={s.snoozeBtnTxt}>Snooze</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Materials */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Materials</Text>
          <View style={s.card}>
            {materials.map((m) => (
              <View key={m.id} style={s.matRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.matName}>{m.name}</Text>
                  <Text style={s.matDetail}>{m.quantity} {m.unit} × {m.currency} {m.costPerUnit.toFixed(2)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={s.matTotal}>{m.currency} {(m.costPerUnit * m.quantity).toFixed(2)}</Text>
                  {editing && (
                    <TouchableOpacity onPress={() => setMaterials((prev) => prev.filter((x) => x.id !== m.id))}>
                      <Text style={{ color: T.error, fontSize: 11, fontFamily: 'DMSans' }}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
            <View style={s.matTotalRow}>
              <Text style={s.matTotalLabel}>Total</Text>
              <Text style={s.matTotalVal}>{currency} {totalCost.toFixed(2)}</Text>
            </View>

            {editing && (showAddMat ? (
              <View style={s.addMatForm}>
                <TextInput style={s.input} value={matName} onChangeText={setMatName} placeholder="Material name" placeholderTextColor={T.outline} />
                <View style={s.row}>
                  <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} value={matQty} onChangeText={setMatQty} keyboardType="decimal-pad" placeholder="Qty" placeholderTextColor={T.outline} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {UNITS.map((u) => (
                      <TouchableOpacity key={u} style={[s.miniChip, matUnit === u && s.miniChipOn]} onPress={() => setMatUnit(u)}>
                        <Text style={[s.miniChipTxt, matUnit === u && s.miniChipTxtOn]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={s.row}>
                  <TextInput style={[s.input, { flex: 1, marginBottom: 0, fontWeight: '700' }]} value={matCost} onChangeText={setMatCost} keyboardType="decimal-pad" placeholder="Cost/unit" placeholderTextColor={T.outline} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {CURRENCIES.map((c) => (
                      <TouchableOpacity key={c} style={[s.miniChip, matCurrency === c && s.miniChipOn]} onPress={() => setMatCurrency(c)}>
                        <Text style={[s.miniChipTxt, matCurrency === c && s.miniChipTxtOn]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={s.row}>
                  <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={addMaterial}><Text style={s.btnTxt}>Add</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: T.surfaceHigh }]} onPress={() => setShowAddMat(false)}><Text style={[s.btnTxt, { color: T.subText }]}>Cancel</Text></TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={s.addMatBtn} onPress={() => setShowAddMat(true)}>
                <Text style={s.addMatBtnTxt}>+ Add Material</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Markup */}
        {editing && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Markup</Text>
            <View style={s.card}>
              <TextInput style={s.input} value={markup} onChangeText={setMarkup} keyboardType="decimal-pad" placeholder="1.5" placeholderTextColor={T.outline} />
              <View style={s.pricingInfo}>
                <View style={s.pricingRow}>
                  <Text style={s.pricingLabel}>Material Cost</Text>
                  <Text style={s.pricingVal}>{currency} {totalCost.toFixed(2)}</Text>
                </View>
                <View style={s.pricingRow}>
                  <Text style={[s.pricingLabel, { fontWeight: '700' }]}>Suggested Price</Text>
                  <Text style={[s.pricingVal, { color: T.tertiary, fontWeight: '700' }]}>{currency} {suggestedPrice.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Notes */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Notes</Text>
          <View style={s.card}>
            {editing ? (
              <TextInput style={[s.input, { borderRadius: 12, minHeight: 64, textAlignVertical: 'top', paddingTop: 12 }]} value={notes} onChangeText={setNotes} placeholder="Notes about this product…" placeholderTextColor={T.outline} multiline />
            ) : (
              <Text style={{ fontFamily: 'DMSans', fontSize: 14, color: notes ? T.text : T.outline }}>
                {notes || 'No notes.'}
              </Text>
            )}
          </View>
        </View>

        {/* Reminder info */}
        {product.remindInterval && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Reminder</Text>
            <View style={s.card}>
              <Text style={{ fontFamily: 'DMSans', fontSize: 14, color: T.text }}>
                Every {product.remindInterval} {product.remindUnit}
              </Text>
              {product.nextReminderDate && (
                <Text style={{ fontFamily: 'DMSans', fontSize: 12, color: T.subText, marginTop: 4 }}>
                  Next: {format(new Date(product.nextReminderDate), 'MMM d, yyyy')}
                </Text>
              )}
              <TouchableOpacity style={[s.btn, { marginTop: 12 }]} onPress={handleSnoozeReminder}>
                <Text style={s.btnTxt}>Reschedule Reminder</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Meta */}
        <View style={s.section}>
          <View style={s.card}>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Created</Text>
              <Text style={s.metaVal}>{format(new Date(product.createdAt), 'MMM d, yyyy')}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Last updated</Text>
              <Text style={s.metaVal}>{format(new Date(product.updatedAt), 'MMM d, yyyy')}</Text>
            </View>
          </View>
        </View>

        {/* Delete */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
            <Text style={s.deleteBtnTxt}>Delete Product</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  notFound: { textAlign: 'center', fontFamily: 'DMSans', color: T.subText, paddingTop: 80 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surfaceContainer, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, gap: 2 },
  backChevron: { fontSize: 20, color: T.primary, lineHeight: 20, fontWeight: '300', marginTop: -1 },
  back: { fontSize: 13, fontFamily: 'DMSans', color: T.primary, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay', fontWeight: '700', color: T.text, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  saveBtn: { backgroundColor: T.primaryContainer, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7 },
  saveBtnTxt: { color: '#FFFFFF', fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },
  editBtn: { backgroundColor: T.surfaceContainer, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7 },
  editBtnTxt: { color: T.primary, fontFamily: 'DMSans', fontSize: 13, fontWeight: '600' },
  heroCard: { margin: 16, backgroundColor: T.surfaceLow, borderRadius: 20, padding: 20, gap: 16 },
  heroTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  heroName: { fontSize: 22, fontFamily: 'PlayfairDisplay', fontWeight: '700', color: T.text },
  heroCategory: { fontSize: 13, fontFamily: 'DMSans', color: T.subText, marginTop: 4 },
  heroInput: { fontSize: 18, fontFamily: 'PlayfairDisplay', fontWeight: '700', color: T.text, borderBottomWidth: 1, borderBottomColor: T.outlineVariant, paddingBottom: 4 },
  heroCategoryInput: { fontSize: 13, fontFamily: 'DMSans', color: T.subText, marginTop: 4, borderBottomWidth: 1, borderBottomColor: T.outlineVariant },
  heroStats: { flexDirection: 'row', justifyContent: 'space-around' },
  heroStat: { alignItems: 'center', gap: 4 },
  heroStatVal: { fontSize: 20, fontFamily: 'DMMono', fontWeight: '700', color: T.text },
  heroStatLbl: { fontSize: 9, fontFamily: 'DMSans', fontWeight: '600', color: T.subText, textTransform: 'uppercase', letterSpacing: 0.8 },
  heroStatDivider: { width: 1, backgroundColor: T.outlineVariant, alignSelf: 'stretch' },
  reminderAlert: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#FFF3E0', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reminderAlertTxt: { fontFamily: 'DMSans', fontSize: 13, fontWeight: '600', color: T.tertiary },
  snoozeBtn: { backgroundColor: T.tertiary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  snoozeBtnTxt: { color: '#FFFFFF', fontFamily: 'DMSans', fontSize: 12, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay', fontWeight: '700', color: T.text, marginBottom: 8 },
  card: { backgroundColor: T.surfaceLowest, borderRadius: 16, padding: 16, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  matRow: { flexDirection: 'row', gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.outlineVariant, alignItems: 'flex-start' },
  matName: { fontSize: 14, fontFamily: 'DMSans', fontWeight: '700', color: T.text },
  matDetail: { fontSize: 12, fontFamily: 'DMMono', color: T.subText, marginTop: 2 },
  matTotal: { fontSize: 14, fontFamily: 'DMMono', fontWeight: '700', color: T.primary },
  matTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: T.primary },
  matTotalLabel: { fontSize: 14, fontFamily: 'DMSans', fontWeight: '700', color: T.text },
  matTotalVal: { fontSize: 16, fontFamily: 'DMMono', fontWeight: '700', color: T.primary },
  addMatBtn: { backgroundColor: T.surfaceLow, borderRadius: 12, paddingVertical: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: T.outlineVariant, alignItems: 'center', marginTop: 8 },
  addMatBtnTxt: { fontFamily: 'DMSans', fontSize: 13, fontWeight: '500', color: T.primary },
  addMatForm: { backgroundColor: T.surfaceContainer, borderRadius: 12, padding: 12, marginTop: 8 },
  input: { backgroundColor: T.surfaceLow, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12, fontFamily: 'DMSans', fontSize: 14, color: T.text, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  miniChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: T.surfaceHighest, marginRight: 6 },
  miniChipOn: { backgroundColor: T.primary },
  miniChipTxt: { fontSize: 12, fontFamily: 'DMSans', fontWeight: '600', color: T.subText },
  miniChipTxtOn: { color: '#FFFFFF' },
  btn: { backgroundColor: T.primaryContainer, borderRadius: 999, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { color: '#FFFFFF', fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },
  pricingInfo: { backgroundColor: T.surfaceContainer, borderRadius: 12, padding: 14, gap: 8, marginTop: 8 },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pricingLabel: { fontSize: 13, fontFamily: 'DMSans', color: T.subText },
  pricingVal: { fontSize: 14, fontFamily: 'DMMono', color: T.text },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  metaLabel: { fontSize: 13, fontFamily: 'DMSans', color: T.subText },
  metaVal: { fontSize: 13, fontFamily: 'DMMono', color: T.text },
  deleteBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', backgroundColor: T.surfaceLow },
  deleteBtnTxt: { color: T.error, fontFamily: 'DMSans', fontSize: 15, fontWeight: '600' },
});
