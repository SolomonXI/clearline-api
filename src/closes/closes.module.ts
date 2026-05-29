import { Module } from '@nestjs/common';
import { ClosesController } from './closes.controller';
import { ClosesService } from './closes.service';

@Module({ controllers: [ClosesController], providers: [ClosesService] })
export class ClosesModule {}
