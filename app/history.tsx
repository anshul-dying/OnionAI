import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedHeader } from '@/components/ThemedHeader';
import { Colors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useChatHistory } from '@/hooks/ChatHistoryContext';

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessions, selectSession, createNewSession, deleteSession } = useChatHistory();
  const [query, setQuery] = useState('');

  const orderedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [sessions]
  );

  const filteredSessions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return orderedSessions;

    return orderedSessions.filter((session) => {
      const lastMessage = [...session.messages].reverse().find((message) => message.text.trim().length > 0);
      const searchableText = `${session.title} ${lastMessage?.text ?? ''}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [orderedSessions, query]);

  const closeHistory = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  };

  const openSession = (sessionId: string) => {
    selectSession(sessionId);
    closeHistory();
  };

  const createSessionAndOpen = () => {
    createNewSession();
    closeHistory();
  };

  const confirmDeleteSession = (sessionId: string) => {
    Alert.alert(
      'Delete chat',
      'This conversation will be removed from local history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSession(sessionId),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ThemedHeader
        title="History"
        onMenuPress={closeHistory}
        rightIcons={[{ name: 'add', onPress: createSessionAndOpen }]}
      />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={Colors.dark.onSurfaceVariant} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={Colors.dark.onSurfaceVariant}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {filteredSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="history" size={28} color={Colors.dark.outline} />
            <Text style={styles.emptyTitle}>No conversations found</Text>
            <Text style={styles.emptySub}>Start a new chat to populate your local history.</Text>
          </View>
        ) : (
          filteredSessions.map((session) => {
            const lastMessage =
              [...session.messages].reverse().find((message) => message.text.trim().length > 0) ?? session.messages[0];
            const preview = lastMessage?.text ?? 'Empty conversation';
            const updatedAt = new Date(session.updatedAt);
            const timeLabel = updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateLabel = updatedAt.toLocaleDateString([], { month: 'short', day: 'numeric' });

            return (
              <TouchableOpacity key={session.id} style={styles.historyCard} onPress={() => openSession(session.id)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{session.title}</Text>
                  <View style={styles.cardRightActions}>
                    <Text style={styles.cardTime}>{dateLabel} · {timeLabel}</Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={(event) => {
                        event.stopPropagation();
                        confirmDeleteSession(session.id);
                      }}
                    >
                      <MaterialIcons name="delete-outline" size={18} color={Colors.dark.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.cardPreview} numberOfLines={2}>{preview}</Text>
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>{session.messages.length} messages</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 24 }]} onPress={createSessionAndOpen}>
        <MaterialIcons name="add" size={32} color={Colors.dark.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceContainerHighest,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.onSurface,
    fontSize: 16,
    fontWeight: '500',
  },
  historyCard: {
    backgroundColor: Colors.dark.surfaceContainerLow,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    color: Colors.dark.onSurface,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  cardTime: {
    color: Colors.dark.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '600',
  },
  cardRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 2,
  },
  cardPreview: {
    color: Colors.dark.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 218, 243, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: Colors.dark.tertiary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    marginTop: 24,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  emptyTitle: {
    color: Colors.dark.onSurface,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    color: Colors.dark.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: Colors.dark.tertiary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
