import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Asset } from 'expo-asset';
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
        for (const fileName of fileNames) {
          const candidatePath = `${baseDirectory}/${fileName}`;
          const info = await FileSystem.getInfoAsync(candidatePath);
          if (info.exists) {
            return candidatePath;
          }
        }
      }
      return null;
    }

    async function getFileSize(path: string | null): Promise<number | null> {
      if (!path) return null;
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists || typeof info.size !== 'number') return null;
      return info.size;
    }

    async function loadDefaultAssets() {
      try {
        console.log('--- ModelContext: Initializing Paths ---');

        const appPrivateFolder = `${FileSystem.documentDirectory}`;

        // Prefer app-private Android folder for model binaries.
        const modelDirectories = [
          'file:///storage/emulated/0/Android/data/com.anonymous.onionAI/files',
          'file:///storage/emulated/0/onionAI',
        ];

        // Prefer app-private Android folder for tokenizer files.
        const tokenizerDirectories = [
          'file:///storage/emulated/0/Android/data/com.anonymous.onionAI/files',
          'file:///storage/emulated/0/onionAI',
        ];

        // Create config in app-private storage (always writable)
        const configPath = `${appPrivateFolder}tokenizer_config.json`;

        const modelPath = await findFirstExistingFile(modelDirectories, [
          'Llama-3.2-1B-Instruct.pte',
        ]);
        const tokenizerPath = await findFirstExistingFile(tokenizerDirectories, [
          'tokenizer.json',
          'tokenizer.bin',
        ]);
        const externalConfigPath = await findFirstExistingFile(tokenizerDirectories, [
          'tokenizer_config.json',
        ]);

        let finalTokenizerPath = tokenizerPath;
        if (!tokenizerPath) {
          const modelFallback = await findFirstExistingFile(tokenizerDirectories, ['tokenizer.model']);
          if (modelFallback) {
            console.warn('--- Tokenizer Warning ---');
            console.warn('Found tokenizer.model, but Llama 3.2 models in this app usually require tokenizer.json.');
            console.warn('If loading fails with error code 4, please provide the HuggingFace tokenizer.json file.');
            finalTokenizerPath = modelFallback;
          }
        }

        let finalConfigPath = configPath;
        if (externalConfigPath) {
          console.log('Using external tokenizer config:', externalConfigPath);
          finalConfigPath = externalConfigPath;
        } else {
          // Minimal config required by useLLM tokenizer post-processing.
          // Llama 3 models (including 3.2) use <|begin_of_text|> and <|end_of_text|>.
          // Added chat_template which is required by sendMessage.
          const dummyConfig = {
            bos_token: '<|begin_of_text|>',
            eos_token: '<|end_of_text|>',
            pad_token: '<|end_of_text|>',
            model_max_length: 2048,
            tokenizer_class: 'TiktokenTokenizer',
            chat_template: `{% for message in messages %}{{'<|start_header_id|>' + message['role'] + '<|end_header_id|>\n\n' + message['content'] + '<|eot_id|>'}}{% endfor %}{{'<|start_header_id|>assistant<|end_header_id|>\n\n'}}`,
          };

          await FileSystem.writeAsStringAsync(configPath, JSON.stringify(dummyConfig));
          finalConfigPath = configPath;
        }

        setTokenizerConfigUri(finalConfigPath);

        const modelSize = await getFileSize(modelPath);
        const tokenizerSize = await getFileSize(finalTokenizerPath);

        console.log('Target Model Path:', modelPath);
        console.log('Target Model Size:', modelSize);
        console.log('Target Tokenizer Path:', finalTokenizerPath);
        console.log('Target Tokenizer Size:', tokenizerSize);
        console.log('Target Config Path:', finalConfigPath);

        if (!modelPath || !modelSize || modelSize <= 0) {
          console.warn('Model file is missing or empty. Native ExecuTorch load will be skipped.');
        }
        if (!finalTokenizerPath || !tokenizerSize || tokenizerSize <= 0) {
          console.warn('Tokenizer file is missing or empty. Native ExecuTorch load will be skipped.');
        }

        setModelUri(modelPath);
        setTokenizerUri(finalTokenizerPath);
      } catch (error) {
        console.error('ModelContext initialization error:', error);
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
