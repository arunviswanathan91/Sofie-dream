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

  // Material edit state
  const [editingMatId, setEditingMatId] = useState<string | null>(null);
  const [editMatName, setEditMatName] = useState('');
  const [editMatQty, setEditMatQty] = useState('1');
  const [editMatUnit, setEditMatUnit] = useState('pieces');
  const [editMatCost, setEditMatCost] = useState('');
  const [editMatCurrency, setEditMatCurrency] = useState('INR');

  const c = colors;
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

  const startEditMaterial = useCallback((m: InventoryMaterial) => {
    setEditingMatId(m.id);
    setEditMatName(m.name);
    setEditMatQty(String(m.quantity));
    setEditMatUnit(m.unit);
    setEditMatCost(String(m.costPerUnit));
    setEditMatCurrency(m.currency);
  }, []);

  const saveEditMaterial = useCallback(() => {
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
  }, [editingMatId, editMatName, editMatQty, editMatUnit, editMatCost, editMatCurrency]);

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
    <SafeAreaView style={[s.container, { backgroundColor: c.bg }]}>
      <View style={[s.header, { backgroundColor: c.bg }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={[s.cancel, { color: c.subText }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: c.primary }]}>New Product</Text>
        <TouchableOpacity onPress={handleSave} style={[s.saveBtn, { backgroundColor: c.primaryContainer }, saving && { opacity: 0.5 }]} disabled={saving}>
          <Text style={[s.saveTxt, { color: c.onPrimary }]}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

          {/* Product info */}
          <Block title="Product" colors={c}>
            <F label="Name *" colors={c}>
              <TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text }]} value={name} onChangeText={setName} placeholder="e.g. Rope Lamp" placeholderTextColor={c.outline} />
            </F>
            <F label="Description" colors={c}>
              <TextInput style={[s.input, s.multi, { backgroundColor: c.surfaceLow, color: c.text }]} value={description} onChangeText={setDescription} placeholder="What is this product?" placeholderTextColor={c.outline} multiline numberOfLines={2} textAlignVertical="top" />
            </F>
            <F label="Category" colors={c}>
              <TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text }]} value={category} onChangeText={setCategory} placeholder="e.g. Lamps, Bags, Scarves" placeholderTextColor={c.outline} />
            </F>

            <F label="Emoji" colors={c}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {EMOJIS.map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[s.emojiBtn, { backgroundColor: c.surfaceContainer }, emoji === e && { backgroundColor: c.primaryContainer }]}
                    onPress={() => setEmoji(e)}
                  >
                    <Text style={{ fontSize: 22 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </F>

            <F label="Notes" colors={c}>
              <TextInput style={[s.input, s.multi, { backgroundColor: c.surfaceLow, color: c.text }]} value={notes} onChangeText={setNotes} placeholder="Any additional notes…" placeholderTextColor={c.outline} multiline numberOfLines={2} textAlignVertical="top" />
            </F>
          </Block>

          {/* Materials */}
          <Block title="Materials & Costs" colors={c}>
            <Text style={[s.hint, { color: c.subText }]}>Add all materials that go into making this product.</Text>
            {materials.map((m) => (
              <View key={m.id}>
                {editingMatId === m.id ? (
                  <View style={[s.editMatForm, { backgroundColor: c.surfaceContainer }]}>
                    <F label="Material Name *" colors={c}>
                      <TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text }]} value={editMatName} onChangeText={setEditMatName} placeholder="Material name" placeholderTextColor={c.outline} />
                    </F>
                    <View style={s.row}>
                      <View style={{ flex: 1 }}>
                        <F label="Qty" colors={c}>
                          <TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text, marginBottom: 0 }]} value={editMatQty} onChangeText={setEditMatQty} keyboardType="decimal-pad" placeholder="1" placeholderTextColor={c.outline} />
                        </F>
                      </View>
                      <View style={{ flex: 1 }}>
                        <F label="Cost/unit" colors={c}>
                          <TextInput style={[s.input, { fontWeight: '700', backgroundColor: c.surfaceLow, color: c.text, marginBottom: 0 }]} value={editMatCost} onChangeText={setEditMatCost} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={c.outline} />
                        </F>
                      </View>
                    </View>
                    <F label="Unit" colors={c}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                        {UNITS.map((u) => (
                          <TouchableOpacity key={u} style={[s.miniChip, { backgroundColor: c.surfaceHighest }, editMatUnit === u && { backgroundColor: c.primary }]} onPress={() => setEditMatUnit(u)}>
                            <Text style={[s.miniChipTxt, { color: c.subText }, editMatUnit === u && { color: c.onPrimary }]}>{u}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </F>
                    <F label="Currency" colors={c}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                        {CURRENCIES.map((cur) => (
                          <TouchableOpacity key={cur} style={[s.miniChip, { backgroundColor: c.surfaceHighest }, editMatCurrency === cur && { backgroundColor: c.primary }]} onPress={() => setEditMatCurrency(cur)}>
                            <Text style={[s.miniChipTxt, { color: c.subText }, editMatCurrency === cur && { color: c.onPrimary }]}>{cur}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </F>
                    <View style={s.row}>
                      <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: c.primaryContainer }]} onPress={saveEditMaterial}><Text style={[s.btnTxt, { color: c.onPrimary }]}>Done</Text></TouchableOpacity>
                      <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: c.surfaceHigh }]} onPress={() => setEditingMatId(null)}><Text style={[s.btnTxt, { color: c.subText }]}>Cancel</Text></TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={[s.materialRow, { borderBottomColor: c.outlineVariant }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.matName, { color: c.text }]}>{m.name}</Text>
                      <Text style={[s.matDetail, { color: c.subText }]}>{m.quantity} {m.unit} × {m.currency} {m.costPerUnit.toFixed(2)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={[s.matTotal, { color: c.primary }]}>{m.currency} {(m.costPerUnit * m.quantity).toFixed(2)}</Text>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity onPress={() => startEditMaterial(m)}>
                          <Text style={{ color: c.primary, fontSize: 11, fontFamily: 'DMSans' }}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeMaterial(m.id)}>
                          <Text style={{ color: c.error, fontSize: 11, fontFamily: 'DMSans' }}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))}

            {materials.length > 0 && (
              <View style={[s.totalRow, { borderTopColor: c.primary }]}>
                <Text style={[s.totalLabel, { color: c.text }]}>Total Material Cost</Text>
                <Text style={[s.totalValue, { color: c.primary }]}>
                  {materials[0]?.currency ?? 'INR'} {totalCost.toFixed(2)}
                </Text>
              </View>
            )}

            {showAddMaterial ? (
              <View style={[s.addMatForm, { backgroundColor: c.surfaceContainer }]}>
                <F label="Material Name *" colors={c}>
                  <TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text }]} value={matName} onChangeText={setMatName} placeholder="e.g. Red yarn, Bulb, Wire" placeholderTextColor={c.outline} />
                </F>
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <F label="Qty" colors={c}>
                      <TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text, marginBottom: 0 }]} value={matQty} onChangeText={setMatQty} keyboardType="decimal-pad" placeholder="1" placeholderTextColor={c.outline} />
                    </F>
                  </View>
                  <View style={{ flex: 1 }}>
                    <F label="Cost per unit" colors={c}>
                      <TextInput style={[s.input, { fontWeight: '700', backgroundColor: c.surfaceLow, color: c.text, marginBottom: 0 }]} value={matCost} onChangeText={setMatCost} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={c.outline} />
                    </F>
                  </View>
                </View>
                <F label="Unit" colors={c}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    {UNITS.map((u) => (
                      <TouchableOpacity key={u} style={[s.miniChip, { backgroundColor: c.surfaceHighest }, matUnit === u && { backgroundColor: c.primary }]} onPress={() => setMatUnit(u)}>
                        <Text style={[s.miniChipTxt, { color: c.subText }, matUnit === u && { color: c.onPrimary }]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </F>
                <F label="Currency" colors={c}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    {CURRENCIES.map((cur) => (
                      <TouchableOpacity key={cur} style={[s.miniChip, { backgroundColor: c.surfaceHighest }, matCurrency === cur && { backgroundColor: c.primary }]} onPress={() => setMatCurrency(cur)}>
                        <Text style={[s.miniChipTxt, { color: c.subText }, matCurrency === cur && { color: c.onPrimary }]}>{cur}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </F>
                <View style={s.row}>
                  <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: c.primaryContainer }]} onPress={addMaterial}><Text style={[s.btnTxt, { color: c.onPrimary }]}>Add Material</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: c.surfaceHigh }]} onPress={() => setShowAddMaterial(false)}><Text style={[s.btnTxt, { color: c.subText }]}>Cancel</Text></TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={[s.addMatBtn, { backgroundColor: c.surfaceLow, borderColor: c.outlineVariant }]} onPress={() => setShowAddMaterial(true)}>
                <Text style={[s.addMatBtnTxt, { color: c.primary }]}>+ Add Material</Text>
              </TouchableOpacity>
            )}
          </Block>

          {/* Pricing */}
          <Block title="Pricing & Markup" colors={c}>
            {/* Markup explanation */}
            <View style={[s.markupExplainer, { backgroundColor: c.surfaceContainer }]}>
              <Text style={[s.markupExplainerTitle, { color: c.primary }]}>What is markup?</Text>
              <Text style={[s.markupExplainerBody, { color: c.subText }]}>
                Markup multiplies your material cost to determine the selling price.{'\n'}
                • 1.0 = sell at material cost (no profit){'\n'}
                • 1.5 = 50% profit above material cost{'\n'}
                • 2.0 = double your material cost{'\n'}
                Example: materials cost {materials[0]?.currency ?? 'INR'} 100 × markup 1.5 = {materials[0]?.currency ?? 'INR'} 150 suggested price.
              </Text>
            </View>
            <F label="Markup multiplier" colors={c}>
              <TextInput style={[s.input, { backgroundColor: c.surfaceLow, color: c.text }]} value={markup} onChangeText={setMarkup} keyboardType="decimal-pad" placeholder="1.5" placeholderTextColor={c.outline} />
            </F>
            {totalCost > 0 && (
              <View style={[s.pricingInfo, { backgroundColor: c.surfaceContainer }]}>
                <View style={s.pricingRow}>
                  <Text style={[s.pricingLabel, { color: c.subText }]}>Material Cost</Text>
                  <Text style={[s.pricingVal, { color: c.text }]}>{materials[0]?.currency ?? 'INR'} {totalCost.toFixed(2)}</Text>
                </View>
                <View style={s.pricingRow}>
                  <Text style={[s.pricingLabel, { color: c.subText, fontWeight: '700' }]}>Suggested Price</Text>
                  <Text style={[s.pricingVal, { color: c.accent, fontWeight: '700' }]}>{materials[0]?.currency ?? 'INR'} {suggestedPrice.toFixed(2)}</Text>
                </View>
              </View>
            )}
          </Block>

          {/* Usage reminder */}
          <Block title="Usage Reminder" colors={c} last>
            <Text style={[s.hint, { color: c.subText }]}>Get reminded to restock or review this product.</Text>
            <F label="Remind every…" colors={c}>
              <View style={s.row}>
                <TextInput
                  style={[s.input, { flex: 1, marginBottom: 0, backgroundColor: c.surfaceLow, color: c.text }]}
                  value={remindInterval}
                  onChangeText={setRemindInterval}
                  keyboardType="number-pad"
                  placeholder="e.g. 2"
                  placeholderTextColor={c.outline}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {REMINDER_UNITS.map((u) => (
                    <TouchableOpacity key={u} style={[s.miniChip, { backgroundColor: c.surfaceHighest }, remindUnit === u && { backgroundColor: c.primary }]} onPress={() => setRemindUnit(u)}>
                      <Text style={[s.miniChipTxt, { color: c.subText }, remindUnit === u && { color: c.onPrimary }]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </F>
            {remindInterval.trim() && parseInt(remindInterval) > 0 && (
              <Text style={[s.hint, { color: c.subText }]}>You'll be reminded every {remindInterval} {remindUnit}.</Text>
            )}
          </Block>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[s.stickyBar, { paddingBottom: insets.bottom + 8, backgroundColor: c.bg, borderTopColor: c.outlineVariant }]}>
        <TouchableOpacity onPress={handleSave} style={[s.stickySave, { backgroundColor: c.primaryContainer }, saving && { opacity: 0.5 }]} disabled={saving}>
          <Text style={[s.stickySaveTxt, { color: c.onPrimary }]}>{saving ? 'Saving…' : 'Save Product'}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  cancel: { fontSize: 15, fontFamily: 'DMSans', fontWeight: '500' },
  headerTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay', fontWeight: '700' },
  saveBtn: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  saveTxt: { fontFamily: 'DMSans', fontSize: 14, fontWeight: '700' },
  block: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  blockBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  blockTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay', fontWeight: '700', marginBottom: 16 },
  lbl: { fontSize: 11, fontFamily: 'DMSans', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 4 },
  input: { borderRadius: 999, paddingHorizontal: 20, paddingVertical: 14, fontFamily: 'DMSans', fontSize: 15, marginBottom: 12 },
  multi: { minHeight: 64, paddingTop: 14, borderRadius: 16 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'flex-start' },
  hint: { fontSize: 12, fontFamily: 'DMSans', marginBottom: 12, paddingHorizontal: 4 },
  emojiBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  materialRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'flex-start' },
  matName: { fontSize: 14, fontFamily: 'DMSans', fontWeight: '700' },
  matDetail: { fontSize: 12, fontFamily: 'DMMono', marginTop: 2 },
  matTotal: { fontSize: 14, fontFamily: 'DMMono', fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, marginTop: 4 },
  totalLabel: { fontSize: 14, fontFamily: 'DMSans', fontWeight: '700' },
  totalValue: { fontSize: 16, fontFamily: 'DMMono', fontWeight: '700' },
  addMatBtn: { borderRadius: 16, paddingVertical: 16, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', marginBottom: 12 },
  addMatBtnTxt: { fontFamily: 'DMSans', fontSize: 14, fontWeight: '500' },
  addMatForm: { borderRadius: 16, padding: 12, marginBottom: 12 },
  editMatForm: { borderRadius: 16, padding: 12, marginBottom: 12 },
  btn: { borderRadius: 999, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },
  miniChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, marginRight: 6 },
  miniChipTxt: { fontSize: 12, fontFamily: 'DMSans', fontWeight: '600' },
  markupExplainer: { borderRadius: 12, padding: 14, marginBottom: 12 },
  markupExplainerTitle: { fontSize: 13, fontFamily: 'DMSans', fontWeight: '700', marginBottom: 6 },
  markupExplainerBody: { fontSize: 12, fontFamily: 'DMSans', lineHeight: 20 },
  pricingInfo: { borderRadius: 16, padding: 16, gap: 8, marginBottom: 12 },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pricingLabel: { fontSize: 13, fontFamily: 'DMSans' },
  pricingVal: { fontSize: 14, fontFamily: 'DMMono' },
  stickyBar: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 12 },
  stickySave: { borderRadius: 999, paddingVertical: 17, alignItems: 'center', elevation: 6 },
  stickySaveTxt: { fontFamily: 'DMSans', fontSize: 16, fontWeight: '700' },
});
