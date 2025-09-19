import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  loginSchema,
  type LoginData,
  signupSchema,
  type SignupData,
  type User,
  changePasswordSchema,
  type ChangePasswordData,
} from '@moge/types';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: User;
}

interface GitlabLoginData {
  provider: string;
  providerAccountId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

@ApiTags('认证')
@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 400, description: '登录失败' })
  async login(@Body(new ZodValidationPipe(loginSchema)) loginData: LoginData) {
    return this.authService.login(loginData.username, loginData.password);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 400, description: '注册失败' })
  async register(@Body(new ZodValidationPipe(signupSchema)) registerData: SignupData) {
    return this.authService.register(
      registerData.username,
      registerData.password,
      registerData.email,
      registerData.name
    );
  }

  @Public()
  @Post('gitlab-login')
  @ApiOperation({ summary: 'GitLab 登录' })
  @ApiResponse({ status: 200, description: 'GitLab 登录成功' })
  @ApiResponse({ status: 400, description: 'GitLab 登录失败' })
  async gitlabLogin(@Body() gitlabData: GitlabLoginData) {
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
  @ApiResponse({ status: 200, description: '获取用户信息成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  getMe(@Request() req: AuthenticatedRequest) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '修改密码' })
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
