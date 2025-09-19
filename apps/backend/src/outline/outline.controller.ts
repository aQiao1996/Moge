import { Body, Controller, Post, Request } from '@nestjs/common';
import { OutlineService } from './outline.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { createOutlineSchema, type CreateOutlineValues } from '@moge/types';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { User } from '@moge/types';

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiTags('大纲')
@Controller('outline')
export class OutlineController {
  constructor(private readonly outlineService: OutlineService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建大纲' })
  @ApiBody({
    description: '大纲信息',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '标题' },
        content: { type: 'string', description: '内容' },
        model: { type: 'string', description: '模型' },
      },
      required: ['title', 'content', 'model'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '大纲创建成功',
  })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 400, description: '大纲创建失败' })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createOutlineSchema)) data: CreateOutlineValues
  ) {
    const userId = req.user.id;
    return this.outlineService.create(userId, data);
  }
}
