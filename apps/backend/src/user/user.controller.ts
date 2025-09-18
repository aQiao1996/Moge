import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { updateProfileInputSchema, type UpdateProfileInput } from '@moge/types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { User } from '@moge/types';

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiTags('用户')
@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新用户资料' })
  @ApiBody({
    description: '用户资料信息',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '姓名', nullable: true },
        email: { type: 'string', description: '邮箱', nullable: true },
        avatarUrl: { type: 'string', description: '头像URL', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '用户资料更新成功',
    schema: {
      type: 'object',
      description: '更新后的用户信息',
    },
  })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 400, description: '用户资料更新失败' })
  async updateProfile(
    @Body(new ZodValidationPipe(updateProfileInputSchema)) profileData: UpdateProfileInput,
    @Request() req: AuthenticatedRequest
  ) {
    if (!req.user?.id) {
      throw new Error('用户未登录');
    }
    return this.userService.updateProfile(
      Number(req.user.id),
      profileData.name,
      profileData.email,
      profileData.avatarUrl
    );
  }
}
