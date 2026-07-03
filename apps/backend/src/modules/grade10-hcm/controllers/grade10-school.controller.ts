import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Grade10SchoolService } from '../services/grade10-school.service';
import { CreateSchoolDto, UpdateSchoolDto } from '../dtos/school-crud.dto';

@ApiTags('grade10-hcm-schools')
@Controller('api/v1/grade10-hcm/schools')
export class Grade10SchoolController {
  constructor(private readonly schoolService: Grade10SchoolService) {}

  @Get()
  @ApiOperation({ summary: 'Search and filter public high schools in HCMC' })
  async getSchools(
    @Query('search') search?: string,
    @Query('districtId') districtId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.schoolService.findAll({ search, districtId, page, limit });
  }

  @Get('districts')
  @ApiOperation({ summary: 'Get list of HCMC districts' })
  async getDistricts() {
    return this.schoolService.getDistricts();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get historical cutoff trend and top competitive schools charts' })
  async getAnalytics() {
    return this.schoolService.getAnalytics();
  }

  @Get('admin-stats')
  @ApiOperation({ summary: 'Get administrative entity counts' })
  async getAdminStats() {
    return this.schoolService.getAdminStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details, cutoff history, and quotas of a high school' })
  async getSchoolDetail(@Param('id') id: string) {
    return this.schoolService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new high school' })
  async createSchool(@Body() dto: CreateSchoolDto) {
    return this.schoolService.createSchool(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update high school profile' })
  async updateSchool(@Param('id') id: string, @Body() dto: UpdateSchoolDto) {
    return this.schoolService.updateSchool(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete high school' })
  async deleteSchool(@Param('id') id: string) {
    await this.schoolService.deleteSchool(id);
  }
}
