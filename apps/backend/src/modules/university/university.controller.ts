import { Controller, Get, Post, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { UniversityService } from './university.service';

@Controller('api/v1')
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  @Get('universities')
  async getUniversities(
    @Query('search') search?: string,
    @Query('city') city?: string,
    @Query('isPublic') isPublic?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const isPublicBool = isPublic !== undefined ? isPublic === 'true' : undefined;
    return this.universityService.findAll({
      search,
      city,
      isPublic: isPublicBool,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Get('universities/:id')
  async getUniversityById(@Param('id') id: string) {
    return this.universityService.findOne(id);
  }

  @Get('majors')
  async getMajors(
    @Query('search') search?: string,
    @Query('sector') sector?: string,
  ) {
    return this.universityService.findMajors(search, sector);
  }

  @Get('majors/:code/analytics')
  async getMajorAnalytics(@Param('code') code: string) {
    return this.universityService.getMajorAnalytics(code);
  }

  @Post('admin/seed-methods')
  @HttpCode(HttpStatus.OK)
  async seedMethods() {
    // Only seeds admission methods if they are missing - SAFE, never deletes data
    await this.universityService.seedAdmissionMethodsIfMissing();
    return { message: 'Admission methods seeded (safe - no data deleted).' };
  }

  @Get('admin/stats')
  async getStats() {
    return this.universityService.getStats();
  }

  @Get('admin/histories')
  async getHistories() {
    return this.universityService.getEvaluationHistory();
  }
}
