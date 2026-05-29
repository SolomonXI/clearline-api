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
    const task = await this.assertTaskAccess(taskId, organisationId);

    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const commentsText = comments.length
      ? comments.map((c) => `${c.author.name}: ${c.text}`).join('\n')
      : 'none';

    const prompt = `You are a finance close assistant. A controller is reviewing this task during month-end close.

Task: ${task.name} (section: ${task.section})
Existing team comments: ${commentsText}
Controller's context note: ${context}

Respond with exactly two parts:
SUMMARY: One sentence identifying the core issue or variance.
DETAIL: Two to three sentences explaining the likely cause and recommended action.`;

    let fullText = '';

    const stream = this.anthropic.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 350,
      messages: [{ role: 'user', content: prompt }],
    });

    stream.on('text', (text: string) => {
      fullText += text;
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    await stream.finalMessage();

    res.write('data: [DONE]\n\n');
    res.end();

    const summaryMatch = fullText.match(/SUMMARY:\s*(.+?)(?:\n|DETAIL:|$)/s);
    const detailMatch = fullText.match(/DETAIL:\s*(.+?)$/s);

    await this.prisma.insight.upsert({
      where: { taskId },
      create: {
        taskId,
        summary: summaryMatch?.[1]?.trim() ?? '',
        detail: detailMatch?.[1]?.trim() ?? '',
      },
      update: {
        summary: summaryMatch?.[1]?.trim() ?? '',
        detail: detailMatch?.[1]?.trim() ?? '',
      },
    });
  }

  private async assertTaskAccess(taskId: string, organisationId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, close: { organisationId } },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }
}
