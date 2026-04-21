import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';

interface ModelContextType {
  modelUri: string | null;
  tokenizerUri: string | null;
  tokenizerConfigUri: string | null;
  setModelUri: (uri: string | null) => void;
  setTokenizerUri: (uri: string | null) => void;
  isLoadingAssets: boolean;
}

const ModelContext = createContext<ModelContextType>({
  modelUri: null,
  tokenizerUri: null,
  tokenizerConfigUri: null,
  setModelUri: () => {},
  setTokenizerUri: () => {},
  isLoadingAssets: true,
});

export function ModelProvider({ children }: { children: ReactNode }) {
  const [modelUri, setModelUri] = useState<string | null>(null);
  const [tokenizerUri, setTokenizerUri] = useState<string | null>(null);
  const [tokenizerConfigUri, setTokenizerConfigUri] = useState<string | null>(null);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);

  useEffect(() => {
    async function findFirstExistingFile(
      baseDirectories: string[],
      fileNames: string[]
    ): Promise<string | null> {
      for (const baseDirectory of baseDirectories) {
        try {
          const dirInfo = await FileSystem.getInfoAsync(baseDirectory);
          if (dirInfo.exists) {
            const files = await FileSystem.readDirectoryAsync(baseDirectory);
            console.log(`Contents of ${baseDirectory}:`, files);
          }
        } catch (e) {
          // Silent fail for directory read
        }

        for (const fileName of fileNames) {
          const candidatePath = `${baseDirectory}/${fileName}`;
          try {
            const info = await FileSystem.getInfoAsync(candidatePath);
            if (info.exists) {
              console.log(`[FOUND] ${fileName} at ${candidatePath}`);
              return candidatePath;
            }
          } catch (e) {
            // Silent fail for file check
          }
        }
      }
      return null;
    }

    async function getFileSize(path: string | null): Promise<number | null> {
      if (!path) return null;
      try {
        const info = await FileSystem.getInfoAsync(path);
        if (!info.exists || typeof info.size !== 'number') return null;
        return info.size;
      } catch (e) {
        return null;
      }
    }

    function shouldCopyToPrivateStorage(path: string) {
      // Don't copy if it's already in an app-specific folder (data or media)
      return (
        path.startsWith('file:///storage/emulated/0/') &&
        !path.includes('/Android/data/') &&
        !path.includes('/Android/media/')
      );
    }

    async function ensurePrivateReadableCopy(
      sourcePath: string | null,
      destinationPath: string
    ): Promise<string | null> {
      if (!sourcePath) return null;
      if (!shouldCopyToPrivateStorage(sourcePath)) return sourcePath;

      try {
        const sourceInfo = await FileSystem.getInfoAsync(sourcePath);
        if (!sourceInfo.exists) return null;

        // For large models (> 1GB), avoid copying from Downloads to Internal if possible
        // to save space and time. We'll try to use the direct path first.
        if (sourceInfo.size && sourceInfo.size > 1024 * 1024 * 1024) {
          console.log('Large model detected, attempting to use direct path from shared storage.');
          return sourcePath;
        }

        const destinationInfo = await FileSystem.getInfoAsync(destinationPath);
        const hasSameSize =
          destinationInfo.exists &&
          typeof sourceInfo.size === 'number' &&
          typeof destinationInfo.size === 'number' &&
          sourceInfo.size === destinationInfo.size;

        if (!hasSameSize) {
          console.log('Copying asset to app-private storage:', sourcePath);
          await FileSystem.copyAsync({ from: sourcePath, to: destinationPath });
        }

        return destinationPath;
      } catch (copyError) {
        console.warn('Unable to copy asset. Using original path.', copyError);
        return sourcePath;
      }
    }

    async function loadDefaultAssets() {
      try {
        console.log('--- ModelContext: Initializing Paths ---');
        const appPrivateFolder = `${FileSystem.documentDirectory}`;
        const appPrivateAssetDirectory = `${appPrivateFolder}executorch-assets`;
        
        const userIdMatch = appPrivateFolder.match(/\/user\/(\d+)\//);
        const userId = userIdMatch ? userIdMatch[1] : '0';
        const pkgMatch = appPrivateFolder.match(/\/([^/]+)\/files\/$/);
        const pkgName = pkgMatch ? pkgMatch[1] : 'com.anonymous.onionAI';

        const dynamicExternalDir = `file:///storage/emulated/${userId}/Android/data/${pkgName}/files`;
        const dynamicMediaDir = `file:///storage/emulated/${userId}/Android/media/${pkgName}`;
        const dynamicMediaBaseDir = `file:///storage/emulated/${userId}/Android/media`;
        const legacyExternalDir = `file:///storage/emulated/${userId}/onionAI`;

        console.log(`[GUIDE] If files are not found, move them to: /Android/media/${pkgName}/`);

        const searchDirectories = [
          dynamicMediaDir,
          dynamicMediaBaseDir,
          dynamicExternalDir,
          legacyExternalDir,
          `file:///storage/emulated/${userId}/Download/onionAI`,
          `file:///storage/emulated/${userId}/Download`,
          'file:///storage/emulated/0/Android/media/com.anonymous.onionAI',
          'file:///storage/emulated/0/Android/data/com.anonymous.onionAI/files',
          'file:///storage/emulated/0/onionAI',
        ];

        const configPath = `${appPrivateFolder}tokenizer_config.json`;
        const privateModelPath = `${appPrivateAssetDirectory}/Llama-3.2-1B-Instruct.pte`;
        const privateTokenizerJsonPath = `${appPrivateAssetDirectory}/tokenizer.json`;

        await FileSystem.makeDirectoryAsync(appPrivateAssetDirectory, { intermediates: true });

        const modelPath = await findFirstExistingFile(searchDirectories, ['Llama-3.2-1B-Instruct.pte']);
        const tokenizerPath = await findFirstExistingFile(searchDirectories, ['tokenizer.json', 'tokenizer.bin']);
        const externalConfigPath = await findFirstExistingFile(searchDirectories, ['tokenizer_config.json']);

        let finalTokenizerPath = tokenizerPath;
        if (!tokenizerPath) {
          finalTokenizerPath = await findFirstExistingFile(searchDirectories, ['tokenizer.model']);
        }

        const fallbackConfig = {
          bos_token: '<|begin_of_text|>',
          eos_token: '<|end_of_text|>',
          pad_token: '<|end_of_text|>',
          model_max_length: 2048,
          tokenizer_class: 'TiktokenTokenizer',
          chat_template: `{% for message in messages %}{{'<|start_header_id|>' + message['role'] + '<|end_header_id|>\n\n' + message['content'] + '<|eot_id|>'}}{% endfor %}{{'<|start_header_id|>assistant<|end_header_id|>\n\n'}}`,
        };

        let configContent = JSON.stringify(fallbackConfig);
        if (externalConfigPath) {
          try {
            configContent = await FileSystem.readAsStringAsync(externalConfigPath);
            console.log('Loaded external config:', externalConfigPath);
          } catch (e) {
            console.warn('External config unreadable, using fallback.');
          }
        }

        await FileSystem.writeAsStringAsync(configPath, configContent);
        setTokenizerConfigUri(configPath);

        const runtimeModelPath = await ensurePrivateReadableCopy(modelPath, privateModelPath);
        const runtimeTokenizerPath = await ensurePrivateReadableCopy(
          finalTokenizerPath,
          finalTokenizerPath?.endsWith('.model') ? `${appPrivateAssetDirectory}/tokenizer.model` : privateTokenizerJsonPath
        );

        const modelSize = await getFileSize(runtimeModelPath);
        const tokenizerSize = await getFileSize(runtimeTokenizerPath);

        console.log('Model:', runtimeModelPath, `(${modelSize} bytes)`);
        console.log('Tokenizer:', runtimeTokenizerPath, `(${tokenizerSize} bytes)`);

        if (!runtimeModelPath || !modelSize) console.warn('Model missing.');
        if (!runtimeTokenizerPath || !tokenizerSize) console.warn('Tokenizer missing.');

        setModelUri(runtimeModelPath);
        setTokenizerUri(runtimeTokenizerPath);
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setIsLoadingAssets(false);
      }
    }
    
    loadDefaultAssets();
  }, []);

  return (
    <ModelContext.Provider value={{ 
      modelUri, 
      tokenizerUri, 
      tokenizerConfigUri,
      setModelUri, 
      setTokenizerUri,
      isLoadingAssets 
    }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModelContext() {
  return useContext(ModelContext);
}
