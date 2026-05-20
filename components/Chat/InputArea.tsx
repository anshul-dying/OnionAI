import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme-color';

interface InputAreaProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({
  value,
  onChangeText,
  onSend,
  placeholder = 'Message OnionAI...',
  disabled = false,
}) => {
  const theme = useTheme();
  const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const bottomPadding = isKeyboardVisible ? 12 : 20;

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={[styles.inputWrapper, { backgroundColor: theme.surfaceContainerLow }]}>
        <TextInput
          style={[styles.input, { color: theme.onSurface }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.outline}
          multiline
          editable={!disabled}
          autoCorrect={false}
        />

        <View style={styles.rightActions}>
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              { backgroundColor: theme.primary },
              (!value.trim() || disabled) && styles.sendButtonDisabled
            ]} 
            onPress={onSend}
            disabled={!value.trim() || disabled}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityHint="Sends your message to OnionAI"
          >
            <MaterialIcons name="arrow-upward" size={18} color={theme.onPrimary} />
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
    borderRadius: 24,
    padding: 6,
    paddingLeft: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 6,
    paddingVertical: 8,
    maxHeight: 120,
    minHeight: 36,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 2,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.25,
  },
});
