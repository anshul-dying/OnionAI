import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, TextInput } from 'react-native';
import { ThemedHeader } from '@/components/ThemedHeader';
import { Colors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useModelContext } from '@/hooks/ModelContext';

const DEFAULT_MODEL_PATH = 'file:///storage/emulated/0/onionAI/Llama-3.2-1B-Instruct.pte';
const DEFAULT_TOKENIZER_PATH = 'file:///storage/emulated/0/onionAI/tokenizer.json';
const DEFAULT_TOKENIZER_BIN_PATH = 'file:///storage/emulated/0/onionAI/tokenizer.bin';

function formatBytes(size: number | null) {
  if (!size || size <= 0) return 'unknown';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function ModelsScreen() {
  const { modelUri, setModelUri, tokenizerUri, setTokenizerUri, tokenizerConfigUri, isLoadingAssets } = useModelContext();
  const [draftModelUri, setDraftModelUri] = React.useState(modelUri ?? '');
  const [draftTokenizerUri, setDraftTokenizerUri] = React.useState(tokenizerUri ?? '');
  const [modelSize, setModelSize] = React.useState<number | null>(null);
  const [tokenizerSize, setTokenizerSize] = React.useState<number | null>(null);

  React.useEffect(() => {
    setDraftModelUri(modelUri ?? '');
  }, [modelUri]);

  React.useEffect(() => {
    setDraftTokenizerUri(tokenizerUri ?? '');
  }, [tokenizerUri]);

  React.useEffect(() => {
    async function loadSizes() {
      if (!modelUri) {
        setModelSize(null);
      } else {
        const info = await FileSystem.getInfoAsync(modelUri);
        setModelSize(info.exists && typeof info.size === 'number' ? info.size : null);
      }

      if (!tokenizerUri) {
        setTokenizerSize(null);
      } else {
        const info = await FileSystem.getInfoAsync(tokenizerUri);
        setTokenizerSize(info.exists && typeof info.size === 'number' ? info.size : null);
      }
    }
    loadSizes();
  }, [modelUri, tokenizerUri]);

  const handleImportModel = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: '*/*',
    });
    if (result.canceled || !result.assets?.length) return;
    const file = result.assets[0];
    if (!file.name.endsWith('.pte') && !file.name.endsWith('.bin')) {
      Alert.alert('Invalid model file', 'Select an ExecuTorch model ending in .pte or .bin.');
      return;
    }
    setModelUri(file.uri);
    Alert.alert('Model selected', file.name);
  };

  const handleImportTokenizer = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: '*/*',
    });
    if (result.canceled || !result.assets?.length) return;
    const file = result.assets[0];
    const isValid = file.name.endsWith('.json') || file.name.endsWith('.bin') || file.name.endsWith('.model');
    if (!isValid) {
      Alert.alert('Invalid tokenizer file', 'Select tokenizer.json, tokenizer.bin, or tokenizer.model.');
      return;
    }
    setTokenizerUri(file.uri);
    Alert.alert('Tokenizer selected', file.name);
  };

  const applyManualPaths = async () => {
    const trimmedModel = draftModelUri.trim();
    const trimmedTokenizer = draftTokenizerUri.trim();
    if (!trimmedModel || !trimmedTokenizer) {
      Alert.alert('Missing paths', 'Set both model and tokenizer paths.');
      return;
    }
    const [modelInfo, tokenizerInfo] = await Promise.all([
      FileSystem.getInfoAsync(trimmedModel),
      FileSystem.getInfoAsync(trimmedTokenizer),
    ]);
    if (!modelInfo.exists) {
      Alert.alert('Model not found', trimmedModel);
      return;
    }
    if (!tokenizerInfo.exists) {
      Alert.alert('Tokenizer not found', trimmedTokenizer);
      return;
    }
    setModelUri(trimmedModel);
    setTokenizerUri(trimmedTokenizer);
    Alert.alert('Paths updated', 'Model and tokenizer paths were saved.');
  };

  const applyDefaultPaths = async () => {
    const tokenizerPath = (await FileSystem.getInfoAsync(DEFAULT_TOKENIZER_PATH)).exists
      ? DEFAULT_TOKENIZER_PATH
      : DEFAULT_TOKENIZER_BIN_PATH;
    setModelUri(DEFAULT_MODEL_PATH);
    setTokenizerUri(tokenizerPath);
    Alert.alert('Default paths applied', 'Using /storage/emulated/0/onionAI defaults.');
  };

  const clearPaths = () => {
    setModelUri(null);
    setTokenizerUri(null);
    Alert.alert('Cleared', 'Model and tokenizer paths were reset.');
  };

  return (
    <View style={styles.container}>
      <ThemedHeader 
        title="Models" 
        rightIcons={[{ name: 'refresh', onPress: applyDefaultPaths }]}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {isLoadingAssets ? 'Preparing' : modelUri && tokenizerUri ? 'Ready' : 'Action required'}
              </Text>
            </View>
            <Text style={styles.heroTitle}>{modelUri?.split('/').pop() || 'No model loaded'}</Text>
            <Text style={styles.heroSub}>
              {modelUri && tokenizerUri
                ? 'Local inference is configured. You can switch files or set exact storage paths below.'
                : 'Select a model and tokenizer to run fully local inference on-device.'}
            </Text>
            
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.outlineButton} onPress={clearPaths}>
                <Text style={styles.outlineButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={applyDefaultPaths}>
                <Text style={styles.primaryButtonText}>Use Defaults</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderSimple}>
          <Text style={styles.sectionTitle}>Current files</Text>
        </View>

        <View style={styles.modelCard}>
          <View style={styles.fileRow}>
            <View style={styles.fileHeader}>
              <MaterialIcons name="memory" size={20} color={Colors.dark.tertiary} />
              <Text style={styles.modelName}>Model</Text>
            </View>
            <Text style={styles.sizeText}>{formatBytes(modelSize)}</Text>
          </View>
          <Text style={styles.filePath}>{modelUri || 'Not set'}</Text>
          <TouchableOpacity style={styles.inlineButton} onPress={handleImportModel}>
            <Text style={styles.inlineButtonText}>Choose model file</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modelCard}>
          <View style={styles.fileRow}>
            <View style={styles.fileHeader}>
              <MaterialIcons name="description" size={20} color={Colors.dark.tertiary} />
              <Text style={styles.modelName}>Tokenizer</Text>
            </View>
            <Text style={styles.sizeText}>{formatBytes(tokenizerSize)}</Text>
          </View>
          <Text style={styles.filePath}>{tokenizerUri || 'Not set'}</Text>
          <TouchableOpacity style={styles.inlineButton} onPress={handleImportTokenizer}>
            <Text style={styles.inlineButtonText}>Choose tokenizer file</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modelCard}>
          <View style={styles.fileHeader}>
            <MaterialIcons name="tune" size={20} color={Colors.dark.tertiary} />
            <Text style={styles.modelName}>Manual path override</Text>
          </View>
          <Text style={styles.modelDesc}>
            Use absolute file URIs, for example file:///storage/emulated/0/onionAI/Llama-3.2-1B-Instruct.pte
          </Text>
          <View style={styles.pathField}>
            <Text style={styles.pathLabel}>Model path</Text>
            <TextInput
              style={styles.pathInput}
              placeholder="file:///.../model.pte"
              placeholderTextColor={Colors.dark.outline}
              value={draftModelUri}
              onChangeText={setDraftModelUri}
            />
          </View>
          <View style={styles.pathField}>
            <Text style={styles.pathLabel}>Tokenizer path</Text>
            <TextInput
              style={styles.pathInput}
              placeholder="file:///.../tokenizer.json"
              placeholderTextColor={Colors.dark.outline}
              value={draftTokenizerUri}
              onChangeText={setDraftTokenizerUri}
            />
          </View>
          <TouchableOpacity style={styles.primaryWideButton} onPress={applyManualPaths}>
            <Text style={styles.primaryButtonText}>Save paths</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.envCard}>
          <Text style={styles.envTitle}>Environment Status</Text>
          <View style={styles.envGrid}>
            <View style={styles.envItem}>
              <Text style={styles.envLabel}>Assets Loading</Text>
              <Text style={styles.envValue}>{isLoadingAssets ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.envItem}>
              <Text style={styles.envLabel}>Model Ready</Text>
              <Text style={styles.envValue}>{modelUri ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.envItem}>
              <Text style={styles.envLabel}>Tokenizer Ready</Text>
              <Text style={styles.envValue}>{tokenizerUri ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.envItem}>
              <Text style={styles.envLabel}>Tokenizer Config</Text>
              <Text style={styles.envValue}>{tokenizerConfigUri || 'Generated at runtime'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  heroCard: {
    backgroundColor: Colors.dark.surfaceContainerLow,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
    marginBottom: 32,
    overflow: 'hidden',
  },
  heroContent: {
    zIndex: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 218, 243, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.tertiary,
  },
  statusText: {
    color: Colors.dark.tertiary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    color: Colors.dark.onSurface,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSub: {
    color: Colors.dark.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  outlineButton: {
    flex: 1,
    backgroundColor: Colors.dark.surfaceContainerHighest,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: Colors.dark.onSurface,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.dark.primary,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.dark.onPrimary,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionHeaderSimple: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.dark.onSurface,
    fontSize: 20,
    fontWeight: '700',
  },
  storageInfo: {
    alignItems: 'flex-end',
    gap: 4,
  },
  storageText: {
    color: Colors.dark.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '500',
  },
  storageBar: {
    width: 100,
    height: 6,
    backgroundColor: Colors.dark.surfaceContainerHighest,
    borderRadius: 3,
    overflow: 'hidden',
  },
  storageProgress: {
    height: '100%',
    backgroundColor: Colors.dark.tertiary,
  },
  grid: {
    gap: 16,
  },
  modelCard: {
    backgroundColor: Colors.dark.surfaceContainerLow,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    padding: 10,
    backgroundColor: Colors.dark.surfaceContainerHighest,
    borderRadius: 16,
  },
  iconActive: {
    backgroundColor: 'rgba(0, 218, 243, 0.1)',
  },
  sizeText: {
    color: Colors.dark.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: Colors.dark.surfaceContainerHighest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modelName: {
    color: Colors.dark.onSurface,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modelDesc: {
    color: Colors.dark.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  fileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filePath: {
    color: Colors.dark.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inlineButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.dark.surfaceContainerHigh,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineButtonText: {
    color: Colors.dark.onSurface,
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  downloadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  downloadedText: {
    color: Colors.dark.tertiary,
    fontSize: 12,
    fontWeight: '600',
  },
  downloadSection: {
    gap: 8,
  },
  downloadMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  downloadProgressText: {
    color: Colors.dark.tertiary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  downloadSpeed: {
    color: Colors.dark.onSurfaceVariant,
    fontSize: 11,
  },
  importCard: {
    backgroundColor: Colors.dark.surfaceContainerLow,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  importIcon: {
    marginBottom: 12,
  },
  importText: {
    color: Colors.dark.onSurface,
    fontSize: 16,
    fontWeight: '700',
  },
  importSub: {
    color: Colors.dark.onSurfaceVariant,
    fontSize: 11,
    marginTop: 4,
  },
  envCard: {
    marginTop: 32,
    backgroundColor: Colors.dark.surfaceContainerLow,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  envTitle: {
    color: Colors.dark.outline,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 20,
  },
  envGrid: {
    gap: 16,
  },
  envItem: {
    gap: 4,
  },
  envLabel: {
    color: Colors.dark.onSurfaceVariant,
    fontSize: 11,
  },
  envValue: {
    color: Colors.dark.onSurface,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
  },
  manualPathCard: {
    marginTop: 24,
    backgroundColor: Colors.dark.surfaceContainerLow,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  pathField: {
    marginBottom: 12,
  },
  pathLabel: {
    color: Colors.dark.onSurfaceVariant,
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  primaryWideButton: {
    marginTop: 4,
    backgroundColor: Colors.dark.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  manualPathTitle: {
    color: Colors.dark.onSurface,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  manualPathSub: {
    color: Colors.dark.onSurfaceVariant,
    fontSize: 12,
    marginBottom: 16,
  },
  pathInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  pathInput: {
    flex: 1,
    backgroundColor: Colors.dark.surfaceContainerHighest,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    color: Colors.dark.onSurface,
    fontSize: 14,
  },
  pathButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
