import { Body, Controller, Post, Req } from '@nestjs/common';
import { OutlineService } from './outline.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { createOutlineSchema, type CreateOutlineValues } from '@moge/types';

@Controller('outline')
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
