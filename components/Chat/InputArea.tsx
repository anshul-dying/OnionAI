import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface InputAreaProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
}
export const InputArea: React.FC<InputAreaProps> = ({
  value,
  onChangeText,
  onSend,
  placeholder = 'Message OnionAI...',
}) => {
  const insets = useSafeAreaInsets();
  // Tab bar is roughly 64 + insets.bottom. We want the input to sit just above it.
  const bottomPadding = insets.bottom + 72;

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(197, 197, 212, 0.5)"
          multiline
        />

        <View style={styles.rightActions}>
          <TouchableOpacity 
            style={[styles.sendButton, !value.trim() && styles.sendButtonDisabled]} 
            onPress={onSend}
            disabled={!value.trim()}
          >
            <MaterialIcons name="send" size={20} color={Colors.dark.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceContainerHigh,
    borderRadius: 32,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  input: {
    flex: 1,
    color: Colors.dark.onSurface,
    fontSize: 14,
    paddingHorizontal: 14,
    maxHeight: 100,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    padding: 10,
  },
  sendButton: {
    backgroundColor: Colors.dark.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
