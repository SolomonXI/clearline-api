import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const SECTION_ORDER = ['AP', 'AR', 'GL', 'CASH', 'FIXED_ASSETS', 'REVENUE'];

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findByClose(closeId: string, organisationId: string) {
    await this.assertCloseAccess(closeId, organisationId);
    const tasks = await this.prisma.task.findMany({
      where: { closeId },
      include: {
        owner: { select: { id: true, name: true, initials: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ dueDay: 'asc' }],
    });

    const grouped: Record<string, typeof tasks> = {};
    for (const section of SECTION_ORDER) {
      const sectionTasks = tasks.filter((t) => t.section === section);
      if (sectionTasks.length) grouped[section] = sectionTasks;
    }
    return grouped;
  }

  async create(closeId: string, organisationId: string, dto: CreateTaskDto) {
    await this.assertCloseAccess(closeId, organisationId);
    return this.prisma.task.create({
      data: { ...dto, closeId },
      include: { owner: { select: { id: true, name: true, initials: true } } },
    });
  }

  async update(id: string, organisationId: string, dto: UpdateTaskDto) {
    await this.assertTaskAccess(id, organisationId);
    return this.prisma.task.update({
      where: { id },
      data: dto,
      include: { owner: { select: { id: true, name: true, initials: true } } },
    });
  }

  async remove(id: string, organisationId: string) {
    await this.assertTaskAccess(id, organisationId);
    await this.prisma.task.delete({ where: { id } });
  }

  private async assertCloseAccess(closeId: string, organisationId: string) {
    const close = await this.prisma.close.findFirst({
      where: { id: closeId, organisationId },
    });
    if (!close) throw new NotFoundException('Close not found');
    return close;
  }

  private async assertTaskAccess(taskId: string, organisationId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, close: { organisationId } },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }
}
