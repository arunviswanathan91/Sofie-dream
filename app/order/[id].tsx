import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useOrders } from '../../hooks/useOrders';
import { useProfile } from '../../hooks/useProfile';
import { useTheme } from '../../context/ThemeContext';
import { getCurrencySymbol } from '../../lib/theme';
import { useNotifications } from '../../hooks/useNotifications';
import { CountdownTimer } from '../../components/CountdownTimer';
import { StatusBadge } from '../../components/StatusBadge';
import { TagChip } from '../../components/TagChip';
import { InvoicePreview } from '../../components/InvoicePreview';
import { Colors, Spacing, BorderRadius, StatusColors } from '../../lib/theme';
import type { OrderStatus } from '../../types';

const STATUS_PIPELINE: OrderStatus[] = ['request', 'accepted', 'shipped', 'delivered'];
const STATUS_LABELS: Record<OrderStatus, string> = {
  request: 'Request',
  accepted: 'Accepted',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function getStatusRibbonColor(status: OrderStatus | string, c: any): string {
  switch (status) {
    case 'accepted': return c.accent;
    case 'request': return c.accent;
    case 'shipped': return c.primary;
    case 'delivered': return c.primaryContainer;
    default: return c.outlineVariant;
  }
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orders, advanceStatus, togglePaid, deleteOrder, updateOrder } = useOrders();
  const { profile } = useProfile();
  const { colors } = useTheme();
  const c = colors;
  const { scheduleForOrder, cancelForOrder } = useNotifications();

  const order = useMemo(() => orders.find((o) => o.id === id), [orders, id]);

  const [showShipModal, setShowShipModal] = useState(false);
  const [shipmentId, setShipmentId] = useState('');
  const [carrier, setCarrier] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  if (!order) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: c.subText }]}>Order not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backLink, { color: c.primary }]}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentStageIndex = STATUS_PIPELINE.indexOf(order.status as OrderStatus);
  const nextStatus = currentStageIndex < STATUS_PIPELINE.length - 1
    ? STATUS_PIPELINE[currentStageIndex + 1]
    : null;

  const currencySymbol = getCurrencySymbol(order.currency);
  const ribbonColor = getStatusRibbonColor(order.status, c);

  const handleAdvance = async () => {
    if (!nextStatus) return;
    if (nextStatus === 'shipped') {
      setShowShipModal(true);
      return;
    }

    Alert.alert(
      `Mark as ${STATUS_LABELS[nextStatus]}?`,
      `This will update the order status to "${STATUS_LABELS[nextStatus]}".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setAdvancing(true);
            await advanceStatus(order, nextStatus);
            if (nextStatus === 'accepted') {
              await scheduleForOrder({ ...order, status: 'accepted', acceptedAt: new Date() });
            }
            if (nextStatus === 'delivered') {
              await cancelForOrder(order.id);
            }
            setAdvancing(false);
          },
        },
      ]
    );
  };

  const handleShipConfirm = async () => {
    setAdvancing(true);
    setShowShipModal(false);
    await advanceStatus(order, 'shipped', { shipmentId, carrier });
    setAdvancing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Order',
      `Are you sure you want to delete "${order.orderName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await cancelForOrder(order.id);
            await deleteOrder(order.id);
            router.back();
          },
        },
      ]
    );
  };

  const isActive = ['request', 'accepted'].includes(order.status);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header: back arrow + PlayfairDisplay title + edit */}
      <View style={[styles.header, { backgroundColor: c.bg }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: c.surfaceLow }]}>
          <Text style={[styles.backText, { color: c.primary }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>
            {order.orderName}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push(`/order/edit/${order.id}`)}
          style={[styles.editButton, { backgroundColor: c.surfaceLow }]}
        >
          <Text style={[styles.editText, { color: c.primary }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero section: customer name + status chip */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.heroSection}>
          <View style={styles.heroLeft}>
            <View style={[styles.statusChipRow]}>
              <View style={[styles.inProgressChip, { backgroundColor: ribbonColor + '22' }]}>
                <View style={[styles.inProgressDot, { backgroundColor: ribbonColor }]} />
                <Text style={[styles.inProgressText, { color: ribbonColor }]}>
                  {STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                </Text>
              </View>
              {order.isPaid ? (
                <View style={styles.paidBadge}>
                  <Text style={styles.paidText}>PAID</Text>
                </View>
              ) : (
                <View style={[styles.unpaidBadge, { backgroundColor: c.accent + '22' }]}>
                  <Text style={[styles.unpaidText, { color: c.accent }]}>UNPAID</Text>
                </View>
              )}
            </View>
            <Text style={[styles.heroCustomer, { color: c.primary }]}>{order.customerName}</Text>
            <Text style={[styles.heroOrderId, { color: c.subText }]}>#{order.id.slice(-8).toUpperCase()}</Text>
          </View>
          {isActive && (
            <CountdownTimer dueDate={order.dueDate} style={[styles.countdown, { color: c.accent }]} />
          )}
        </Animated.View>

        {/* Status Pipeline: pill chips row */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={[styles.pipeline, { backgroundColor: c.surfaceLow }]}>
          {STATUS_PIPELINE.map((s, i) => {
            const isCompleted = STATUS_PIPELINE.indexOf(order.status as OrderStatus) >= i;
            const isCurrent = order.status === s;
            const chipColor = isCurrent
              ? (s === 'accepted' || s === 'request' ? c.accent : c.primary)
              : c.surfaceHighest;

            return (
              <React.Fragment key={s}>
                <View style={[
                  styles.pipelineChip,
                  { backgroundColor: c.surfaceHighest },
                  isCurrent && { backgroundColor: chipColor },
                  !isCurrent && isCompleted && { backgroundColor: c.surfaceContainer },
                ]}>
                  <Text style={[
                    styles.pipelineChipText,
                    isCurrent && { color: '#FFFFFF', fontWeight: '700' },
                    !isCurrent && isCompleted && { color: c.subText },
                    !isCurrent && !isCompleted && { color: c.subText },
                  ]}>
                    {STATUS_LABELS[s]}
                  </Text>
                </View>
                {i < STATUS_PIPELINE.length - 1 && (
                  <View style={[
                    styles.pipelineConnector,
                    { backgroundColor: c.outlineVariant },
                    isCompleted && i < STATUS_PIPELINE.indexOf(order.status as OrderStatus) && { backgroundColor: c.primaryContainer },
                  ]} />
                )}
              </React.Fragment>
            );
          })}
        </Animated.View>

        {/* Completion Progress — visible always for active orders, quick-tap to update */}
        {isActive && (
          <Animated.View entering={FadeInDown.delay(120).duration(300)} style={[styles.progressSection, { backgroundColor: c.surfaceLow }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: c.text }]}>Completion</Text>
              <Text style={[styles.progressPctText, { color: c.accent }]}>{order.completionPercent ?? 0}%</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: c.outlineVariant }]}>
              <View style={[styles.progressFill, { width: `${order.completionPercent ?? 0}%` as any, backgroundColor: c.accent }]} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} keyboardShouldPersistTaps="always">
              {[0, 10, 25, 50, 75, 90, 100].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.progressChip, { backgroundColor: c.surfaceHighest }, (order.completionPercent ?? 0) === v && { backgroundColor: c.accent }]}
                  onPress={() => updateOrder(order.id, { completionPercent: v })}
                >
                  <Text style={[styles.progressChipTxt, { color: c.subText }, (order.completionPercent ?? 0) === v && { color: '#FFFFFF' }]}>{v}%</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Advance Status Button */}
        {nextStatus && order.status !== 'cancelled' && (
          <View style={styles.advanceSection}>
            <TouchableOpacity
              style={[
                styles.advanceButton,
                { backgroundColor: getStatusRibbonColor(nextStatus, c), shadowColor: c.primary },
                advancing && { opacity: 0.7 },
              ]}
              onPress={handleAdvance}
              disabled={advancing}
            >
              {advancing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.advanceText}>
                  Mark as {STATUS_LABELS[nextStatus]} →
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Main detail card — bg card, 24px radius, left ribbon */}
        <Animated.View entering={FadeInDown.delay(150).duration(300)} style={[styles.mainCard, { backgroundColor: c.card, shadowColor: c.text }]}>
          <View style={[styles.mainCardRibbon, { backgroundColor: ribbonColor }]} />
          <View style={styles.mainCardContent}>
            <DetailRow label="Customer" value={order.customerName} colors={c} />
            <DetailRow label="Address" value={order.customerAddress} colors={c} />
            {order.customerPhone && <DetailRow label="Phone" value={order.customerPhone} colors={c} />}
            {order.customerInstagram && <DetailRow label="Instagram" value={order.customerInstagram} colors={c} />}
            <DetailRow label="Due Date" value={format(new Date(order.dueDate), 'EEEE, MMMM d, yyyy')} colors={c} />
            {order.deliveryTime && <DetailRow label="Delivery Time" value={order.deliveryTime} colors={c} />}
            <DetailRow
              label="Price"
              value={`${currencySymbol}${order.askingPrice.toFixed(2)}`}
              valueStyle={{ fontFamily: 'DMSans', fontWeight: '700', color: c.primary, fontSize: 16 }}
              colors={c}
            />
            <DetailRow label="Category" value={order.craftCategory || '—'} colors={c} />
            {order.invoiceNumber && <DetailRow label="Invoice #" value={order.invoiceNumber} mono colors={c} />}
            {order.shipmentId && <DetailRow label="Shipment ID" value={order.shipmentId} mono colors={c} />}
            {order.carrier && <DetailRow label="Carrier" value={order.carrier} colors={c} />}
            {order.sourceLink && <DetailRow label="Source" value={order.sourceLink} colors={c} />}
            {order.description && <DetailRow label="Description" value={order.description} multiline colors={c} />}
            {order.internalNotes && <DetailRow label="Internal Notes" value={order.internalNotes} multiline colors={c} />}
            {order.paymentNotes && <DetailRow label="Payment Notes" value={order.paymentNotes} colors={c} />}
          </View>
        </Animated.View>

        {/* Tags */}
        {order.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={[styles.sectionLabel, { color: c.subText }]}>Tags</Text>
            <View style={styles.tagsRow}>
              {order.tags.map((tag) => (
                <TagChip key={tag} label={tag} />
              ))}
            </View>
          </View>
        )}

        {/* Photos */}
        {order.photos.length > 0 && (
          <View style={styles.photosSection}>
            <Text style={[styles.sectionLabel, { color: c.subText }]}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {order.photos.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.photo} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={[styles.sectionLabel, { color: c.subText }]}>Timeline</Text>
          <View style={[styles.timelineCard, { backgroundColor: c.card, shadowColor: c.text }]}>
            <DetailRow label="Created" value={format(new Date(order.createdAt), 'MMM d, yyyy')} colors={c} />
            {order.acceptedAt && <DetailRow label="Accepted" value={format(new Date(order.acceptedAt), 'MMM d, yyyy')} colors={c} />}
            {order.shippedAt && <DetailRow label="Shipped" value={format(new Date(order.shippedAt), 'MMM d, yyyy')} colors={c} />}
            {order.deliveredAt && <DetailRow label="Delivered" value={format(new Date(order.deliveredAt), 'MMM d, yyyy')} colors={c} />}
          </View>
        </View>

        {/* Action Buttons — pill shape */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.paidButton, { backgroundColor: c.primaryContainer }]}
            onPress={() => togglePaid(order)}
          >
            <Text style={styles.paidButtonText}>
              {order.isPaid ? 'Mark Unpaid' : 'Mark as Paid ✓'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.invoiceButton, { borderColor: c.primaryContainer, backgroundColor: c.primaryContainer + '18' }]}
            onPress={() => setShowInvoice(!showInvoice)}
          >
            <Text style={[styles.invoiceButtonText, { color: c.primary }]}>
              {showInvoice ? 'Hide Invoice' : '🧾 Generate Invoice'}
            </Text>
          </TouchableOpacity>

          {showInvoice && (
            <InvoicePreview
              order={order}
              businessName={profile.name}
              businessTagline={profile.tagline}
              businessAddress={profile.address}
              gstNumber={profile.gstNumber}
            />
          )}

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteText}>Delete Order</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: insets.bottom + 60 }} />
      </ScrollView>

      {/* Ship Modal */}
      <Modal visible={showShipModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: c.bg }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Mark as Shipped</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: c.surfaceLow, color: c.text }]}
              placeholder="Shipment / Tracking ID (optional)"
              placeholderTextColor={c.outline}
              value={shipmentId}
              onChangeText={setShipmentId}
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: c.surfaceLow, color: c.text }]}
              placeholder="Carrier (e.g. DHL, PostNL)"
              placeholderTextColor={c.outline}
              value={carrier}
              onChangeText={setCarrier}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancel, { backgroundColor: c.surfaceHighest }]}
                onPress={() => setShowShipModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: c.subText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, { backgroundColor: c.primary }]} onPress={handleShipConfirm}>
                <Text style={styles.modalConfirmText}>Mark Shipped →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  valueStyle,
  multiline,
  mono,
  colors: c,
}: {
  label: string;
  value: string;
  valueStyle?: object;
  multiline?: boolean;
  mono?: boolean;
  colors: any;
}) {
  return (
    <View style={[detailStyles.row, multiline && detailStyles.rowMultiline, { borderBottomColor: c.outlineVariant + '40' }]}>
      <Text style={[detailStyles.label, { color: c.subText }]}>{label}</Text>
      <Text
        style={[
          detailStyles.value,
          { color: c.text },
          mono && detailStyles.mono,
          multiline && detailStyles.valueMultiline,
          valueStyle,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowMultiline: {
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontFamily: 'DMSans',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontFamily: 'DMSans',
    flex: 2,
    textAlign: 'right',
  },
  valueMultiline: {
    textAlign: 'left',
    flex: 0,
  },
  mono: {
    fontFamily: 'DMSans',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 999,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  editText: {
    fontSize: 13,
    fontFamily: 'DMSans',
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  // Progress section
  progressSection: { borderRadius: 16, padding: 16, marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressTitle: { fontSize: 15, fontFamily: 'DMSans', fontWeight: '700' },
  progressPctText: { fontSize: 18, fontFamily: 'DMMono', fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 6 },
  progressChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, marginRight: 8 },
  progressChipTxt: { fontSize: 12, fontFamily: 'DMSans', fontWeight: '600' },
  // Not found
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  notFoundText: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 18,
  },
  backLink: {
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
  },
  // Hero section
  heroSection: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLeft: {
    flex: 1,
    gap: 6,
  },
  statusChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  inProgressChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  inProgressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inProgressText: {
    fontSize: 12,
    fontFamily: 'DMSans',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paidBadge: {
    backgroundColor: '#22C55E22',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  paidText: {
    fontSize: 10,
    fontFamily: 'DMSans',
    fontWeight: '700',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  unpaidBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unpaidText: {
    fontSize: 10,
    fontFamily: 'DMSans',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroCustomer: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  heroOrderId: {
    fontSize: 12,
    fontFamily: 'DMSans',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  countdown: {
    fontSize: 16,
    fontFamily: 'DMSans',
    fontWeight: '700',
  },
  // Status pipeline
  pipeline: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  pipelineChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    flexShrink: 1,
  },
  pipelineChipText: {
    fontSize: 11,
    fontFamily: 'DMSans',
    fontWeight: '600',
    textAlign: 'center',
  },
  pipelineConnector: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  // Advance button
  advanceSection: {
    marginBottom: 16,
  },
  advanceButton: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  advanceText: {
    color: '#FFFFFF',
    fontFamily: 'DMSans',
    fontSize: 15,
    fontWeight: '700',
  },
  // Main card
  mainCard: {
    borderRadius: 24,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  mainCardRibbon: {
    width: 4,
    alignSelf: 'stretch',
  },
  mainCardContent: {
    flex: 1,
    padding: 16,
  },
  // Section label
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'DMSans',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  // Tags
  tagsSection: {
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  // Photos
  photosSection: {
    marginBottom: 16,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 10,
  },
  // Timeline
  timelineSection: {
    marginBottom: 16,
  },
  timelineCard: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  // Actions
  actions: {
    gap: 10,
    marginBottom: 16,
  },
  paidButton: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  paidButtonText: {
    color: '#FFFFFF',
    fontFamily: 'DMSans',
    fontSize: 15,
    fontWeight: '700',
  },
  invoiceButton: {
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  invoiceButtonText: {
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#BA1A1A44',
    backgroundColor: '#BA1A1A0D',
  },
  deleteText: {
    color: '#BA1A1A',
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
  },
  // Ship Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
  },
  modalInput: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontFamily: 'DMSans',
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'DMSans',
    fontWeight: '600',
  },
  modalConfirm: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontFamily: 'DMSans',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
