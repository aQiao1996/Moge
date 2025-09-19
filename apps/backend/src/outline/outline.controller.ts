import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { OutlineService } from './outline.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { createOutlineSchema, type CreateOutlineValues } from '@moge/types';

@Controller('outline')
@UseGuards(JwtAuthGuard)
export class OutlineController {
  constructor(private readonly outlineService: OutlineService) {}

  @Post()
  async create(
    @Req() req: { user: { id: string } },
    @Body(new ZodValidationPipe(createOutlineSchema)) data: CreateOutlineValues
  ) {
    const userId = req.user.id;
    return this.outlineService.create(userId, data);
  }
}
