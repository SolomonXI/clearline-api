import { Controller, Get, Post, Param, Body, Res, HttpCode } from '@nestjs/common';
import { Response } from 'express';
import { InsightsService } from './insights.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { GenerateInsightDto } from './dto/generate-insight.dto';

@Controller()
export class InsightsController {
  constructor(private insightsService: InsightsService) {}

  @Get('tasks/:taskId/insight')
  getInsight(@Param('taskId') taskId: string, @CurrentUser() user: JwtPayload) {
    return this.insightsService.getInsight(taskId, user.organisationId);
  }

  @Post('tasks/:taskId/insight')
  @HttpCode(200)
  async generate(
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: GenerateInsightDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    await this.insightsService.generate(taskId, user.organisationId, dto.context, res);
  }
}
