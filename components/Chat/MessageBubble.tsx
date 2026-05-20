import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme-color';

interface MessageBubbleProps {
  text: string;
  sender: 'ai' | 'user';
  timestamp: string;
  senderName?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  sender,
  timestamp,
  senderName,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const isAI = sender === 'ai';

  return (
    <View style={[styles.cluster, isAI ? styles.aiCluster : styles.userCluster]}>
      {isAI && senderName && (
        <Text style={styles.senderName}>{senderName}</Text>
      )}
      
      <View style={[
        styles.bubble,
        isAI ? styles.aiBubble : styles.userBubble
      ]}>
        <Text style={[
          styles.text,
          isAI ? styles.aiText : styles.userText
        ]}>
          {text}
        </Text>
      </View>
      
      <Text style={[
        styles.timestamp,
        isAI ? styles.aiTimestamp : styles.userTimestamp
      ]}>
        {timestamp}
      </Text>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  cluster: {
    marginVertical: 6,
    maxWidth: '82%',
  },
  aiCluster: {
    alignSelf: 'flex-start',
    marginLeft: 16,
  },
  userCluster: {
    alignSelf: 'flex-end',
    marginRight: 16,
  },
  senderName: {
    fontSize: 9.5,
    fontWeight: '800',
    color: theme.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
    marginLeft: 12,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  aiBubble: {
    backgroundColor: theme.surfaceContainerLow,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  userBubble: {
    backgroundColor: theme.primary,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  text: {
    fontSize: 14.5,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  aiText: {
    color: theme.onSurface,
  },
  userText: {
    color: theme.onPrimary,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 9,
    color: theme.outline,
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  aiTimestamp: {
    marginLeft: 12,
  },
  userTimestamp: {
    textAlign: 'right',
    marginRight: 12,
  },
});
