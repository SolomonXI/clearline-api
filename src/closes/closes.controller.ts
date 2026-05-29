import { Controller, Get, Post, Patch, Delete, Param, Body, HttpCode } from '@nestjs/common';
import { ClosesService } from './closes.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateCloseDto } from './dto/create-close.dto';
import { UpdateCloseDto } from './dto/update-close.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { MemberRole } from '@prisma/client';

@Controller('closes')
export class ClosesController {
  constructor(private closesService: ClosesService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.closesService.findAll(user.organisationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.closesService.findOne(id, user.organisationId);
  }

  @Post()
  @Roles(MemberRole.CONTROLLER)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCloseDto) {
    return this.closesService.create(user.organisationId, dto);
  }

  @Patch(':id')
  @Roles(MemberRole.CONTROLLER)
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: UpdateCloseDto) {
    return this.closesService.update(id, user.organisationId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(MemberRole.OWNER)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.closesService.remove(id, user.organisationId);
  }
}
