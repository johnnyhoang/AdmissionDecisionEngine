import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UniversityService } from './university.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  @Get('universities')
  @RequirePermission('UNIVERSITY', 'view_universities', 'view')
  async getUniversities(
    @Query('search') search?: string,
    @Query('city') city?: string,
    @Query('isPublic') isPublic?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const isPublicBool =
      isPublic !== undefined ? isPublic === 'true' : undefined;
    return this.universityService.findAll({
      search,
      city,
      isPublic: isPublicBool,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Get('universities/:id')
  @RequirePermission('UNIVERSITY', 'view_universities', 'view')
  async getUniversityById(@Param('id') id: string) {
    return this.universityService.findOne(id);
  }

  @Get('majors')
  @RequirePermission('UNIVERSITY', 'view_universities', 'view')
  async getMajors(
    @Query('search') search?: string,
    @Query('sector') sector?: string,
  ) {
    return this.universityService.findMajors(search, sector);
  }

  @Get('majors/:code/analytics')
  @RequirePermission('UNIVERSITY', 'view_universities', 'view')
  async getMajorAnalytics(@Param('code') code: string) {
    return this.universityService.getMajorAnalytics(code);
  }

  @Post('admin/seed-methods')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('UNIVERSITY', 'edit_data', 'edit')
  async seedMethods() {
    await this.universityService.seedAdmissionMethodsIfMissing();
    return { message: 'Admission methods seeded (safe - no data deleted).' };
  }

  @Get('admin/stats')
  @RequirePermission('UNIVERSITY', 'edit_data', 'view')
  async getStats() {
    return this.universityService.getStats();
  }

  @Get('admin/histories')
  @RequirePermission('UNIVERSITY', 'edit_data', 'view')
  async getHistories() {
    return this.universityService.getEvaluationHistory();
  }
}
