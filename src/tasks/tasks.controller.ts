import { Controller, Get, Post, Patch, Delete, Param, Body, HttpCode } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { MemberRole } from '@prisma/client';

@Controller()
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get('closes/:closeId/tasks')
  findByClose(@Param('closeId') closeId: string, @CurrentUser() user: JwtPayload) {
    return this.tasksService.findByClose(closeId, user.organisationId);
  }

  @Post('closes/:closeId/tasks')
  @Roles(MemberRole.ACCOUNTANT)
  create(
    @Param('closeId') closeId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(closeId, user.organisationId, dto);
  }

  @Patch('tasks/:id')
  @Roles(MemberRole.ACCOUNTANT)
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, user.organisationId, dto);
  }

  @Delete('tasks/:id')
  @HttpCode(204)
  @Roles(MemberRole.CONTROLLER)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.tasksService.remove(id, user.organisationId);
  }
}
