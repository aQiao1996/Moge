import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  loginSchema,
  registerSchema,
  gitlabLoginSchema,
  changePasswordSchema,
  type LoginData,
  type RegisterData,
  type GitlabLoginData,
  type ChangePasswordData,
} from '@moge/types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { User } from '@moge/types';

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiTags('认证')
@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiBody({
    description: '登录信息',
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: '用户名' },
        password: { type: 'string', description: '密码' },
      },
      required: ['username', 'password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'JWT token' },
        user: {
          type: 'object',
          description: '用户信息',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '登录失败' })
  async login(@Body(new ZodValidationPipe(loginSchema)) loginData: LoginData) {
    return this.authService.login(loginData.username, loginData.password);
  }

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiBody({
    description: '注册信息',
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: '用户名' },
        password: { type: 'string', description: '密码' },
        email: { type: 'string', description: '邮箱', nullable: true },
        name: { type: 'string', description: '姓名', nullable: true },
      },
      required: ['username', 'password'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '注册成功',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'JWT token' },
        user: {
          type: 'object',
          description: '用户信息',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '注册失败' })
  async register(@Body(new ZodValidationPipe(registerSchema)) registerData: RegisterData) {
    return this.authService.register(
      registerData.username,
      registerData.password,
      registerData.email,
      registerData.name
    );
  }

  @Post('gitlab-login')
  @ApiOperation({ summary: 'GitLab 登录' })
  @ApiBody({
    description: 'GitLab 登录信息',
    schema: {
      type: 'object',
      properties: {
        provider: { type: 'string', description: '提供商' },
        providerAccountId: { type: 'string', description: '提供商账户ID' },
        email: { type: 'string', description: '邮箱', nullable: true },
        name: { type: 'string', description: '姓名', nullable: true },
        avatarUrl: { type: 'string', description: '头像URL', nullable: true },
      },
      required: ['provider', 'providerAccountId'],
    },
  })
  @ApiResponse({ status: 200, description: 'GitLab 登录成功' })
  @ApiResponse({ status: 400, description: 'GitLab 登录失败' })
  async gitlabLogin(@Body(new ZodValidationPipe(gitlabLoginSchema)) gitlabData: GitlabLoginData) {
    return this.authService.gitlabLogin(
      gitlabData.provider,
      gitlabData.providerAccountId,
      gitlabData.email,
      gitlabData.name,
      gitlabData.avatarUrl
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({
    status: 200,
    description: '获取用户信息成功',
    schema: {
      type: 'object',
      description: '当前用户信息',
    },
  })
  @ApiUnauthorizedResponse({ description: '未授权' })
  getMe(@Request() req: AuthenticatedRequest) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '修改密码' })
  @ApiBody({
    description: '修改密码信息',
    schema: {
      type: 'object',
      properties: {
        currentPassword: { type: 'string', description: '当前密码' },
        newPassword: { type: 'string', description: '新密码' },
        confirmNewPassword: { type: 'string', description: '确认新密码' },
      },
      required: ['currentPassword', 'newPassword', 'confirmNewPassword'],
    },
  })
  @ApiResponse({ status: 200, description: '密码修改成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 400, description: '密码修改失败' })
  async changePassword(
    @Body(new ZodValidationPipe(changePasswordSchema)) changePasswordData: ChangePasswordData,
    @Request() req: AuthenticatedRequest
  ) {
    if (!req.user?.id) {
      throw new Error('用户未登录');
    }
    return this.authService.changePassword(
      Number(req.user.id),
      changePasswordData.currentPassword,
      changePasswordData.newPassword
    );
  }
}
