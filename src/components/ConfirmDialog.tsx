import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { scale } from '../lib/scale'

interface Props {
  visible: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

/** 专注页里那几个"确定要…吗"的弹窗，样式和结构完全一样。 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.okBtn} onPress={onConfirm}>
              <Text style={styles.okText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(28),
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    borderWidth: 3,
    borderColor: '#E0D0C0',
    paddingHorizontal: scale(24),
    paddingVertical: scale(22),
    alignItems: 'center',
    gap: scale(10),
  },
  title: { fontSize: scale(17), fontFamily: 'PixelSCBold', color: '#5D4037' },
  message: { fontSize: scale(13), fontFamily: 'PixelSC', color: '#8D6E63', textAlign: 'center' },
  buttonRow: { flexDirection: 'row', gap: scale(12), marginTop: scale(6) },
  cancelBtn: {
    paddingHorizontal: scale(22),
    paddingVertical: scale(9),
    borderWidth: 2,
    borderColor: '#D7CCC8',
    borderRadius: scale(18),
  },
  cancelText: { fontSize: scale(13), fontFamily: 'PixelSC', color: '#8D6E63' },
  okBtn: {
    paddingHorizontal: scale(22),
    paddingVertical: scale(9),
    backgroundColor: '#F4A460',
    borderRadius: scale(18),
  },
  okText: { fontSize: scale(13), fontFamily: 'PixelSCBold', color: '#FFFFFF' },
})
