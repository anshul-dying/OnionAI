import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, TextInput } from 'react-native';
import { ThemedHeader } from '@/components/ThemedHeader';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useModelContext } from '@/hooks/ModelContext';
import { useTheme } from '@/hooks/use-theme-color';

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
  const theme = useTheme();
  const styles = createStyles(theme);
  const { 
    modelUri, 
    setModelUri, 
    tokenizerUri, 
    setTokenizerUri, 
    tokenizerConfigUri, 
    availableModels,
    switchModel,
    scanForModels,
    isLoadingAssets,
    importCustomFile
  } = useModelContext();
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
    await importCustomFile(file.uri, 'model');
    Alert.alert('Model selected & imported', file.name);
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
    await importCustomFile(file.uri, 'tokenizer');
    Alert.alert('Tokenizer selected & imported', file.name);
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
    await scanForModels();
    Alert.alert('Scan complete', `Found ${availableModels.length} potential models.`);
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
        showMenu={false}
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
                <Text style={styles.primaryButtonText}>Scan Storage</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {availableModels.length > 0 && (
          <>
            <View style={styles.sectionHeaderSimple}>
              <Text style={styles.sectionTitle}>Available Models</Text>
            </View>
            <View style={styles.grid}>
              {availableModels.map((model) => (
                <TouchableOpacity 
                  key={model.id} 
                  style={[
                    styles.modelCard, 
                    model.modelUri === modelUri && { borderColor: theme.tertiary, borderWidth: 2 }
                  ]}
                  onPress={() => switchModel(model)}
                >
                  <View style={styles.fileRow}>
                    <View style={styles.fileHeader}>
                      <MaterialIcons 
                        name="memory" 
                        size={20} 
                        color={model.modelUri === modelUri ? theme.tertiary : theme.outline} 
                      />
                      <Text style={styles.modelName}>{model.name}</Text>
                    </View>
                    {model.modelUri === modelUri && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeText}>Active</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.filePath} numberOfLines={1} ellipsizeMode="middle">
                    {model.modelUri}
                  </Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.downloadedBadge}>
                      <MaterialIcons 
                        name={model.tokenizerUri ? "check-circle" : "warning"} 
                        size={14} 
                        color={model.tokenizerUri ? theme.tertiary : "#ff9800"} 
                      />
                      <Text style={[
                        styles.downloadedText,
                        !model.tokenizerUri && { color: "#ff9800" }
                      ]}>
                        {model.tokenizerUri ? "Tokenizer found" : "Tokenizer missing"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ height: 32 }} />
          </>
        )}

        <View style={styles.sectionHeaderSimple}>
          <Text style={styles.sectionTitle}>Active File Details</Text>
        </View>


        <View style={styles.modelCard}>
          <View style={styles.fileRow}>
            <View style={styles.fileHeader}>
              <MaterialIcons name="memory" size={20} color={theme.tertiary} />
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
              <MaterialIcons name="description" size={20} color={theme.tertiary} />
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
            <MaterialIcons name="tune" size={20} color={theme.tertiary} />
            <Text style={styles.modelName}>Manual path override</Text>
          </View>
          <Text style={styles.modelDesc}>
            Use absolute file URIs, for example file:///storage/emulated/0/Android/data/com.anonymous.onionAI/files/Llama-3.2-1B-Instruct.pte
          </Text>
          <View style={styles.pathField}>
            <Text style={styles.pathLabel}>Model path</Text>
            <TextInput
              style={styles.pathInput}
              placeholder="file:///.../model.pte"
              placeholderTextColor={theme.outline}
              value={draftModelUri}
              onChangeText={setDraftModelUri}
            />
          </View>
          <View style={styles.pathField}>
            <Text style={styles.pathLabel}>Tokenizer path</Text>
            <TextInput
              style={styles.pathInput}
              placeholder="file:///.../tokenizer.json"
              placeholderTextColor={theme.outline}
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

const createStyles = (theme: any) => StyleSheet.create({
  activeBadge: {
    backgroundColor: theme.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeText: {
    color: theme.onTertiary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: theme.surfaceContainerLow,
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
    backgroundColor: theme.tertiary,
  },
  statusText: {
    color: theme.tertiary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    color: theme.onSurface,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSub: {
    color: theme.onSurfaceVariant,
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
    backgroundColor: theme.surfaceContainerHighest,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: theme.onSurface,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: theme.onPrimary,
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
    color: theme.onSurface,
    fontSize: 20,
    fontWeight: '700',
  },
  storageInfo: {
    alignItems: 'flex-end',
    gap: 4,
  },
  storageText: {
    color: theme.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '500',
  },
  storageBar: {
    width: 100,
    height: 6,
    backgroundColor: theme.surfaceContainerHighest,
    borderRadius: 3,
    overflow: 'hidden',
  },
  storageProgress: {
    height: '100%',
    backgroundColor: theme.tertiary,
  },
  grid: {
    gap: 16,
  },
  modelCard: {
    backgroundColor: theme.surfaceContainerLow,
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
    backgroundColor: theme.surfaceContainerHighest,
    borderRadius: 16,
  },
  iconActive: {
    backgroundColor: 'rgba(0, 218, 243, 0.1)',
  },
  sizeText: {
    color: theme.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: theme.surfaceContainerHighest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modelName: {
    color: theme.onSurface,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modelDesc: {
    color: theme.onSurfaceVariant,
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
    color: theme.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inlineButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.surfaceContainerHigh,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineButtonText: {
    color: theme.onSurface,
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
    color: theme.tertiary,
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
    color: theme.tertiary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  downloadSpeed: {
    color: theme.onSurfaceVariant,
    fontSize: 11,
  },
  importCard: {
    backgroundColor: theme.surfaceContainerLow,
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
    color: theme.onSurface,
    fontSize: 16,
    fontWeight: '700',
  },
  importSub: {
    color: theme.onSurfaceVariant,
    fontSize: 11,
    marginTop: 4,
  },
  envCard: {
    marginTop: 32,
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  envTitle: {
    color: theme.outline,
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
    color: theme.onSurfaceVariant,
    fontSize: 11,
  },
  envValue: {
    color: theme.onSurface,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
  },
  manualPathCard: {
    marginTop: 24,
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  pathField: {
    marginBottom: 12,
  },
  pathLabel: {
    color: theme.onSurfaceVariant,
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  primaryWideButton: {
    marginTop: 4,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  manualPathTitle: {
    color: theme.onSurface,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  manualPathSub: {
    color: theme.onSurfaceVariant,
    fontSize: 12,
    marginBottom: 16,
  },
  pathInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  pathInput: {
    flex: 1,
    backgroundColor: theme.surfaceContainerHighest,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    color: theme.onSurface,
    fontSize: 14,
  },
  pathButton: {
    width: 48,
    height: 48,
    backgroundColor: theme.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
