import { Controller, Get, Post, Delete, Param, Body, HttpCode } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller()
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get('tasks/:taskId/comments')
  findByTask(@Param('taskId') taskId: string, @CurrentUser() user: JwtPayload) {
    return this.commentsService.findByTask(taskId, user.organisationId);
  }

  @Post('tasks/:taskId/comments')
  create(
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(taskId, user.sub, user.organisationId, dto);
  }

  @Delete('comments/:id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.commentsService.remove(id, user.sub, user.organisationId);
  }
}
