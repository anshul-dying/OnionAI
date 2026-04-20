import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

interface SystemMonitorProps {
  isMockMode: boolean;
  isThinking: boolean;
  hasModel: boolean;
  hasTokenizer: boolean;
  errorMessage?: string | null;
}

export const SystemMonitor: React.FC<SystemMonitorProps> = ({
  isMockMode,
  isThinking,
  hasModel,
  hasTokenizer,
  errorMessage,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.statItem}>
        <MaterialIcons name={isMockMode ? 'memory' : 'bolt'} size={14} color={Colors.dark.tertiary} />
        <Text style={styles.statValue}>{isMockMode ? 'Mock mode' : 'Native mode'}</Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.statItem}>
        <MaterialIcons name="sync" size={14} color={Colors.dark.primary} />
        <Text style={styles.statValue}>{isThinking ? 'Generating' : 'Idle'}</Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.statItem}>
        <MaterialIcons 
          name={hasModel && hasTokenizer ? 'check-circle' : 'error-outline'} 
          size={14} 
          color={hasModel && hasTokenizer ? Colors.dark.tertiary : Colors.dark.error} 
        />
        <Text style={[styles.statValue, !(hasModel && hasTokenizer) && styles.errorText]}>
          {hasModel && hasTokenizer ? 'Ready' : 'Missing files'}
        </Text>
      </View>

      {errorMessage ? (
        <View style={styles.errorRow}>
          <MaterialIcons name="warning" size={14} color={Colors.dark.error} />
          <Text style={styles.errorMessage} numberOfLines={2}>{errorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    color: Colors.dark.onSurface,
    fontSize: 12,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.dark.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '500',
  },
  errorText: {
    color: Colors.dark.error,
  },
  errorRow: {
    width: '100%',
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorMessage: {
    flex: 1,
    color: Colors.dark.error,
    fontSize: 11,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 12,
  },
});
