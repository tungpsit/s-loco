import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import type { VoucherItem } from '../lib/api'
import { vouchersApi } from '../lib/api'
import { borderRadius, colors, spacing, typography } from '../lib/theme'

const { width } = Dimensions.get('window')

interface Props {
  voucher: VoucherItem
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

type Tab = 'phone' | 'link'

export default function GiftModal({ voucher, visible, onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<Tab>('phone')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [giftLink, setGiftLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingLink, setLoadingLink] = useState(false)

  if (!visible) return null

  const handleSendPhone = async () => {
    if (!phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại người nhận.')
      return
    }
    setLoading(true)
    try {
      await vouchersApi.giftByPhone(voucher.id, phone.trim(), message.trim() || undefined)
      Alert.alert('Thành công', `Đã tặng voucher cho ${phone.trim()}!`, [
        {
          text: 'OK',
          onPress: () => {
            onSuccess()
            onClose()
          },
        },
      ])
    } catch (err: any) {
      Alert.alert('Lỗi', err.message ?? 'Không thể tặng voucher. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = async () => {
    setLoadingLink(true)
    try {
      const result = await vouchersApi.createGiftLink(voucher.id)
      setGiftLink(result.share_url)
    } catch (err: any) {
      Alert.alert('Lỗi', err.message ?? 'Không thể tạo link. Vui lòng thử lại.')
    } finally {
      setLoadingLink(false)
    }
  }

  const handleCopyLink = () => {
    Clipboard.setString(giftLink)
    Alert.alert('Đã sao chép', 'Link tặng đã được sao chép vào bộ nhớ tạm.')
  }

  const handleShareLink = async () => {
    try {
      await Share.share({ message: `Tôi tặng bạn một voucher từ S-Loco! Nhận ngay: ${giftLink}` })
    } catch {
      // User cancelled share
    }
  }

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.center}
      >
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Tặng voucher</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeBtn}>✕</Text>
            </Pressable>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <Pressable
              style={[styles.tabBtn, tab === 'phone' && styles.tabBtnActive]}
              onPress={() => setTab('phone')}
            >
              <Text style={[styles.tabBtnText, tab === 'phone' && styles.tabBtnTextActive]}>
                Gửi qua số điện thoại
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, tab === 'link' && styles.tabBtnActive]}
              onPress={() => setTab('link')}
            >
              <Text style={[styles.tabBtnText, tab === 'link' && styles.tabBtnTextActive]}>
                Lấy link tặng
              </Text>
            </Pressable>
          </View>

          {/* Phone tab */}
          {tab === 'phone' && (
            <View style={styles.body}>
              <Text style={styles.label}>Số điện thoại người nhận</Text>
              <TextInput
                style={styles.input}
                placeholder="0xxx xxx xxx"
                placeholderTextColor={colors.onSurfaceVariant}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                autoFocus
              />
              <Text style={styles.label}>Lời nhắn (tùy chọn)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Chúc bạn một ngày tốt lành!"
                placeholderTextColor={colors.onSurfaceVariant}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
              <Pressable
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleSendPhone}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Gửi tặng</Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Link tab */}
          {tab === 'link' && (
            <View style={styles.body}>
              {!giftLink ? (
                <>
                  <Text style={styles.linkDesc}>
                    Link tặng sẽ có hiệu lực trong 24h. Người nhận cần đăng nhập S-Loco để nhận
                    voucher.
                  </Text>
                  <Pressable
                    style={[styles.primaryBtn, loadingLink && styles.primaryBtnDisabled]}
                    onPress={handleCreateLink}
                    disabled={loadingLink}
                  >
                    {loadingLink ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Tạo link tặng</Text>
                    )}
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.label}>Link tặng của bạn</Text>
                  <View style={styles.linkBox}>
                    <Text style={styles.linkText} numberOfLines={2}>
                      {giftLink}
                    </Text>
                  </View>
                  <View style={styles.linkActions}>
                    <Pressable style={styles.secondaryBtn} onPress={handleCopyLink}>
                      <Text style={styles.secondaryBtnText}>Sao chép</Text>
                    </Pressable>
                    <Pressable style={styles.primaryBtnSmall} onPress={handleShareLink}>
                      <Text style={styles.primaryBtnText}>Chia sẻ</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    width: width - spacing.xl * 2,
    maxWidth: 420,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  title: {
    ...typography.titleMd,
    fontWeight: '600',
  },
  closeBtn: {
    fontSize: 18,
    color: colors.onSurfaceVariant,
    padding: 4,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabBtnText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  body: {
    padding: spacing.base,
    gap: spacing.md,
  },
  label: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    padding: 12,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  primaryBtnSmall: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkDesc: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  linkBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  linkText: {
    ...typography.bodySm,
    color: colors.primary,
  },
  linkActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.full,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryBtnText: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
})
