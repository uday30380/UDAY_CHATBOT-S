import { GoogleGenAI, Chat, GenerateContentResponse, Modality, FunctionDeclaration, Type, LiveServerMessage } from "@google/genai";
import { Role, Attachment, GroundingChunk, ImageAspectRatio, ImageResolution } from "../types";

// Helper to safely get the API key
const getApiKey = (): string => {
  // The API key must be obtained exclusively from the environment variable process.env.API_KEY
  // Assuming process.env.API_KEY is replaced by the bundler (Vite) as configured in vite.config.ts
  if (process.env.API_KEY) {
    return process.env.API_KEY;
  }
  
  throw new Error("API_KEY is missing. Please add 'API_KEY' to your environment variables.");
};

// Helper to get fresh instance
const getAI = () => new GoogleGenAI({ apiKey: getApiKey() });

// --- Chat & Text ---

interface ChatOptions {
  model: string;
  history: any[];
  systemInstruction?: string;
  tools?: any[];
  toolConfig?: any;
  thinkingBudget?: number;
}

export async function* streamChatResponse(
  message: string,
  attachments: Attachment[],
  options: ChatOptions
): AsyncGenerator<GenerateContentResponse, void, unknown> {
  const ai = getAI();
  
  // Construct user content parts
  const parts: any[] = [];
  
  // Add attachments
  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    }
  }
  
  // Add text
  if (message) {
    parts.push({ text: message });
  }

  const config: any = {
    systemInstruction: options.systemInstruction,
  };

  // Add Tools
  if (options.tools && options.tools.length > 0) {
    config.tools = options.tools;
  }
  
  // Add Tool Config (e.g. location for maps)
  if (options.toolConfig) {
    config.toolConfig = options.toolConfig;
  }

  // Thinking Mode
  if (options.thinkingBudget && options.thinkingBudget > 0) {
    config.thinkingConfig = { thinkingBudget: options.thinkingBudget };
  }

  const chat = ai.chats.create({
    model: options.model,
    history: options.history,
    config: config
  });

  const result = await chat.sendMessageStream({ message: parts });

  for await (const chunk of result) {
    yield chunk as GenerateContentResponse;
  }
}

// --- Transcription ---

export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  const ai = getAI();
  // Using gemini-2.5-flash for audio transcription
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { mimeType, data: audioBase64 } },
        { text: "Transcribe the spoken language in this audio exactly. Do not add any other text, context, or formatting. Just return the raw transcription." }
      ]
    }
  });
  return response.text || "";
}

// --- Image Generation & Editing ---

export async function generateImage(
  prompt: string,
  referenceImage: Attachment | null,
  size: ImageResolution = '1K',
  aspectRatio: ImageAspectRatio = '1:1'
): Promise<string> {
  const ai = getAI();
  
  // Model Selection Logic:
  // "Nano Banana" (gemini-2.5-flash-image) is the default for speed and standard generation.
  // "Nano Banana Pro" (gemini-3-pro-image-preview) is used if the user requests high resolution (2K, 4K).
  
  const isHighRes = size === '2K' || size === '4K';
  const model = isHighRes ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  // Construct Config
  const imageConfig: any = {
    aspectRatio: aspectRatio
  };

  // imageSize is only supported by the Pro model
  if (isHighRes) {
    imageConfig.imageSize = size;
  }

  const parts: any[] = [];
  
  // If reference image exists, add it (Editing mode)
  if (referenceImage) {
    parts.push({
      inlineData: {
        mimeType: referenceImage.mimeType,
        data: referenceImage.data
      }
    });
  }
  
  // Add Prompt
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts: parts },
    config: {
      imageConfig: imageConfig
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData && part.inlineData.data) {
      return part.inlineData.data;
    }
  }
  
  throw new Error("No image generated.");
}

// --- Video Generation ---

export async function generateVideo(
  prompt: string,
  referenceImage: Attachment | null,
  aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<string> {
  const ai = getAI();
  
  let operation;
  
  if (referenceImage) {
    operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: referenceImage.data,
        mimeType: referenceImage.mimeType,
      },
      config: {
        numberOfVideos: 1,
        aspectRatio: aspectRatio,
        resolution: '720p' // fast preview default
      }
    });
  } else {
    operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        aspectRatio: aspectRatio,
        resolution: '720p'
      }
    });
  }

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed");

  // Fetch the actual video bytes using the key
  return `${videoUri}&key=${getApiKey()}`;
}

// --- TTS ---

export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// --- Live API ---

export class LiveClient {
  private sessionPromise: Promise<any> | null = null;
  
  constructor(
    private onAudioData: (data: ArrayBuffer) => void,
    private onClose: () => void
  ) {}

  async connect() {
    const ai = getAI();
    this.sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => console.log("Live session opened"),
        onmessage: (msg: LiveServerMessage) => this.handleMessage(msg),
        onclose: () => {
          console.log("Live session closed");
          this.onClose();
        },
        onerror: (err) => console.error("Live session error", err)
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: "You are Vempati Uday Kiran's Chat Bot. Be concise, helpful, and friendly.",
      }
    });
    return this.sessionPromise;
  }

  async sendAudio(base64PCM: string) {
    if (!this.sessionPromise) return;
    const session = await this.sessionPromise;
    session.sendRealtimeInput({
      media: {
        mimeType: 'audio/pcm;rate=16000',
        data: base64PCM
      }
    });
  }

  private handleMessage(message: LiveServerMessage) {
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      this.onAudioData(bytes.buffer);
    }
  }

  disconnect() {
    this.sessionPromise = null;
  }
}