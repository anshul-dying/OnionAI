import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedHeader } from '@/components/ThemedHeader';
import { useTheme } from '@/hooks/use-theme-color';

const PRINCIPLES = [
  {
    icon: 'shield' as const,
    title: 'Private by default',
    description: 'Inference runs on-device with local files and local session persistence.',
  },
  {
    icon: 'cloud-off' as const,
    title: 'Offline capable',
    description: 'Chat remains functional without network access when model assets are available.',
  },
  {
    icon: 'layers' as const,
    title: 'Scalable architecture',
    description: 'Routing, model management, and chat history are separated via providers and hooks.',
  },
];

const RUNTIME_NOTES = [
  'Chat state is orchestrated through useOnionAI with mock and native execution modes.',
  'Model and tokenizer discovery is centralized in ModelContext.',
  'Conversation sessions are persisted by ChatHistoryContext in local storage.',
];

export default function ExploreScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <ThemedHeader title="About OnionAI" showMenu={false} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Local-first AI assistant</Text>
          <Text style={styles.heroSubtitle}>
            OnionAI is built for private, reliable mobile AI with on-device inference and no cloud dependency.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Core principles</Text>
        {PRINCIPLES.map((item) => (
          <View key={item.title} style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name={item.icon} size={18} color={theme.tertiary} />
              <Text style={styles.cardTitle}>{item.title}</Text>
            </View>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Runtime notes</Text>
        <View style={styles.card}>
          {RUNTIME_NOTES.map((note) => (
            <View key={note} style={styles.noteRow}>
              <MaterialIcons name="check-circle" size={14} color={theme.tertiary} />
              <Text style={styles.noteText}>{note}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
    paddingBottom: 40,
    gap: 12,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: theme.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.outlineVariant || 'rgba(255, 255, 255, 0.05)',
  },
  heroTitle: {
    color: theme.onSurface,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
  },
  heroSubtitle: {
    color: theme.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 4,
    color: theme.outline,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: theme.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.outlineVariant || 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: theme.onSurface,
    fontSize: 16,
    fontWeight: '700',
  },
  cardDescription: {
    color: theme.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 19,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noteText: {
    flex: 1,
    color: theme.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 19,
  },
});
