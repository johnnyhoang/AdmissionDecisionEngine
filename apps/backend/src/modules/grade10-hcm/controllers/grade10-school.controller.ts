import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Grade10SchoolService } from '../services/grade10-school.service';
import { CreateSchoolDto, UpdateSchoolDto } from '../dtos/school-crud.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { RequirePermission } from '../../auth/require-permission.decorator';
import { CurrentUser } from '../../auth/current-user.decorator';

@ApiTags('grade10-hcm-schools')
@Controller('api/v1/grade10-hcm/schools')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class Grade10SchoolController {
  constructor(private readonly schoolService: Grade10SchoolService) {}

  @Get()
  @ApiOperation({ summary: 'Search and filter public high schools in HCMC' })
  @RequirePermission('GRADE10', 'view_dashboard', 'view')
  async getSchools(
    @Query('search') search?: string,
    @Query('districtId') districtId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: { role?: string },
  ) {
    return this.schoolService.findAll({
      search,
      districtId,
      page,
      limit,
      includeDataCompleteness: user?.role === 'ADMIN',
    });
  }

  @Get('districts')
  @ApiOperation({ summary: 'Get list of HCMC districts' })
  @RequirePermission('GRADE10', 'view_dashboard', 'view')
  async getDistricts() {
    return this.schoolService.getDistricts();
  }

  @Get('names')
  @ApiOperation({
    summary:
      'Get school names for autocomplete suggestions (q= optional filter)',
  })
  @RequirePermission('GRADE10', 'view_dashboard', 'view')
  async getSchoolNames(@Query('q') q?: string) {
    return this.schoolService.getSchoolNames(q);
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get historical cutoff trend and top competitive schools charts',
  })
  @RequirePermission('GRADE10', 'view_dashboard', 'view')
  async getAnalytics() {
    return this.schoolService.getAnalytics();
  }

  @Get('admin-stats')
  @ApiOperation({ summary: 'Get administrative entity counts' })
  @RequirePermission('GRADE10', 'view_dashboard', 'view')
  async getAdminStats() {
    return this.schoolService.getAdminStats();
  }

  @Post('seed-all')
  @ApiOperation({
    summary: 'Seed all public THPT schools in HCMC from master JSON list',
  })
  @RequirePermission('GRADE10', 'edit_data', 'edit')
  async seedAllSchools() {
    return this.schoolService.seedAllSchools();
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get school detail by school code (e.g. BTX, LQD)' })
  @RequirePermission('GRADE10', 'view_dashboard', 'view')
  async getSchoolDetailByCode(@Param('code') code: string) {
    return this.schoolService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get details, cutoff history, and quotas of a high school',
  })
  @RequirePermission('GRADE10', 'view_dashboard', 'view')
  async getSchoolDetail(@Param('id') id: string) {
    return this.schoolService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new high school' })
  @RequirePermission('GRADE10', 'edit_data', 'edit')
  async createSchool(@Body() dto: CreateSchoolDto) {
    return this.schoolService.createSchool(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update high school profile' })
  @RequirePermission('GRADE10', 'edit_data', 'edit')
  async updateSchool(@Param('id') id: string, @Body() dto: UpdateSchoolDto) {
    return this.schoolService.updateSchool(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete high school' })
  @RequirePermission('GRADE10', 'edit_data', 'edit')
  async deleteSchool(@Param('id') id: string) {
    await this.schoolService.deleteSchool(id);
  }

  @Post('merge')
  @ApiOperation({ summary: 'Merge two high schools' })
  @RequirePermission('GRADE10', 'edit_data', 'edit')
  async mergeSchools(
    @Body('primaryId') primaryId: string,
    @Body('secondaryId') secondaryId: string,
    @Body('mergedData') mergedData: any,
  ) {
    return this.schoolService.mergeSchools(primaryId, secondaryId, mergedData);
  }
}
