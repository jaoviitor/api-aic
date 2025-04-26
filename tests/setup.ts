import { vi } from 'vitest';
import { config } from 'dotenv';

// Load environment variables for testing
config({ path: '.env.test' });

// Mock environment variables
process.env.AZURE_STORAGE_CONNECTION_STRING = 'DefaultEndpointsProtocol=https;AccountName=testaccount;AccountKey=testkey==;EndpointSuffix=core.windows.net';
process.env.AZURE_SPEECH_KEY = 'test-speech-key';
process.env.AZURE_SPEECH_REGION = 'test-region';
process.env.RECALL_API_KEY = 'test-recall-api-key';

// Mock ffmpeg installers
vi.mock('@ffmpeg-installer/ffmpeg', () => ({
  default: {
    path: '/mock/path/to/ffmpeg'
  },
  path: '/mock/path/to/ffmpeg'
}));

vi.mock('@ffprobe-installer/ffprobe', () => ({
  default: {
    path: '/mock/path/to/ffprobe'
  },
  path: '/mock/path/to/ffprobe'
}));

// Global mocks
// Mock microsoft-cognitiveservices-speech-sdk
vi.mock('microsoft-cognitiveservices-speech-sdk', () => {
  const mockSpeechConfig = {
    speechRecognitionLanguage: '',
    setProperty: vi.fn(),
  };
  
  const mockPushStream = {
    write: vi.fn(),
    close: vi.fn(),
  };
  
  const SpeechConfig = {
    fromSubscription: vi.fn(() => mockSpeechConfig),
  };
  
  const AudioInputStream = {
    createPushStream: vi.fn(() => mockPushStream),
  };
  
  const AudioConfig = {
    fromStreamInput: vi.fn(),
  };
  
  const AudioStreamFormat = {
    getWaveFormatPCM: vi.fn(),
  };
  
  const SpeechRecognizer = vi.fn().mockImplementation(() => {
    const recognizer = {
      recognized: null as ((s: any, e: any) => void) | null,
      sessionStarted: null as ((s: any, e: any) => void) | null,
      sessionStopped: null as ((s: any, e: any) => void) | null,
      canceled: null as ((s: any, e: any) => void) | null,
      recognizing: null as ((s: any, e: any) => void) | null,
      startContinuousRecognitionAsync: vi.fn((success) => {
        success && success();
        // Simular o fim da sessão automaticamente após um pequeno delay
        setTimeout(() => {
          if (recognizer.sessionStopped) {
            recognizer.sessionStopped(null, {});
          }
        }, 50);
      }),
      stopContinuousRecognitionAsync: vi.fn((success) => success && success()),
      close: vi.fn(),
    };
    return recognizer;
  });
  
  return {
    SpeechConfig,
    AudioConfig,
    AudioInputStream,
    AudioStreamFormat,
    SpeechRecognizer,
    ResultReason: {
      RecognizedSpeech: 1,
      NoMatch: 2,
    },
    CancellationReason: {
      Error: 1,
      EndOfStream: 2,
    },
  };
});

vi.mock('@azure/storage-blob', () => ({
  BlobServiceClient: {
    fromConnectionString: vi.fn().mockReturnValue({
      getContainerClient: vi.fn().mockReturnValue({
        getBlobClient: vi.fn().mockReturnValue({
          download: vi.fn(),
        }),
        getBlockBlobClient: vi.fn().mockReturnValue({
          upload: vi.fn(),
          deleteIfExists: vi.fn(),
          url: 'https://test.blob.core.windows.net/container/blob',
        }),
        createIfNotExists: vi.fn(),
      }),
    }),
  },
  BlobSASPermissions: {
    parse: vi.fn(),
  },
  generateBlobSASQueryParameters: vi.fn(),
  StorageSharedKeyCredential: vi.fn(),
}));

// Mock fluent-ffmpeg com tipagem segura
vi.mock('fluent-ffmpeg', () => {
  const mockInstance = {
    toFormat: vi.fn().mockReturnThis(),
    audioCodec: vi.fn().mockReturnThis(),
    audioFrequency: vi.fn().mockReturnThis(),
    audioChannels: vi.fn().mockReturnThis(),
    on: vi.fn().mockImplementation(function(this: any, event: string, callback: Function) {
      if (event === 'end') {
        setTimeout(() => callback(), 0);
      }
      return this;
    }),
    save: vi.fn().mockReturnThis(),
    pipe: vi.fn().mockReturnThis(),
  };
  
  const ffmpegMock = vi.fn().mockReturnValue(mockInstance);
  
  return {
    default: Object.assign(ffmpegMock, {
      setFfmpegPath: vi.fn(),
      setFfprobePath: vi.fn(),
      ffprobe: vi.fn((...args: any[]) => {
        const callback = args[args.length - 1];
        if (typeof callback === 'function') {
          callback(null, {});
        }
      })
    }),
    __esModule: true,
  };
});

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn().mockReturnValue(Buffer.from('mock-audio-data')),
  unlinkSync: vi.fn(),
  statSync: vi.fn().mockReturnValue({ size: 1000 }),
  createWriteStream: vi.fn().mockReturnValue({
    on: vi.fn().mockImplementation((event, callback) => {
      if (event === 'finish') {
        setTimeout(() => callback(), 0);
      }
      return { on: vi.fn() };
    }),
  }),
  promises: {
    readFile: vi.fn().mockResolvedValue(Buffer.from('mock-audio-data')),
  },
}));

// Mock axios
vi.mock('axios', () => ({
  default: Object.assign(vi.fn(), {
    get: vi.fn(),
    post: vi.fn(),
  }),
  get: vi.fn(),
  post: vi.fn(),
}));

// Mock poolAiScribe
vi.mock('../../src/config/database', () => ({
  poolAiScribe: {
    connect: vi.fn(),
  },
}));