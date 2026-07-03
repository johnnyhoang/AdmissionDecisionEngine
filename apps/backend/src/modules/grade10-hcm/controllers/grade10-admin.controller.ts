import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  Grade10ImportService,
  Grade10ImportPayload,
} from '../services/grade10-import.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { RequirePermission } from '../../auth/require-permission.decorator';

@ApiTags('grade10-hcm-admin')
@Controller('api/v1/grade10-hcm/admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class Grade10AdminController {
  constructor(private readonly importService: Grade10ImportService) {}

  @Get('presets')
  @ApiOperation({ summary: 'Get list of available Grade 10 presets' })
  @RequirePermission('GRADE10', 'edit_data', 'view')
  async getPresets() {
    return this.importService.getPresets();
  }

  @Post('presets/:filename/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run synchronization for a preset file' })
  @RequirePermission('GRADE10', 'edit_data', 'edit')
  async runPreset(@Param('filename') filename: string) {
    return this.importService.runPreset(filename);
  }

  @Get('imports/history')
  @ApiOperation({ summary: 'Get details of past imports' })
  @RequirePermission('GRADE10', 'edit_data', 'view')
  async getHistory() {
    return this.importService.getImportHistory();
  }

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload custom JSON payload to import schools/scores directly',
  })
  @RequirePermission('GRADE10', 'edit_data', 'edit')
  async importData(@Body() payload: Grade10ImportPayload) {
    return this.importService.importData(payload);
  }
}
