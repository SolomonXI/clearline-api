import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async findByTask(taskId: string, organisationId: string) {
    await this.assertTaskAccess(taskId, organisationId);
    return this.prisma.comment.findMany({
      where: { taskId },
      include: { author: { select: { id: true, name: true, initials: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(taskId: string, authorId: string, organisationId: string, dto: CreateCommentDto) {
    await this.assertTaskAccess(taskId, organisationId);
    return this.prisma.comment.create({
      data: { text: dto.text, taskId, authorId },
      include: { author: { select: { id: true, name: true, initials: true } } },
    });
  }

  async remove(id: string, authorId: string, organisationId: string) {
    const comment = await this.prisma.comment.findFirst({
      where: { id, task: { close: { organisationId } } },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== authorId) {
      throw new ForbiddenException("Cannot delete another user's comment");
    }
    await this.prisma.comment.delete({ where: { id } });
  }

  private async assertTaskAccess(taskId: string, organisationId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, close: { organisationId } },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }
}
