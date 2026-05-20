import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme-color';
import { useSettings } from '@/hooks/SettingsContext';

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
  const theme = useTheme();
  const styles = createStyles(theme);
  const { gpuEnabled, privacyEnabled } = useSettings();

  return (
    <View style={styles.container}>
      <View style={styles.telemetryRow}>
        {/* Environment Mode */}
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>MODE:</Text>
          <Text style={[styles.statValue, isMockMode ? styles.amberText : styles.greenText]}>
            {isMockMode ? 'SANDBOX' : 'NATIVE'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Inference State */}
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>STATE:</Text>
          <Text style={[styles.statValue, isThinking ? styles.blueText : styles.neutralText]}>
            {isThinking ? 'RUNNING' : 'IDLE'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Hardware NPU/GPU Acceleration */}
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>ACCEL:</Text>
          <Text style={[styles.statValue, gpuEnabled ? styles.greenText : styles.neutralText]}>
            {gpuEnabled ? 'GPU/NPU' : 'CPU'}
          </Text>
        </View>

        {ifPrivacyRequired(privacyEnabled, styles, theme)}
      </View>

      {/* Storage & Files Diagnostics */}
      <View style={styles.telemetryRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>MODEL:</Text>
          <Text style={[styles.statValue, hasModel ? styles.greenText : styles.redText]}>
            {hasModel ? 'LOADED' : 'MISSING'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>TOKENIZER:</Text>
          <Text style={[styles.statValue, hasTokenizer ? styles.greenText : styles.redText]}>
            {hasTokenizer ? 'LOADED' : 'MISSING'}
          </Text>
        </View>
      </View>

      {/* Diagnostics Console for compilation issues */}
      {errorMessage ? (
        <View style={styles.errorBox}>
          <View style={styles.errorHeader}>
            <MaterialIcons name="error-outline" size={13} color={theme.error} />
            <Text style={styles.errorTitle}>INFERENCE COMPILATION EXCEPTION</Text>
          </View>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
};

function ifPrivacyRequired(privacyEnabled: boolean, styles: any, theme: any) {
  if (!privacyEnabled) return null;
  return (
    <>
      <View style={styles.divider} />
      <View style={styles.statItem}>
        <MaterialIcons name="lock" size={10} color={theme.primary} style={{ marginRight: 2 }} />
        <Text style={styles.privacyText}>SECURE</Text>
      </View>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.outlineVariant || 'rgba(0, 0, 0, 0.1)',
    padding: 10,
    gap: 8,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    color: theme.outline,
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
    marginRight: 4,
  },
  statValue: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    height: 10,
    backgroundColor: theme.outlineVariant || 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 4,
  },
  greenText: {
    color: '#4caf50',
  },
  amberText: {
    color: '#ff9800',
  },
  redText: {
    color: theme.error,
  },
  blueText: {
    color: theme.primary,
  },
  neutralText: {
    color: theme.outline,
  },
  privacyText: {
    color: theme.primary,
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: 'rgba(255, 180, 171, 0.05)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.2)',
    padding: 8,
    marginTop: 2,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  errorTitle: {
    color: theme.error,
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  errorMessage: {
    color: theme.error,
    fontSize: 10,
    lineHeight: 14,
    fontFamily: 'monospace',
  },
});
