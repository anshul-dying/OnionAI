import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/theme';

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

const styles = StyleSheet.create({
  cluster: {
    marginVertical: 8,
    maxWidth: '85%',
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
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    padding: 16,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  aiBubble: {
    backgroundColor: 'rgba(0, 100, 112, 0.4)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  userBubble: {
    backgroundColor: Colors.dark.primaryContainer,
    borderBottomRightRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  aiText: {
    color: Colors.dark.onSurface,
  },
  userText: {
    color: Colors.dark.onPrimaryContainer,
  },
  timestamp: {
    fontSize: 10,
    color: Colors.dark.onSurfaceVariant,
    marginTop: 4,
  },
  aiTimestamp: {
    marginLeft: 4,
  },
  userTimestamp: {
    textAlign: 'right',
    marginRight: 4,
  },
});
