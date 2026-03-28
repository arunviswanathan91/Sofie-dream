/**
 * Add new inventory product screen.
 * A product has a name/category + a list of materials with costs.
 * Total material cost and suggested price are auto-calculated.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInventory } from '../../context/InventoryContext';
import { useTheme } from '../../context/ThemeContext';
import { generateId } from '../../lib/localStore';
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
  secondary: '#625E5A',
  text: '#1D1B1A',
  subText: '#514346',
  outline: '#837376',
  outlineVariant: '#D5C2C5',
  error: '#BA1A1A',
};

const UNITS = ['grams', 'meters', 'pieces', 'skeins', 'ml', 'liters', 'cm', 'yards', 'rolls'];
const CURRENCIES = ['INR', 'EUR', 'GBP', 'USD'];
const REMINDER_UNITS = ['days', 'weeks', 'months'] as const;
const EMOJIS = ['🧶', '🪡', '💡', '🪢', '🧵', '🪔', '🎨', '✂️', '🪴', '🧲', '🪣', '🔮'];

export default function NewInventoryProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addProduct } = useInventory();
  const { colors } = useTheme();
  const [saving, setSaving] = useState(false);

  // Product fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [emoji, setEmoji] = useState('🧶');
  const [markup, setMarkup] = useState('1.5');
  const [notes, setNotes] = useState('');

  // Reminder
  const [remindInterval, setRemindInterval] = useState('');
  const [remindUnit, setRemindUnit] = useState<'days' | 'weeks' | 'months'>('weeks');

  // Materials
  const [materials, setMaterials] = useState<InventoryMaterial[]>([]);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [matName, setMatName] = useState('');
  const [matQty, setMatQty] = useState('1');
  const [matUnit, setMatUnit] = useState('pieces');
  const [matCost, setMatCost] = useState('');
  const [matCurrency, setMatCurrency] = useState('INR');

  const totalCost = materials.reduce((sum, m) => sum + m.costPerUnit * m.quantity, 0);
  const suggestedPrice = totalCost * (parseFloat(markup) || 1.5);

  const addMaterial = useCallback(() => {
    const mName = matName.trim();
    if (!mName) { Alert.alert('Required', 'Material name is required.'); return; }
    const qty = Math.max(0.01, parseFloat(matQty) || 1);
    const cost = parseFloat(matCost) || 0;
    const mat: InventoryMaterial = { id: generateId(), name: mName, quantity: qty, unit: matUnit, costPerUnit: cost, currency: matCurrency };
    setMaterials((prev) => [...prev, mat]);
    setMatName(''); setMatQty('1'); setMatCost('');
    setShowAddMaterial(false);
  }, [matName, matQty, matUnit, matCost, matCurrency]);

  const removeMaterial = (id: string) => setMaterials((prev) => prev.filter((m) => m.id !== id));

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Product name is required.'); return; }
    setSaving(true);
    try {
      const markupNum = Math.max(1, parseFloat(markup) || 1.5);
      const remindNum = remindInterval.trim() ? parseInt(remindInterval) : undefined;
      const nextReminder = remindNum && remindNum > 0
        ? (() => {
            const d = new Date();
            if (remindUnit === 'days') d.setDate(d.getDate() + remindNum);
            else if (remindUnit === 'weeks') d.setDate(d.getDate() + remindNum * 7);
            else d.setMonth(d.getMonth() + remindNum);
            return d;
          })()
        : undefined;

      await addProduct({
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        emoji,
        materials,
        markup: markupNum,
        notes: notes.trim() || undefined,
        remindInterval: remindNum,
        remindUnit: remindNum ? remindUnit : undefined,
        nextReminderDate: nextReminder,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <View style={[s.header, { backgroundColor: colors.bg }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={[s.cancel, { color: colors.subText }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>New Product</Text>
        <TouchableOpacity onPress={handleSave} style={[s.saveBtn, saving && { opacity: 0.5 }]} disabled={saving}>
          <Text style={s.saveTxt}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

          {/* Product info */}
          <Block title="Product">
            <F label="Name *">
              <TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g. Rope Lamp" placeholderTextColor={T.outline} />
            </F>
            <F label="Description">
              <TextInput style={[s.input, s.multi]} value={description} onChangeText={setDescription} placeholder="What is this product?" placeholderTextColor={T.outline} multiline numberOfLines={2} textAlignVertical="top" />
            </F>
            <F label="Category">
              <TextInput style={s.input} value={category} onChangeText={setCategory} placeholder="e.g. Lamps, Bags, Scarves" placeholderTextColor={T.outline} />
            </F>

            <F label="Emoji">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {EMOJIS.map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[s.emojiBtn, emoji === e && s.emojiBtnOn]}
                    onPress={() => setEmoji(e)}
                  >
                    <Text style={{ fontSize: 22 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </F>

            <F label="Notes">
              <TextInput style={[s.input, s.multi]} value={notes} onChangeText={setNotes} placeholder="Any additional notes…" placeholderTextColor={T.outline} multiline numberOfLines={2} textAlignVertical="top" />
            </F>
          </Block>

          {/* Materials */}
          <Block title="Materials & Costs">
            <Text style={s.hint}>Add all materials that go into making this product.</Text>
            {materials.map((m) => (
              <View key={m.id} style={s.materialRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.matName}>{m.name}</Text>
                  <Text style={s.matDetail}>{m.quantity} {m.unit} × {m.currency} {m.costPerUnit.toFixed(2)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={s.matTotal}>{m.currency} {(m.costPerUnit * m.quantity).toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => removeMaterial(m.id)}>
                    <Text style={{ color: T.error, fontSize: 11, fontFamily: 'DMSans' }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {materials.length > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Total Material Cost</Text>
                <Text style={s.totalValue}>
                  {materials[0]?.currency ?? 'INR'} {totalCost.toFixed(2)}
                </Text>
              </View>
            )}

            {showAddMaterial ? (
              <View style={s.addMatForm}>
                <F label="Material Name *">
                  <TextInput style={s.input} value={matName} onChangeText={setMatName} placeholder="e.g. Red yarn, Bulb, Wire" placeholderTextColor={T.outline} />
                </F>
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <F label="Quantity">
                      <TextInput style={s.input} value={matQty} onChangeText={setMatQty} keyboardType="decimal-pad" placeholder="1" placeholderTextColor={T.outline} />
                    </F>
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <F label="Unit">
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {UNITS.map((u) => (
                          <TouchableOpacity key={u} style={[s.miniChip, matUnit === u && s.miniChipOn]} onPress={() => setMatUnit(u)}>
                            <Text style={[s.miniChipTxt, matUnit === u && s.miniChipTxtOn]}>{u}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </F>
                  </View>
                </View>
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <F label="Cost per unit">
                      <TextInput style={[s.input, { fontWeight: '700' }]} value={matCost} onChangeText={setMatCost} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={T.outline} />
                    </F>
                  </View>
                  <View style={{ flex: 1 }}>
                    <F label="Currency">
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {CURRENCIES.map((c) => (
                          <TouchableOpacity key={c} style={[s.miniChip, matCurrency === c && s.miniChipOn]} onPress={() => setMatCurrency(c)}>
                            <Text style={[s.miniChipTxt, matCurrency === c && s.miniChipTxtOn]}>{c}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </F>
                  </View>
                </View>
                <View style={s.row}>
                  <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={addMaterial}><Text style={s.btnTxt}>Add Material</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: T.surfaceHigh }]} onPress={() => setShowAddMaterial(false)}><Text style={[s.btnTxt, { color: T.subText }]}>Cancel</Text></TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={s.addMatBtn} onPress={() => setShowAddMaterial(true)}>
                <Text style={s.addMatBtnTxt}>+ Add Material</Text>
              </TouchableOpacity>
            )}
          </Block>

          {/* Pricing */}
          <Block title="Pricing">
            <F label="Markup (e.g. 1.5 = 50% profit)">
              <TextInput style={s.input} value={markup} onChangeText={setMarkup} keyboardType="decimal-pad" placeholder="1.5" placeholderTextColor={T.outline} />
            </F>
            {totalCost > 0 && (
              <View style={s.pricingInfo}>
                <View style={s.pricingRow}>
                  <Text style={s.pricingLabel}>Material Cost</Text>
                  <Text style={s.pricingVal}>{materials[0]?.currency ?? 'INR'} {totalCost.toFixed(2)}</Text>
                </View>
                <View style={s.pricingRow}>
                  <Text style={[s.pricingLabel, { fontWeight: '700' }]}>Suggested Price</Text>
                  <Text style={[s.pricingVal, { color: T.tertiary, fontWeight: '700' }]}>{materials[0]?.currency ?? 'INR'} {suggestedPrice.toFixed(2)}</Text>
                </View>
              </View>
            )}
          </Block>

          {/* Usage reminder */}
          <Block title="Usage Reminder" last>
            <Text style={s.hint}>Get reminded to restock or review this product.</Text>
            <F label="Remind every…">
              <View style={s.row}>
                <TextInput
                  style={[s.input, { flex: 1, marginBottom: 0 }]}
                  value={remindInterval}
                  onChangeText={setRemindInterval}
                  keyboardType="number-pad"
                  placeholder="e.g. 2"
                  placeholderTextColor={T.outline}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {REMINDER_UNITS.map((u) => (
                    <TouchableOpacity key={u} style={[s.miniChip, remindUnit === u && s.miniChipOn]} onPress={() => setRemindUnit(u)}>
                      <Text style={[s.miniChipTxt, remindUnit === u && s.miniChipTxtOn]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </F>
            {remindInterval.trim() && parseInt(remindInterval) > 0 && (
              <Text style={s.hint}>You'll be reminded every {remindInterval} {remindUnit}.</Text>
            )}
          </Block>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[s.stickyBar, { paddingBottom: insets.bottom + 8, backgroundColor: colors.bg }]}>
        <TouchableOpacity onPress={handleSave} style={[s.stickySave, saving && { opacity: 0.5 }]} disabled={saving}>
          <Text style={s.stickySaveTxt}>{saving ? 'Saving…' : 'Save Product'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Block({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <View style={[s.block, !last && s.blockBorder]}>
      <Text style={s.blockTitle}>{title}</Text>
      {children}
    </View>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={s.lbl}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  cancel: { fontSize: 15, fontFamily: 'DMSans', fontWeight: '500', color: T.subText },
  headerTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay', fontWeight: '700', color: T.primary },
  saveBtn: { backgroundColor: T.primaryContainer, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  saveTxt: { color: '#FFFFFF', fontFamily: 'DMSans', fontSize: 14, fontWeight: '700' },
  block: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  blockBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.outlineVariant },
  blockTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay', fontWeight: '700', color: T.text, marginBottom: 16 },
  lbl: { fontSize: 11, fontFamily: 'DMSans', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: T.subText, marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: T.surfaceLow, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 14, fontFamily: 'DMSans', fontSize: 15, color: T.text, marginBottom: 12 },
  multi: { minHeight: 64, paddingTop: 14, borderRadius: 16 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'flex-start' },
  hint: { fontSize: 12, fontFamily: 'DMSans', color: T.subText, marginBottom: 12, paddingHorizontal: 4 },
  emojiBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: T.surfaceContainer, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  emojiBtnOn: { backgroundColor: T.primaryContainer },
  materialRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.outlineVariant, alignItems: 'flex-start' },
  matName: { fontSize: 14, fontFamily: 'DMSans', fontWeight: '700', color: T.text },
  matDetail: { fontSize: 12, fontFamily: 'DMMono', color: T.subText, marginTop: 2 },
  matTotal: { fontSize: 14, fontFamily: 'DMMono', fontWeight: '700', color: T.primary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: T.primary, marginTop: 4 },
  totalLabel: { fontSize: 14, fontFamily: 'DMSans', fontWeight: '700', color: T.text },
  totalValue: { fontSize: 16, fontFamily: 'DMMono', fontWeight: '700', color: T.primary },
  addMatBtn: { backgroundColor: T.surfaceLow, borderRadius: 16, paddingVertical: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: T.outlineVariant, alignItems: 'center', marginBottom: 12 },
  addMatBtnTxt: { fontFamily: 'DMSans', fontSize: 14, fontWeight: '500', color: T.primary },
  addMatForm: { backgroundColor: T.surfaceContainer, borderRadius: 16, padding: 12, marginBottom: 12 },
  btn: { backgroundColor: T.primaryContainer, borderRadius: 999, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { color: '#FFFFFF', fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },
  miniChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: T.surfaceHighest, marginRight: 6 },
  miniChipOn: { backgroundColor: T.primary },
  miniChipTxt: { fontSize: 12, fontFamily: 'DMSans', fontWeight: '600', color: T.subText },
  miniChipTxtOn: { color: '#FFFFFF' },
  pricingInfo: { backgroundColor: T.surfaceContainer, borderRadius: 16, padding: 16, gap: 8, marginBottom: 12 },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pricingLabel: { fontSize: 13, fontFamily: 'DMSans', color: T.subText },
  pricingVal: { fontSize: 14, fontFamily: 'DMMono', color: T.text },
  stickyBar: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.outlineVariant, paddingHorizontal: 16, paddingTop: 12 },
  stickySave: { backgroundColor: T.primaryContainer, borderRadius: 999, paddingVertical: 17, alignItems: 'center', elevation: 6 },
  stickySaveTxt: { color: '#FFFFFF', fontFamily: 'DMSans', fontSize: 16, fontWeight: '700' },
});
