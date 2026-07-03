import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Grade10ImportService, Grade10ImportPayload } from '../services/grade10-import.service';

@ApiTags('grade10-hcm-admin')
@Controller('api/v1/grade10-hcm/admin')
export class Grade10AdminController {
  constructor(private readonly importService: Grade10ImportService) {}

  @Get('presets')
  @ApiOperation({ summary: 'Get list of available Grade 10 presets' })
  async getPresets() {
    return this.importService.getPresets();
  }

  @Post('presets/:filename/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run synchronization for a preset file' })
  async runPreset(@Param('filename') filename: string) {
    return this.importService.runPreset(filename);
  }

  @Get('imports/history')
  @ApiOperation({ summary: 'Get details of past imports' })
  async getHistory() {
    return this.importService.getImportHistory();
  }

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload custom JSON payload to import schools/scores directly' })
  async importData(@Body() payload: Grade10ImportPayload) {
    return this.importService.importData(payload);
  }
}
