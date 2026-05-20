import React from 'react';
import { ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
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
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Futuristic Spec Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <Text style={styles.heroTitle}>Local-first AI engine</Text>
            <View style={styles.specBadge}>
              <Text style={styles.specBadgeText}>v1.0.4 SPEC</Text>
            </View>
          </View>
          <Text style={styles.heroSubtitle}>
            OnionAI is engineered for completely private, low-latency mobile AI, executing quantized weight vectors locally on hardware without cloud dependencies.
          </Text>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Core Architecture</Text>
          <Text style={styles.sectionSubTitle}>PRINCIPLES</Text>
        </View>

        {/* Technical Cartridges */}
        {PRINCIPLES.map((item) => (
          <View key={item.title} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrapper}>
                <MaterialIcons name={item.icon} size={16} color={theme.tertiary} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </View>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
        ))}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Runtime Specifications</Text>
          <Text style={styles.sectionSubTitle}>ENGINE DEPLOYMENT LOG</Text>
        </View>

        {/* Terminal Log Console */}
        <View style={styles.consoleCard}>
          <View style={styles.consoleHeader}>
            <View style={styles.consoleDot} />
            <Text style={styles.consoleTitle}>onion_telemetry_console.log</Text>
          </View>
          
          <View style={styles.consoleContent}>
            {RUNTIME_NOTES.map((note, index) => (
              <View key={note} style={styles.noteRow}>
                <Text style={styles.lineNumber}>{String(index + 1).padStart(2, '0')}</Text>
                <View style={styles.noteTextContainer}>
                  <MaterialIcons name="chevron-right" size={14} color={theme.tertiary} style={{ marginTop: 2 }} />
                  <Text style={styles.noteText}>{note}</Text>
                </View>
              </View>
            ))}
          </View>
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
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  
  // Futuristic Spec Hero Card
  heroCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: theme.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroTitle: {
    color: theme.onSurface,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  specBadge: {
    backgroundColor: 'rgba(0, 218, 243, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  specBadgeText: {
    color: theme.tertiary,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    color: theme.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
  },

  // Sections
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 12,
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: theme.onSurface,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionSubTitle: {
    color: theme.outline,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Architecture Cartridge Cards
  card: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: theme.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 218, 243, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: theme.onSurface,
    fontSize: 14.5,
    fontWeight: '700',
  },
  cardDescription: {
    color: theme.onSurfaceVariant,
    fontSize: 12.5,
    lineHeight: 18,
  },

  // Terminal Log Console
  consoleCard: {
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.surfaceContainerHigh,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  consoleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.tertiary,
  },
  consoleTitle: {
    color: theme.outline,
    fontSize: 10.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  consoleContent: {
    padding: 16,
    gap: 12,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  lineNumber: {
    color: theme.outlineVariant || 'rgba(255, 255, 255, 0.2)',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '700',
  },
  noteTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  noteText: {
    flex: 1,
    color: theme.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

