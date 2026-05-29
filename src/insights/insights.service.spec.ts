import { Test } from '@nestjs/testing';
import { InsightsService } from './insights.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  task: { findFirst: jest.fn() },
  insight: { findUnique: jest.fn(), upsert: jest.fn() },
  comment: { findMany: jest.fn() },
};

describe('InsightsService', () => {
  let service: InsightsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        InsightsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(InsightsService);
  });

  describe('getInsight', () => {
    it('throws NotFoundException when task does not belong to org', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);
      await expect(service.getInsight('t1', 'org1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when no insight stored yet', async () => {
      mockPrisma.task.findFirst.mockResolvedValue({ id: 't1' });
      mockPrisma.insight.findUnique.mockResolvedValue(null);
      await expect(service.getInsight('t1', 'org1')).rejects.toThrow(NotFoundException);
    });

    it('returns stored insight', async () => {
      const stored = { id: 'i1', taskId: 't1', summary: 'S', detail: 'D' };
      mockPrisma.task.findFirst.mockResolvedValue({ id: 't1' });
      mockPrisma.insight.findUnique.mockResolvedValue(stored);
      const result = await service.getInsight('t1', 'org1');
      expect(result).toEqual(stored);
    });
  });
});
