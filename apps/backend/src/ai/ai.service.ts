// apps/backend/src/ai/ai.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
// import { ChatMoonshot } from '@langchain/community/chat_models/moonshot'; // 不使用这个,这个流式有问题

// 定义支持的 AI供应商类型，方便扩展
export type AIProvider = 'gemini' | 'openai' | 'moonshot' | 'openai_compatible';

export interface AIStreamingDebugInfo {
  provider: string;
  modelName?: string;
  baseURL?: string;
  reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high';
}

const SUPPORTED_AI_PROVIDERS: AIProvider[] = ['gemini', 'openai', 'moonshot', 'openai_compatible'];

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(private configService: ConfigService) {}

  /**
   * 根据供应商获取一个支持流式的聊天模型实例
   * @param provider AI 供应商
   * @returns 一个实现了 BaseChatModel 的实例
   */
  getStreamingModel(provider: AIProvider): BaseChatModel {
    switch (provider) {
      case 'gemini':
        return new ChatGoogleGenerativeAI({
          apiKey: this.configService.get<string>('GEMINI_API_KEY'),
          modelName: 'gemini-1.5-pro-latest',
          streaming: true,
        });

      case 'openai':
        return this.createOpenAICompatibleModel({
          label: 'OpenAI',
          apiKeyEnvName: 'OPENAI_API_KEY',
          modelName: this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4-turbo-preview',
        });

      case 'moonshot':
        return this.createOpenAICompatibleModel({
          label: 'Moonshot',
          apiKeyEnvName: 'MOONSHOT_API_KEY',
          modelName: this.configService.get<string>('MOONSHOT_MODEL_NAME') ?? 'moonshot-v1-8k',
          baseURL:
            this.configService.get<string>('MOONSHOT_BASE_URL') ?? 'https://api.moonshot.cn/v1',
          maxTokens: 2000, // 适中的token数量，平衡速度和完整性
          temperature: 0.6, // 稍微提高创造性
        });

      case 'openai_compatible':
        return this.createOpenAICompatibleModel({
          label: 'OpenAI Compatible',
          apiKeyEnvName: 'OPENAI_COMPATIBLE_API_KEY',
          modelName: this.configService.get<string>('OPENAI_COMPATIBLE_MODEL') ?? 'gpt-5.2',
          baseURL: this.getRequiredConfig('OPENAI_COMPATIBLE_BASE_URL'),
          maxTokens: 2000,
          temperature: 0.6,
          reasoningEffort: 'low', // 最低推理能力,快速推理
        });

      default:
        this.logger.error(`不支持的 AI 提供商: ${provider as string}`);
        throw new InternalServerErrorException('AI 提供商配置错误');
    }
  }

  /**
   * 获取默认 AI 提供商
   * 优先读取 AI_PROVIDER；未配置时，如果存在中转站 Key，则默认走 openai_compatible，否则保持 moonshot。
   */
  getDefaultProvider(): AIProvider {
    const configuredProvider = this.resolveConfiguredProvider();

    if (this.isAIProvider(configuredProvider)) {
      return configuredProvider;
    }

    this.logger.error(`不支持的默认 AI 提供商配置: ${configuredProvider}`);
    throw new InternalServerErrorException('AI 提供商配置错误');
  }

  /**
   * 获取默认流式模型
   */
  getDefaultStreamingModel(): BaseChatModel {
    return this.getStreamingModel(this.getDefaultProvider());
  }

  /**
   * 获取当前默认流式模型的调试信息
   * 仅用于日志诊断，不会校验配置完整性
   */
  getDefaultStreamingDebugInfo(): AIStreamingDebugInfo {
    const configuredProvider = this.resolveConfiguredProvider();

    if (!this.isAIProvider(configuredProvider)) {
      return { provider: configuredProvider };
    }

    return this.getStreamingDebugInfo(configuredProvider);
  }

  private createOpenAICompatibleModel(options: {
    label: string;
    apiKeyEnvName: string;
    modelName: string;
    baseURL?: string;
    temperature?: number;
    maxTokens?: number;
    reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high';
  }): BaseChatModel {
    const apiKey = this.getRequiredConfig(options.apiKeyEnvName);

    this.logger.log(
      `使用 ${options.label} 模型: ${options.modelName}${options.baseURL ? ` @ ${options.baseURL}` : ''}${options.reasoningEffort ? `, reasoning=${options.reasoningEffort}` : ''}`
    );

    return new ChatOpenAI({
      apiKey,
      modelName: options.modelName,
      configuration: options.baseURL
        ? {
            baseURL: options.baseURL,
          }
        : undefined,
      streaming: true,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      reasoning: options.reasoningEffort
        ? {
            effort: options.reasoningEffort,
          }
        : undefined,
    });
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      this.logger.error(`缺少 AI 配置项: ${key}`);
      throw new InternalServerErrorException('AI 提供商配置错误');
    }

    return value;
  }

  private isAIProvider(provider: string): provider is AIProvider {
    return SUPPORTED_AI_PROVIDERS.includes(provider as AIProvider);
  }

  private resolveConfiguredProvider(): string {
    const configuredProvider = this.configService.get<string>('AI_PROVIDER');

    if (configuredProvider) {
      return configuredProvider;
    }

    return this.configService.get<string>('OPENAI_COMPATIBLE_API_KEY')
      ? 'openai_compatible'
      : 'moonshot';
  }

  private getStreamingDebugInfo(provider: AIProvider): AIStreamingDebugInfo {
    switch (provider) {
      case 'gemini':
        return {
          provider,
          modelName: 'gemini-1.5-pro-latest',
        };

      case 'openai':
        return {
          provider,
          modelName: this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4-turbo-preview',
        };

      case 'moonshot':
        return {
          provider,
          modelName: this.configService.get<string>('MOONSHOT_MODEL_NAME') ?? 'moonshot-v1-8k',
          baseURL:
            this.configService.get<string>('MOONSHOT_BASE_URL') ?? 'https://api.moonshot.cn/v1',
        };

      case 'openai_compatible':
        return {
          provider,
          modelName: this.configService.get<string>('OPENAI_COMPATIBLE_MODEL') ?? 'gpt-5.2',
          baseURL: this.configService.get<string>('OPENAI_COMPATIBLE_BASE_URL'),
          reasoningEffort: 'low',
        };
    }
  }
}
