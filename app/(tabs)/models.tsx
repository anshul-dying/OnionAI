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
    deleteModel,
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

  // Compute exact storage metrics for the disk utility layout
  const totalModelsSize = availableModels.reduce((acc, m) => acc + (m.size || 0), 0);
  const maxStorageLimit = 10 * 1024 * 1024 * 1024; // 10 GB visual reference limits
  const storagePercentage = Math.min((totalModelsSize / maxStorageLimit) * 100, 100);

  return (
    <View style={styles.container}>
      <ThemedHeader 
        title="Models" 
        showMenu={false}
        rightIcons={[{ name: 'refresh', onPress: applyDefaultPaths }]}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Futural Active Model Hero Dashboard */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.heroHeaderRow}>
              <View style={styles.statusBadge}>
                <View style={[
                  styles.statusDot, 
                  modelUri && tokenizerUri && !isLoadingAssets && { backgroundColor: theme.tertiary }
                ]} />
                <Text style={styles.statusText}>
                  {isLoadingAssets ? 'Orchestrating' : modelUri && tokenizerUri ? 'Engine Ready' : 'Core Required'}
                </Text>
              </View>
              <MaterialIcons name="settings-input-component" size={18} color={theme.outline} />
            </View>

            <Text style={styles.heroTitle} numberOfLines={1} ellipsizeMode="tail">
              {modelUri ? modelUri.split('/').pop() : 'No Model Engine Loaded'}
            </Text>
            
            <Text style={styles.heroSub}>
              {modelUri && tokenizerUri
                ? 'Local inference engine is active and compiled. Switch parameters below or manually map local storage paths.'
                : 'Select an ExecuTorch weights package and matching tokenizer file to start local processing.'}
            </Text>
            
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.clearButton} onPress={clearPaths} activeOpacity={0.7}>
                <MaterialIcons name="layers-clear" size={16} color={theme.onSurfaceVariant} style={{ marginRight: 6 }} />
                <Text style={styles.clearButtonText}>Clear Core</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={applyDefaultPaths} activeOpacity={0.8}>
                <MaterialIcons name="youtube-searched-for" size={16} color={theme.onPrimary} style={{ marginRight: 6 }} />
                <Text style={styles.primaryButtonText}>Scan Storage</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Disk Space Utility & Offline Storage Analyzer */}
        <View style={styles.storageAnalyzerCard}>
          <View style={styles.storageHeaderRow}>
            <View style={styles.headerTitleGroup}>
              <MaterialIcons name="donut-large" size={20} color={theme.tertiary} />
              <Text style={styles.storageTitle}>Local Resource footprint</Text>
            </View>
            <Text style={styles.storageLimitText}>10.0 GB Limit</Text>
          </View>
          
          <Text style={styles.storageDesc}>
            Offline models operate fully local. Manage cache sizes to prevent storage warnings.
          </Text>

          {/* Visual usage progress bar */}
          <View style={styles.storageVisualTrack}>
            <View style={[styles.storageVisualFill, { width: `${storagePercentage}%` }]} />
          </View>

          <View style={styles.storageMetaRow}>
            <View style={styles.metaLabelGroup}>
              <Text style={styles.storageLabel}>Total Footprint:</Text>
              <Text style={styles.storageValue}>{formatBytes(totalModelsSize)}</Text>
            </View>
            <Text style={styles.storageCountBadge}>{availableModels.length} models cached</Text>
          </View>
        </View>

        {/* Available offline models grid */}
        {availableModels.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Model Cartridges</Text>
              <Text style={styles.sectionSubTitle}>DISCOVERED OFFLINE</Text>
            </View>
            
            <View style={styles.grid}>
              {availableModels.map((model) => {
                const isActive = model.modelUri === modelUri;
                return (
                  <TouchableOpacity 
                    key={model.id} 
                    activeOpacity={0.9}
                    style={[
                      styles.modelCard, 
                      isActive && styles.activeModelCard
                    ]}
                    onPress={() => switchModel(model)}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleGroup}>
                        <View style={[styles.cardIconWrapper, isActive && styles.activeCardIconWrapper]}>
                          <MaterialIcons 
                            name="developer-board" 
                            size={18} 
                            color={isActive ? theme.tertiary : theme.outline} 
                          />
                        </View>
                        <View style={styles.cardTextGroup}>
                          <Text style={styles.modelName} numberOfLines={1}>{model.name}</Text>
                          <Text style={styles.modelClass}>LOCAL ENGINE</Text>
                        </View>
                      </View>
                      
                      {isActive ? (
                        <View style={styles.activeBadge}>
                          <View style={styles.activeBadgeDot} />
                          <Text style={styles.activeText}>Active</Text>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          style={styles.deleteButton} 
                          onPress={() => {
                            Alert.alert(
                              'Purge Model Cartridge',
                              `Confirm complete removal of ${model.name}? This will free offline device space.`,
                              [
                                { text: 'Abort', style: 'cancel' },
                                { text: 'Purge Weights', style: 'destructive', onPress: () => deleteModel(model) }
                              ]
                            );
                          }}
                        >
                          <MaterialIcons name="delete-sweep" size={18} color={theme.error} />
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.filePath} numberOfLines={1} ellipsizeMode="middle">
                      {model.modelUri}
                    </Text>

                    <View style={styles.cardFooter}>
                      <View style={[
                        styles.downloadedBadge,
                        !model.tokenizerUri && styles.warningDownloadedBadge
                      ]}>
                        <MaterialIcons 
                          name={model.tokenizerUri ? "verified-user" : "warning"} 
                          size={12} 
                          color={model.tokenizerUri ? theme.tertiary : "#ff9800"} 
                        />
                        <Text style={[
                          styles.downloadedText,
                          !model.tokenizerUri && { color: "#ff9800" }
                        ]}>
                          {model.tokenizerUri ? "Tokenizer Verified" : "Tokenizer Missing"}
                        </Text>
                      </View>
                      
                      {model.sizeFormatted && (
                        <View style={styles.sizeBadge}>
                          <Text style={styles.sizeText}>{model.sizeFormatted}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Active Configuration Panel */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Inference Details</Text>
            <Text style={styles.sectionSubTitle}>ACTIVE FILES</Text>
          </View>

          <View style={styles.paramCapsuleCard}>
            <View style={styles.capsuleRow}>
              <View style={styles.capsuleIconGroup}>
                <MaterialIcons name="memory" size={18} color={theme.tertiary} />
                <View>
                  <Text style={styles.capsuleTitle}>Core Model weights</Text>
                  <Text style={styles.capsuleSub} numberOfLines={1} ellipsizeMode="middle">
                    {modelUri ? modelUri : 'Not Configured'}
                  </Text>
                </View>
              </View>
              <View style={styles.capsuleStatsGroup}>
                <Text style={styles.capsuleSizeText}>{formatBytes(modelSize)}</Text>
                <TouchableOpacity style={styles.capsuleButton} onPress={handleImportModel}>
                  <MaterialIcons name="folder-open" size={16} color={theme.onSurface} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.capsuleDivider} />

            <View style={styles.capsuleRow}>
              <View style={styles.capsuleIconGroup}>
                <MaterialIcons name="psychology" size={18} color={theme.tertiary} />
                <View>
                  <Text style={styles.capsuleTitle}>Tokenizer config</Text>
                  <Text style={styles.capsuleSub} numberOfLines={1} ellipsizeMode="middle">
                    {tokenizerUri ? tokenizerUri : 'Not Configured'}
                  </Text>
                </View>
              </View>
              <View style={styles.capsuleStatsGroup}>
                <Text style={styles.capsuleSizeText}>{formatBytes(tokenizerSize)}</Text>
                <TouchableOpacity style={styles.capsuleButton} onPress={handleImportTokenizer}>
                  <MaterialIcons name="folder-open" size={16} color={theme.onSurface} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Manual Overrides */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Direct URI Controller</Text>
            <Text style={styles.sectionSubTitle}>MANUAL FILEPATH OVERRIDES</Text>
          </View>

          <View style={styles.overrideCard}>
            <Text style={styles.overrideWarning}>
              Ensure paths utilize the absolute file scheme, matching: file:///storage/emulated/...
            </Text>

            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Weights absolute URI (.pte)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="file:///storage/emulated/0/onionAI/Llama-3.2.pte"
                placeholderTextColor={theme.outline}
                value={draftModelUri}
                onChangeText={setDraftModelUri}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Tokenizer absolute URI (.json)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="file:///storage/emulated/0/onionAI/tokenizer.json"
                placeholderTextColor={theme.outline}
                value={draftTokenizerUri}
                onChangeText={setDraftTokenizerUri}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity 
              style={styles.overrideSaveButton} 
              onPress={applyManualPaths} 
              activeOpacity={0.8}
            >
              <MaterialIcons name="save" size={16} color={theme.onPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.overrideSaveText}>Save Custom Paths</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Environment Telemetry HUD */}
        <View style={styles.telemetryCard}>
          <Text style={styles.telemetryTitle}>System telemetry Console</Text>
          
          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>Asynchronous Loader</Text>
              <Text style={[styles.telemetryValue, isLoadingAssets && { color: theme.tertiary }]}>
                {isLoadingAssets ? 'BUSY' : 'STANDBY'}
              </Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>Runtime Engine</Text>
              <Text style={[styles.telemetryValue, modelUri && { color: theme.tertiary }]}>
                {modelUri ? 'ACTIVE' : 'OFFLINE'}
              </Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>Vocabulary Config</Text>
              <Text style={[styles.telemetryValue, tokenizerUri && { color: theme.tertiary }]}>
                {tokenizerUri ? 'VERIFIED' : 'PENDING'}
              </Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>Native Module Build</Text>
              <Text style={styles.telemetryValue} numberOfLines={1} ellipsizeMode="middle">
                {tokenizerConfigUri ? 'custom_spec' : 'executortorch_v0.4'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  
  // Futuristic Dashboard Card
  heroCard: {
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroContent: {
    zIndex: 10,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 218, 243, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.outline,
  },
  statusText: {
    color: theme.tertiary,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: theme.onSurface,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  heroSub: {
    color: theme.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.surfaceContainerHigh,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  clearButtonText: {
    color: theme.onSurface,
    fontSize: 13,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: theme.onPrimary,
    fontSize: 13,
    fontWeight: '700',
  },

  // Disk Utility Storage Analyzer
  storageAnalyzerCard: {
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 24,
  },
  storageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storageTitle: {
    color: theme.onSurface,
    fontSize: 15,
    fontWeight: '700',
  },
  storageLimitText: {
    color: theme.outline,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  storageDesc: {
    color: theme.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  storageVisualTrack: {
    width: '100%',
    height: 6,
    backgroundColor: theme.surfaceContainerHighest,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  storageVisualFill: {
    height: '100%',
    backgroundColor: theme.tertiary,
    borderRadius: 3,
  },
  storageMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storageLabel: {
    color: theme.onSurfaceVariant,
    fontSize: 12,
  },
  storageValue: {
    color: theme.tertiary,
    fontSize: 13,
    fontWeight: '700',
  },
  storageCountBadge: {
    backgroundColor: theme.surfaceContainerHigh,
    color: theme.onSurface,
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  // Sections
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: theme.onSurface,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubTitle: {
    color: theme.outline,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Model Cards List
  grid: {
    gap: 12,
  },
  modelCard: {
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeModelCard: {
    borderColor: theme.tertiary,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0, 218, 243, 0.01)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cardIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCardIconWrapper: {
    backgroundColor: 'rgba(0, 218, 243, 0.1)',
  },
  cardTextGroup: {
    flex: 1,
  },
  modelName: {
    color: theme.onSurface,
    fontSize: 15,
    fontWeight: '700',
  },
  modelClass: {
    color: theme.outline,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 218, 243, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeBadgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.tertiary,
  },
  activeText: {
    color: theme.tertiary,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 77, 77, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filePath: {
    color: theme.onSurfaceVariant,
    fontSize: 10.5,
    lineHeight: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 12,
    backgroundColor: theme.surfaceContainerHighest,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  downloadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 218, 243, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  warningDownloadedBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.04)',
  },
  downloadedText: {
    color: theme.tertiary,
    fontSize: 10,
    fontWeight: '700',
  },
  sizeBadge: {
    backgroundColor: theme.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sizeText: {
    color: theme.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '700',
  },

  // Active Parameters Capsule Card
  paramCapsuleCard: {
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  capsuleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  capsuleIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  capsuleTitle: {
    color: theme.onSurface,
    fontSize: 13,
    fontWeight: '700',
  },
  capsuleSub: {
    color: theme.outline,
    fontSize: 10.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
    width: 160,
  },
  capsuleStatsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  capsuleSizeText: {
    color: theme.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: theme.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  capsuleButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  capsuleDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },

  // Manual URI Overrides
  overrideCard: {
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  overrideWarning: {
    color: '#ff9800',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 152, 0, 0.04)',
    padding: 10,
    borderRadius: 12,
  },
  fieldWrapper: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: theme.onSurfaceVariant,
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: theme.surfaceContainerHighest,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    color: theme.onSurface,
    fontSize: 12.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.02)',
  },
  overrideSaveButton: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  overrideSaveText: {
    color: theme.onPrimary,
    fontSize: 13,
    fontWeight: '700',
  },

  // System Telemetry HUD
  telemetryCard: {
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 8,
  },
  telemetryTitle: {
    color: theme.outline,
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  telemetryGrid: {
    gap: 12,
  },
  telemetryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryLabel: {
    color: theme.onSurfaceVariant,
    fontSize: 12,
  },
  telemetryValue: {
    color: theme.outline,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11.5,
    fontWeight: '700',
  },
});

