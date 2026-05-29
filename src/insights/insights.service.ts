import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Anthropic from '@anthropic-ai/sdk';
import { Response } from 'express';

@Injectable()
export class InsightsService {
  private anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  constructor(private prisma: PrismaService) {}

  async getInsight(taskId: string, organisationId: string) {
    await this.assertTaskAccess(taskId, organisationId);
    const insight = await this.prisma.insight.findUnique({ where: { taskId } });
    if (!insight) throw new NotFoundException('No insight generated yet');
    return insight;
  }

  async generate(taskId: string, organisationId: string, context: string, res: Response) {
    // placeholder — implemented in next task
    res.end();
  }

  private async assertTaskAccess(taskId: string, organisationId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, close: { organisationId } },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }
}
