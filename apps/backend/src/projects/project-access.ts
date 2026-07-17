import { ProjectMemberRole, type Prisma } from '../../generated/prisma';

export type ProjectAccessMode = 'read' | 'write' | 'owner';

const PROJECT_WRITE_ROLES = [ProjectMemberRole.OWNER, ProjectMemberRole.EDITOR];

/**
 * 生成项目访问范围，保证项目资源使用一致的成员角色语义。
 *
 * @param userId 当前用户 ID
 * @param mode 访问模式
 * @returns Prisma 项目查询条件
 */
export function buildProjectAccessWhere(
  userId: number,
  mode: ProjectAccessMode
): Prisma.projectsWhereInput {
  if (mode === 'owner') {
    return { userId };
  }

  return {
    OR: [
      { userId },
      {
        members: {
          some: {
            userId,
            ...(mode === 'write' ? { role: { in: PROJECT_WRITE_ROLES } } : {}),
          },
        },
      },
    ],
  };
}
