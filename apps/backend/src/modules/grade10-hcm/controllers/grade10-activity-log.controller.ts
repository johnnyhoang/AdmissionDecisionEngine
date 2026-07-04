import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade10ActivityLog } from '../entities/activity-log.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { RequirePermission } from '../../auth/require-permission.decorator';

@ApiTags('grade10-hcm-admin')
@Controller('api/v1/grade10-hcm/admin/activity-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class Grade10ActivityLogController {
  constructor(
    @InjectRepository(Grade10ActivityLog)
    private readonly logRepo: Repository<Grade10ActivityLog>,
  ) {}

  /**
   * GET /api/v1/grade10-hcm/admin/activity-logs
   * Trả về danh sách log phân trang, có thể filter theo module và userId
   */
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách activity logs (admin)' })
  @RequirePermission('GRADE10', 'manage_schools', 'view')
  async getLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe) pageSize: number,
    @Query('module') module?: 'calculator' | 'combo',
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const qb = this.logRepo
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (module) qb.andWhere('log.module = :module', { module });
    if (userId) qb.andWhere('log.userId = :userId', { userId });
    if (from) qb.andWhere('log.createdAt >= :from', { from: new Date(from) });
    if (to) qb.andWhere('log.createdAt <= :to', { to: new Date(to) });

    const [items, total] = await qb.getManyAndCount();

    return {
      page,
      pageSize,
      total,
      pages: Math.ceil(total / pageSize),
      items,
    };
  }

  /**
   * GET /api/v1/grade10-hcm/admin/activity-logs/stats
   * Thống kê nhanh: tổng số lượt theo module, theo ngày (7 ngày gần nhất)
   */
  @Get('stats')
  @ApiOperation({ summary: 'Thống kê tổng quan activity logs (admin)' })
  @RequirePermission('GRADE10', 'manage_schools', 'view')
  async getStats() {
    const [totalCalc, totalCombo, recentDays] = await Promise.all([
      this.logRepo.count({ where: { module: 'calculator' } }),
      this.logRepo.count({ where: { module: 'combo' } }),
      this.logRepo
        .createQueryBuilder('log')
        .select("DATE_TRUNC('day', log.createdAt)", 'day')
        .addSelect('log.module', 'module')
        .addSelect('COUNT(*)::int', 'count')
        .where("log.createdAt >= NOW() - INTERVAL '7 days'")
        .groupBy("DATE_TRUNC('day', log.createdAt), log.module")
        .orderBy("DATE_TRUNC('day', log.createdAt)", 'ASC')
        .getRawMany(),
    ]);

    return {
      totalCalc,
      totalCombo,
      total: totalCalc + totalCombo,
      recentDays,
    };
  }
}
