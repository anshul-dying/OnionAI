import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { ThemedHeader } from '@/components/ThemedHeader';
import { Colors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

const HISTORY_DATA = [
  {
    id: '1',
    title: 'Neural Architecture Design',
    preview: "Let's explore the implications of sparse attention mechanisms in large scale transformer models and how they...",
    time: '10:42 AM',
    tag: 'AI Analysis',
  },
  {
    id: '2',
    title: 'Sustainable Urban Farming',
    preview: 'Provide a list of vertical farming equipment suitable for a small warehouse in Brooklyn with limited sunlight...',
    time: '8:15 AM',
  },
];

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <ThemedHeader 
        title="History" 
        rightIcons={[{ name: 'tune', onPress: () => {} }]}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={Colors.dark.onSurfaceVariant} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={Colors.dark.onSurfaceVariant}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today</Text>
        </View>

        {HISTORY_DATA.map((item) => (
          <TouchableOpacity key={item.id} style={styles.historyCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardTime}>{item.time}</Text>
            </View>
            <Text style={styles.cardPreview} numberOfLines={2}>{item.preview}</Text>
            {item.tag && (
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{item.tag}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Yesterday</Text>
        </View>

        <TouchableOpacity style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>JavaScript Refactoring</Text>
            <Text style={styles.cardTime}>Yesterday</Text>
          </View>
          <Text style={[styles.cardPreview, styles.monoPreview]} numberOfLines={2}>
            const refactor = (code) =&gt; {' { // analyzing complex logic structures }'}
          </Text>
          <View style={[styles.tagBadge, { backgroundColor: 'rgba(186, 195, 255, 0.1)' }]}>
            <Text style={[styles.tagText, { color: Colors.dark.primary }]}>Coding</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
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
    paddingBottom: 120,
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
  sectionHeader: {
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.dark.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
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
  cardPreview: {
    color: Colors.dark.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  monoPreview: {
    fontFamily: 'monospace',
    fontSize: 12,
    opacity: 0.8,
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
  fab: {
    position: 'absolute',
    bottom: 100,
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
