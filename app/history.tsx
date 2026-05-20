import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedHeader } from '@/components/ThemedHeader';
import { MaterialIcons } from '@expo/vector-icons';
import { useChatHistory } from '@/hooks/ChatHistoryContext';
import { useTheme } from '@/hooks/use-theme-color';

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = createStyles(theme);
  
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

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={theme.onSurfaceVariant} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={theme.onSurfaceVariant}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {filteredSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="history" size={28} color={theme.outline} />
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
                      <MaterialIcons name="delete-outline" size={18} color={theme.error} />
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
        <MaterialIcons name="add" size={32} color={theme.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceContainerHighest,
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
    color: theme.onSurface,
    fontSize: 16,
    fontWeight: '500',
  },
  historyCard: {
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.outlineVariant || 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    color: theme.onSurface,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  cardTime: {
    color: theme.onSurfaceVariant,
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
    color: theme.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.tertiary + '1A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: theme.tertiary,
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
    backgroundColor: theme.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.outlineVariant || 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  emptyTitle: {
    color: theme.onSurface,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    color: theme.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: theme.tertiary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
