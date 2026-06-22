import { IsBoolean, IsString } from 'class-validator';

/**
 * 创建工作台待办 DTO
 */
export class CreateWorkspaceTodoDto {
  @IsString()
  text: string;
}

/**
 * 更新工作台待办完成状态 DTO
 */
export class UpdateWorkspaceTodoDto {
  @IsBoolean()
  done: boolean;
}

/**
 * 创建工作台灵感 DTO
 */
export class CreateWorkspaceIdeaDto {
  @IsString()
  content: string;
}
