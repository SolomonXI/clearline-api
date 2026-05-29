import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteMemberDto } from './dto/invite-member.dto';

@Injectable()
export class OrganisationsService {
  constructor(private prisma: PrismaService) {}

  async getMyOrg(organisationId: string) {
    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, initials: true } },
          },
        },
      },
    });
    if (!org) throw new NotFoundException('Organisation not found');
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      members: org.members.map((m) => ({
        id: m.id,
        role: m.role,
        user: m.user,
      })),
    };
  }

  async inviteMember(organisationId: string, dto: InviteMemberDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, name: true, email: true, initials: true },
    });
    if (!user) throw new NotFoundException('User with that email not found. They must register first.');

    const existing = await this.prisma.organisationMember.findUnique({
      where: { userId_organisationId: { userId: user.id, organisationId } },
    });
    if (existing) throw new ConflictException('User is already a member of this organisation');

    const member = await this.prisma.organisationMember.create({
      data: { userId: user.id, organisationId, role: dto.role },
      include: { user: { select: { id: true, name: true, email: true, initials: true } } },
    });
    return { id: member.id, role: member.role, user: member.user };
  }
}
