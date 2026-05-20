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

  const bottomPadding = isKeyboardVisible ? 8 : 12;

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={[styles.inputWrapper, { backgroundColor: theme.surfaceContainerHigh }]}>
        <TextInput
          style={[styles.input, { color: theme.onSurface }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.onSurfaceVariant + '80'}
          multiline
          editable={!disabled}
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
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityHint="Sends your message to OnionAI"
          >
            <MaterialIcons name="send" size={20} color={theme.onPrimary} />
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
    fontSize: 14,
    paddingHorizontal: 14,
    maxHeight: 100,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sendButton: {
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
