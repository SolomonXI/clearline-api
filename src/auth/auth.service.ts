import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MemberRole } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const initials = dto.name
      .split(' ')
      .map((n) => n[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 4);

    const slug = dto.orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: dto.email, passwordHash, name: dto.name, initials },
      });
      const org = await tx.organisation.create({
        data: { name: dto.orgName, slug: `${slug}-${user.id.slice(-6)}` },
      });
      await tx.organisationMember.create({
        data: { userId: user.id, organisationId: org.id, role: MemberRole.OWNER },
      });
      return { user, org };
    });

    const accessToken = this.signAccessToken(
      result.user.id, result.user.email, result.org.id, MemberRole.OWNER,
    );
    const { raw } = await this.createRefreshToken(result.user.id);

    return {
      accessToken,
      refreshToken: raw,
      user: { id: result.user.id, name: result.user.name, email: result.user.email, initials: result.user.initials },
      org: { id: result.org.id, name: result.org.name },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const member = await this.prisma.organisationMember.findFirst({
      where: { userId: user.id },
      include: { organisation: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!member) throw new UnauthorizedException('No organisation found for user');

    const accessToken = this.signAccessToken(
      user.id, user.email, member.organisationId, member.role,
    );
    const { raw } = await this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken: raw,
      user: { id: user.id, name: user.name, email: user.email, initials: user.initials },
      org: { id: member.organisation.id, name: member.organisation.name },
    };
  }

  async refresh(rawToken: string) {
    const hash = createHash('sha256').update(rawToken).digest('hex');
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const member = await this.prisma.organisationMember.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });
    if (!member) throw new UnauthorizedException('No organisation found');

    const accessToken = this.signAccessToken(
      user.id, user.email, member.organisationId, member.role,
    );
    const { raw } = await this.createRefreshToken(user.id);

    return { accessToken, refreshToken: raw };
  }

  async logout(rawToken: string) {
    const hash = createHash('sha256').update(rawToken).digest('hex');
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash: hash } });
  }

  private signAccessToken(userId: string, email: string, organisationId: string, role: string) {
    return this.jwt.sign({ sub: userId, email, organisationId, role });
  }

  private async createRefreshToken(userId: string) {
    const raw = randomBytes(40).toString('hex');
    const hash = createHash('sha256').update(raw).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({ data: { tokenHash: hash, userId, expiresAt } });
    return { raw };
  }
}
