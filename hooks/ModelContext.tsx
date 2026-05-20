import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';

export interface ModelInfo {
  id: string;
  name: string;
  modelUri: string;
  tokenizerUri: string | null;
  tokenizerConfigUri: string | null;
}

interface ModelContextType {
  modelUri: string | null;
  tokenizerUri: string | null;
  tokenizerConfigUri: string | null;
  availableModels: ModelInfo[];
  setModelUri: (uri: string | null) => void;
  setTokenizerUri: (uri: string | null) => void;
  switchModel: (model: ModelInfo) => Promise<void>;
  scanForModels: () => Promise<void>;
  isLoadingAssets: boolean;
  importCustomFile: (uri: string | null, type: 'model' | 'tokenizer') => Promise<string | null>;
}

const ModelContext = createContext<ModelContextType>({
  modelUri: null,
  tokenizerUri: null,
  tokenizerConfigUri: null,
  availableModels: [],
  setModelUri: () => {},
  setTokenizerUri: () => {},
  switchModel: async () => {},
  scanForModels: async () => {},
  isLoadingAssets: true,
  importCustomFile: async () => null,
});

export function ModelProvider({ children }: { children: ReactNode }) {
  const [modelUri, setModelUri] = useState<string | null>(null);
  const [tokenizerUri, setTokenizerUri] = useState<string | null>(null);
  const [tokenizerConfigUri, setTokenizerConfigUri] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);

  const scanForModels = async () => {
    setIsLoadingAssets(true);
    try {
      const appPrivateFolder = `${FileSystem.documentDirectory}`;
      const userIdMatch = appPrivateFolder.match(/\/user\/(\d+)\//);
      const userId = userIdMatch ? userIdMatch[1] : '0';
      const pkgMatch = appPrivateFolder.match(/\/([^/]+)\/files\/$/);
      const pkgName = pkgMatch ? pkgMatch[1] : 'com.anonymous.onionAI';

      const searchDirectories = Array.from(new Set([
        `file:///storage/emulated/${userId}/Android/media/${pkgName}`,
        'file:///storage/emulated/0/Android/media/com.anonymous.onionAI',
      ]));

      const modelFiles = ['model.pte', 'Llama-3.2-1B-Instruct.pte', 'qwen-int4.pte', 'qwen-int8.pte'];
      const tokenizerFiles = ['tokenizer.json', 'tokenizer.bin', 'tokenizer.model'];
      const foundModels: ModelInfo[] = [];

      console.log('--- Starting Model Scan ---');
      for (const dir of searchDirectories) {
        try {
          const info = await FileSystem.getInfoAsync(dir);
          if (!info.exists) {
            console.log(`[SCAN] Missing: ${dir}`);
            continue;
          }

          console.log(`[SCAN] Checking: ${dir}`);
          const contents = await FileSystem.readDirectoryAsync(dir);
          console.log(`[SCAN] Contents of ${dir}:`, contents);
          
          const checkDir = async (path: string, folderName: string) => {
            try {
              const dirContents = await FileSystem.readDirectoryAsync(path);
              let modelFile = modelFiles.find(f => dirContents.includes(f));
              if (!modelFile) {
                modelFile = dirContents.find(f => f.endsWith('.pte') || f.endsWith('.pth'));
              }

              if (modelFile) {
                const tokenizerFile = tokenizerFiles.find(f => dirContents.includes(f));
                const modelPath = `${path}/${modelFile}`;
                const tokenizerPath = tokenizerFile ? `${path}/${tokenizerFile}` : null;
                
                console.log(`[SCAN] FOUND: ${modelFile} at ${path}`);
                foundModels.push({
                  id: modelPath,
                  name: folderName === pkgName || folderName === 'onionAI' ? modelFile : folderName,
                  modelUri: modelPath,
                  tokenizerUri: tokenizerPath,
                  tokenizerConfigUri: dirContents.includes('tokenizer_config.json') ? `${path}/tokenizer_config.json` : null,
                });
              }
            } catch (e) {
              console.warn(`[SCAN] Error reading ${path}:`, e);
            }
          };

          await checkDir(dir, dir.split('/').pop() || '');

          for (const item of contents) {
            const subPath = `${dir}/${item}`;
            try {
              const subInfo = await FileSystem.getInfoAsync(subPath);
              if (subInfo.exists && subInfo.isDirectory) {
                await checkDir(subPath, item);
              }
            } catch (e) {}
          }
        } catch (e) {
          console.warn(`[SCAN] Error scanning ${dir}:`, e);
        }
      }

      const uniqueModels = Array.from(new Map(foundModels.map(m => [m.modelUri, m])).values());
      console.log(`--- Scan Complete: ${uniqueModels.length} unique models ---`);
      setAvailableModels(uniqueModels);

      if (!modelUri && uniqueModels.length > 0) {
        await switchModel(uniqueModels[0]);
      }
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  async function ensurePrivateReadableCopy(
    sourcePath: string | null,
    modelId: string
  ): Promise<string | null> {
    if (!sourcePath) return null;
    if (!shouldCopyToPrivateStorage(sourcePath)) return sourcePath;

    try {
      const sourceInfo = await FileSystem.getInfoAsync(sourcePath);
      if (!sourceInfo.exists) return null;

      const fileName = sourcePath.split('/').pop();
      const appPrivateFolder = `${FileSystem.documentDirectory}`;
      const modelCacheDir = `${appPrivateFolder}executorch-assets/${modelId.replace(/[^a-zA-Z0-9]/g, '_')}`;
      await FileSystem.makeDirectoryAsync(modelCacheDir, { intermediates: true });
      
      const destinationPath = `${modelCacheDir}/${fileName}`;

      if (sourceInfo.size && sourceInfo.size > 1024 * 1024 * 1024) {
        return sourcePath;
      }

      const destinationInfo = await FileSystem.getInfoAsync(destinationPath);
      const hasSameSize =
        destinationInfo.exists &&
        sourceInfo.size === destinationInfo.size;

      if (!hasSameSize) {
        console.log(`Copying to app-private storage: ${destinationPath}`);
        await FileSystem.copyAsync({ from: sourcePath, to: destinationPath });
      }

      return destinationPath;
    } catch (copyError) {
      console.warn('Unable to copy asset. Using original path.', copyError);
      return sourcePath;
    }
  }

  const switchModel = async (model: ModelInfo) => {
    setIsLoadingAssets(true);
    try {
      const appPrivateFolder = `${FileSystem.documentDirectory}`;
      const modelId = model.name;

      const runtimeModelPath = await ensurePrivateReadableCopy(model.modelUri, modelId);
      const runtimeTokenizerPath = await ensurePrivateReadableCopy(model.tokenizerUri, modelId);

      const fallbackConfig = {
        bos_token: '<|begin_of_text|>',
        eos_token: '<|end_of_text|>',
        pad_token: '<|end_of_text|>',
        model_max_length: 2048,
        tokenizer_class: 'TiktokenTokenizer',
        chat_template: `{% for message in messages %}{{'<|start_header_id|>' + message['role'] + '<|end_header_id|>\n\n' + message['content'] + '<|eot_id|>'}}{% endfor %}{{'<|start_header_id|>assistant<|end_header_id|>\n\n'}}`,
      };

      const configPath = `${appPrivateFolder}tokenizer_config_${modelId.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      let configContent = JSON.stringify(fallbackConfig);
      
      if (model.tokenizerConfigUri) {
        try {
          configContent = await FileSystem.readAsStringAsync(model.tokenizerConfigUri);
        } catch (e) {
          console.warn('Config unreadable, using fallback.');
        }
      }

      await FileSystem.writeAsStringAsync(configPath, configContent);
      
      setTokenizerConfigUri(configPath);
      setModelUri(runtimeModelPath);
      setTokenizerUri(runtimeTokenizerPath);
    } catch (error) {
      console.error('Switch error:', error);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  async function importCustomFile(uri: string | null, type: 'model' | 'tokenizer'): Promise<string | null> {
    if (!uri) return null;
    setIsLoadingAssets(true);
    try {
      const fileName = uri.split('/').pop() || (type === 'model' ? 'model.pte' : 'tokenizer.json');
      const appPrivateFolder = `${FileSystem.documentDirectory}`;
      const importFolder = `${appPrivateFolder}imported-assets`;
      await FileSystem.makeDirectoryAsync(importFolder, { intermediates: true });
      const destinationPath = `${importFolder}/${fileName}`;
      
      console.log(`[IMPORT] Copying custom ${type} from ${uri} to ${destinationPath}`);
      await FileSystem.copyAsync({ from: uri, to: destinationPath });
      
      if (type === 'model') {
        setModelUri(destinationPath);
      } else {
        setTokenizerUri(destinationPath);
      }
      return destinationPath;
    } catch (e) {
      console.error(`[IMPORT] Failed to import custom ${type} file:`, e);
      if (type === 'model') {
        setModelUri(uri);
      } else {
        setTokenizerUri(uri);
      }
      return uri;
    } finally {
      setIsLoadingAssets(false);
    }
  }

  useEffect(() => {
    scanForModels();
  }, []);

  function shouldCopyToPrivateStorage(path: string) {
    if (path.startsWith('content://') || path.includes('/cache/')) {
      return true;
    }
    return (
      path.startsWith('file:///storage/emulated/0/') &&
      !path.includes('/Android/data/') &&
      !path.includes('/Android/media/')
    );
  }

  return (
    <ModelContext.Provider value={{ 
      modelUri, 
      tokenizerUri, 
      tokenizerConfigUri,
      availableModels,
      setModelUri, 
      setTokenizerUri,
      switchModel,
      scanForModels,
      isLoadingAssets,
      importCustomFile
    }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModelContext() {
  return useContext(ModelContext);
}
