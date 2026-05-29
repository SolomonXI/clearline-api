import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCloseDto } from './dto/create-close.dto';
import { UpdateCloseDto } from './dto/update-close.dto';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class ClosesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organisationId: string) {
    const closes = await this.prisma.close.findMany({
      where: { organisationId },
      include: { tasks: { select: { status: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return closes.map((c) => this.withStats(c));
  }

  async findOne(id: string, organisationId: string) {
    const close = await this.prisma.close.findFirst({
      where: { id, organisationId },
      include: { tasks: { select: { status: true } } },
    });
    if (!close) throw new NotFoundException('Close not found');
    return this.withStats(close);
  }

  async create(organisationId: string, dto: CreateCloseDto) {
    return this.prisma.close.create({
      data: {
        period: dto.period,
        entity: dto.entity,
        startDate: new Date(dto.startDate),
        targetDays: dto.targetDays,
        organisationId,
      },
    });
  }

  async update(id: string, organisationId: string, dto: UpdateCloseDto) {
    await this.assertExists(id, organisationId);
    return this.prisma.close.update({ where: { id }, data: dto });
  }

  async remove(id: string, organisationId: string) {
    await this.assertExists(id, organisationId);
    await this.prisma.close.delete({ where: { id } });
  }

  private async assertExists(id: string, organisationId: string) {
    const close = await this.prisma.close.findFirst({ where: { id, organisationId } });
    if (!close) throw new NotFoundException('Close not found');
    return close;
  }

  private withStats(close: any) {
    const { tasks, ...rest } = close;
    return {
      ...rest,
      stats: {
        done:       tasks.filter((t: any) => t.status === TaskStatus.DONE).length,
        inProgress: tasks.filter((t: any) => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.WAITING).length,
        overdue:    tasks.filter((t: any) => t.status === TaskStatus.OVERDUE).length,
        notStarted: tasks.filter((t: any) => t.status === TaskStatus.NOT_STARTED).length,
        total:      tasks.length,
      },
    };
  }
}
