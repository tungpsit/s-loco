import { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native'
import type { CreateServiceInput, UpdateServiceInput } from '../lib/api'

const colors = {
  primary: '#005E97',
  primaryContainer: '#0077B6',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerHigh: '#DEE4EF',
  surfaceContainerHighest: '#D6DDEA',
  surface: '#F4F7FB',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  outline: '#6B7694',
}

interface ServiceFormProps {
  initial?: Partial<CreateServiceInput>
  onSubmit: (data: CreateServiceInput | UpdateServiceInput) => Promise<void>
  loading?: boolean
}

export function ServiceForm({ initial, onSubmit, loading }: ServiceFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [categoryId] = useState(initial?.category_id ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial?.original_price ?? '')
  const [discountPrice, setDiscountPrice] = useState(initial?.discount_price ?? '')
  const [duration, setDuration] = useState(initial?.duration_minutes?.toString() ?? '')

  const isEdit = Boolean(initial?.name)

  function buildSlug(text: string) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
  }

  function handleNameChange(text: string) {
    setName(text)
    if (!isEdit && !slug.startsWith(buildSlug(text.slice(0, 10)))) {
      setSlug(buildSlug(text))
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên dịch vụ.')
      return
    }
    if (!price.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập giá dịch vụ.')
      return
    }

    const data: CreateServiceInput | UpdateServiceInput = isEdit
      ? {
          name: name.trim(),
          description: description.trim() || undefined,
          original_price: price,
          discount_price: discountPrice ? discountPrice : null,
          duration_minutes: duration ? parseInt(duration, 10) : null,
        }
      : {
          name: name.trim(),
          slug: slug || buildSlug(name),
          category_id: categoryId || '00000000-0000-0000-0000-000000000001',
          description: description.trim() || undefined,
          original_price: price,
          discount_price: discountPrice || undefined,
          duration_minutes: duration ? parseInt(duration, 10) : undefined,
        }

    await onSubmit(data)
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Thông tin dịch vụ</Text>

        <Text style={styles.label}>Tên dịch vụ *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={handleNameChange}
          placeholder="VD: Trải nghiệm tắm biển Sầm Sơn"
          placeholderTextColor={colors.outline}
          maxLength={200}
        />

        {!isEdit && (
          <>
            <Text style={styles.label}>Slug</Text>
            <TextInput
              style={styles.input}
              value={slug}
              onChangeText={(t) => setSlug(t.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="du-lich-sam-son"
              placeholderTextColor={colors.outline}
              autoCapitalize="none"
            />
          </>
        )}

        <Text style={styles.label}>Mô tả</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Mô tả chi tiết dịch vụ..."
          placeholderTextColor={colors.outline}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={2000}
        />

        <Text style={styles.sectionTitle}>Giá cả</Text>

        <Text style={styles.label}>Giá gốc (VNĐ) *</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="350000"
          placeholderTextColor={colors.outline}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Giá khuyến mãi (VNĐ)</Text>
        <TextInput
          style={styles.input}
          value={discountPrice}
          onChangeText={setDiscountPrice}
          placeholder="280000"
          placeholderTextColor={colors.outline}
          keyboardType="numeric"
        />

        <Text style={styles.sectionTitle}>Thông tin thêm</Text>

        <Text style={styles.label}>Thời lượng (phút)</Text>
        <TextInput
          style={styles.input}
          value={duration}
          onChangeText={setDuration}
          placeholder="60"
          placeholderTextColor={colors.outline}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>
            {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onSurface,
    marginTop: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.onSurface,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
})
