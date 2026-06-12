import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { UserAvatar } from '../src/components/UserAvatar'
import { useAuth } from '../src/stores/authStore'
import { scale } from '../src/lib/scale'

const GENDER_OPTIONS = [
  { key: 'male', label: '男' },
  { key: 'female', label: '女' },
  { key: 'secret', label: '保密' },
] as const

export default function EditProfileScreen() {
  const router = useRouter()
  const { profile, updateProfile, logout } = useAuth()

  const [nickname, setNickname] = useState(profile.nickname || '')
  const [catAccount, setCatAccount] = useState(profile.catAccount || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [gender, setGender] = useState(profile.gender || 'secret')
  const [birthday, setBirthday] = useState(profile.birthday || '')
  const [region, setRegion] = useState(profile.region || '')
  const [occupation, setOccupation] = useState(profile.occupation || '')
  const [school, setSchool] = useState(profile.school || '')

  // Modal states
  const [editField, setEditField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showGender, setShowGender] = useState(false)

  const getFieldLabel = (key: string) => {
    const map: Record<string, string> = {
      nickname: '名字', catAccount: '猫岛账号', bio: '简介',
      birthday: '生日', region: '地区', occupation: '职业', school: '学校',
    }
    return map[key] || key
  }

  const getFieldValue = (key: string) => {
    const map: Record<string, string> = {
      nickname, catAccount, bio, birthday, region, occupation, school,
      gender: GENDER_OPTIONS.find((g) => g.key === gender)?.label || '',
    }
    return map[key] || ''
  }

  const openFieldEditor = (key: string) => {
    setEditField(key)
    setEditValue(getFieldValue(key))
  }

  const saveField = () => {
    if (!editField) return
    const updates: any = { [editField]: editValue }
    if (editField === 'nickname') setNickname(editValue)
    if (editField === 'catAccount') setCatAccount(editValue)
    if (editField === 'bio') setBio(editValue)
    if (editField === 'birthday') setBirthday(editValue)
    if (editField === 'region') setRegion(editValue)
    if (editField === 'occupation') setOccupation(editValue)
    if (editField === 'school') setSchool(editValue)
    setEditField(null)
  }

  const handleSave = async () => {
    await updateProfile({
      nickname, catAccount, bio, gender, birthday, region, occupation, school,
    })
    router.back()
  }

  const handleAvatar = () => {
    Alert.alert('更换头像', '模拟环境暂不支持拍照/选图，后续接入相册选择器。')
  }

  const renderField = (key: string) => (
    <TouchableOpacity key={key} style={styles.fieldRow} onPress={() => openFieldEditor(key)}>
      <Text style={styles.fieldLabel}>{getFieldLabel(key)}</Text>
      <View style={styles.fieldRight}>
        <Text style={[styles.fieldValue, !getFieldValue(key) && styles.fieldPlaceholder]}>
          {getFieldValue(key) || '未设置'}
        </Text>
        <Text style={styles.fieldArrow}>›</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelBtn}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>编辑资料</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveBtn}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Avatar */}
        <TouchableOpacity style={styles.avatarSection} onPress={handleAvatar}>
          <View style={styles.avatarBox}>
            <UserAvatar size={72} />
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>📷</Text>
            </View>
          </View>
          <Text style={styles.avatarHint}>点击更换头像</Text>
        </TouchableOpacity>

        {/* Fields */}
        <View style={styles.fieldGroup}>
          {renderField('nickname')}
          {renderField('catAccount')}
          {renderField('bio')}

          {/* Gender */}
          <TouchableOpacity style={styles.fieldRow} onPress={() => setShowGender(true)}>
            <Text style={styles.fieldLabel}>性别</Text>
            <View style={styles.fieldRight}>
              <Text style={[styles.fieldValue, gender === 'secret' && styles.fieldPlaceholder]}>
                {GENDER_OPTIONS.find((g) => g.key === gender)?.label || '未设置'}
              </Text>
              <Text style={styles.fieldArrow}>›</Text>
            </View>
          </TouchableOpacity>

          {renderField('birthday')}
          {renderField('region')}
          {renderField('occupation')}
          {renderField('school')}
        </View>

        <Text style={styles.hint}>
          完善资料让你的猫岛好友更容易找到你
        </Text>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => { logout(); router.back() }}>
          <Text style={styles.logoutBtnText}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ====== Text Edit Modal ====== */}
      <Modal visible={!!editField} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <View style={styles.editModalHeader}>
              <TouchableOpacity onPress={() => setEditField(null)}>
                <Text style={styles.cancelBtn}>取消</Text>
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>{getFieldLabel(editField || '')}</Text>
              <TouchableOpacity onPress={saveField}>
                <Text style={styles.saveBtn}>完成</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.editModalBody}>
              <TextInput
                style={styles.editInput}
                value={editValue}
                onChangeText={setEditValue}
                placeholder={'请输入' + getFieldLabel(editField || '')}
                placeholderTextColor="#C0A090"
                autoFocus
                maxLength={editField === 'bio' ? 100 : 30}
                multiline={editField === 'bio'}
                textAlignVertical={editField === 'bio' ? 'top' : 'center'}
              />
              {editField === 'bio' && (
                <Text style={styles.charCount}>{editValue.length}/100</Text>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ====== Gender Picker Modal ====== */}
      <Modal visible={showGender} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowGender(false)}>
                <Text style={styles.cancelBtn}>取消</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>选择性别</Text>
              <View style={{ width: 40 }} />
            </View>
            {GENDER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.pickerItem, gender === opt.key && styles.pickerItemActive]}
                onPress={() => { setGender(opt.key); setShowGender(false) }}
              >
                <Text style={[styles.pickerItemText, gender === opt.key && styles.pickerItemTextActive]}>
                  {opt.label}
                </Text>
                {gender === opt.key && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(16), paddingVertical: scale(14),
    borderBottomWidth: 1, borderBottomColor: '#E8D5C4',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { fontSize: scale(16), fontWeight: '700', color: '#5D4037' },
  cancelBtn: { fontSize: scale(14), color: '#8D6E63' },
  saveBtn: { fontSize: scale(14), fontWeight: '700', color: '#F4A460' },

  body: { paddingBottom: scale(40) },

  // Avatar section
  avatarSection: { alignItems: 'center', paddingVertical: scale(28) },
  avatarBox: { position: 'relative' },
  avatarBadge: {
    position: 'absolute', right: -4, bottom: -4,
    width: scale(28), height: scale(28), borderRadius: scale(14),
    backgroundColor: '#F4A460', alignItems: 'center', justifyContent: 'center',
  },
  avatarBadgeText: { fontSize: scale(14) },
  avatarHint: { fontSize: scale(12), color: '#A1887F', marginTop: scale(10) },

  // Field groups
  fieldGroup: {
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: '#E8D5C4',
  },
  fieldRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(16), paddingVertical: scale(16),
    borderBottomWidth: 1, borderBottomColor: '#F5F0EB',
    minHeight: scale(52),
  },
  fieldLabel: { fontSize: scale(14), color: '#4E342E', width: scale(72) },
  fieldRight: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  fieldValue: { fontSize: scale(14), color: '#4E342E', textAlign: 'right', flexShrink: 1 },
  fieldPlaceholder: { color: '#C0A090' },
  fieldArrow: { fontSize: scale(18), color: '#C0A090', marginLeft: scale(8) },

  hint: {
    fontSize: scale(12), color: '#C0A090', textAlign: 'center',
    marginTop: scale(30), paddingHorizontal: scale(30),
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  editModal: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: scale(16), borderTopRightRadius: scale(16),
    height: '45%',
  },
  editModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(16), paddingVertical: scale(14),
    borderBottomWidth: 1, borderBottomColor: '#F0E8E0',
  },
  editModalTitle: { fontSize: scale(15), fontWeight: '700', color: '#5D4037' },
  editModalBody: { flex: 1, padding: scale(20) },
  editInput: {
    flex: 1, fontSize: scale(15), color: '#4E342E',
    lineHeight: scale(24),
  },
  charCount: { textAlign: 'right', fontSize: scale(11), color: '#C0A090', marginTop: scale(8) },

  // Gender picker
  pickerModal: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: scale(16), borderTopRightRadius: scale(16),
    paddingBottom: scale(20),
  },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(16), paddingVertical: scale(14),
    borderBottomWidth: 1, borderBottomColor: '#F0E8E0',
  },
  pickerTitle: { fontSize: scale(15), fontWeight: '700', color: '#5D4037' },
  pickerItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(20), paddingVertical: scale(16),
  },
  pickerItemActive: { backgroundColor: '#FFF8F0' },
  pickerItemText: { fontSize: scale(15), color: '#4E342E' },
  pickerItemTextActive: { fontWeight: '700', color: '#F4A460' },
  checkmark: { fontSize: scale(18), color: '#F4A460' },
  logoutBtn: {
    alignSelf: 'center', marginTop: scale(30),
    paddingHorizontal: scale(40), paddingVertical: scale(12),
    borderRadius: scale(20),
    borderWidth: 1, borderColor: '#D7CCC8',
    backgroundColor: '#FFFFFF',
  },
  logoutBtnText: { fontSize: scale(14), color: '#8D6E63', fontWeight: '600' },
})
