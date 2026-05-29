import { Controller, Get, Post, Body } from '@nestjs/common';
import { OrganisationsService } from './organisations.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { InviteMemberDto } from './dto/invite-member.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { MemberRole } from '@prisma/client';

@Controller('organisations')
export class OrganisationsController {
  constructor(private orgsService: OrganisationsService) {}

  @Get('me')
  getMyOrg(@CurrentUser() user: JwtPayload) {
    return this.orgsService.getMyOrg(user.organisationId);
  }

  @Post('invite')
  @Roles(MemberRole.CONTROLLER)
  inviteMember(@CurrentUser() user: JwtPayload, @Body() dto: InviteMemberDto) {
    return this.orgsService.inviteMember(user.organisationId, dto);
  }
}
