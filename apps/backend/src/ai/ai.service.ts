// apps/backend/src/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { ChatMoonshot } from '@langchain/community/chat_models/moonshot';

// 定义支持的 AI供应商类型，方便扩展
export type AIProvider = 'gemini' | 'openai' | 'moonshot';

@Injectable()
export class AIService {
  constructor(private configService: ConfigService) {}

  /**
   * 根据供应商获取一个支持流式的聊天模型实例
   * @param provider AI 供应商
   * @returns 一个实现了 BaseChatModel 的实例
   */
  getStreamingModel(provider: AIProvider): BaseChatModel {
    switch (provider) {
      case 'gemini':
        console.log('🚀 ~ Using Gemini model');
        return new ChatGoogleGenerativeAI({
          apiKey: this.configService.get<string>('GEMINI_API_KEY'),
          modelName: 'gemini-1.5-pro-latest',
          streaming: true,
        });

      case 'openai':
        console.log('🚀 ~ Using OpenAI model');
        return new ChatOpenAI({
          apiKey: this.configService.get<string>('OPENAI_API_KEY'),
          modelName: 'gpt-4-turbo-preview',
          streaming: true,
        });

      case 'moonshot':
        console.log('🚀 ~ Using Moonshot model');
        return new ChatMoonshot({
          apiKey: this.configService.get<string>('MOONSHOT_API_KEY'),
          modelName: 'moonshot-v1-8k',
          streaming: true, // 启用流式响应
          maxTokens: 3000, // 适中的token数量，平衡速度和完整性
          temperature: 0.8, // 稍微提高创造性
        });

      default:
        throw new Error(`Unsupported AI provider: ${provider as string}`);
    }
  }
}
