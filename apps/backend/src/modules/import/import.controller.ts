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
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ImportService, ImportPayload, ImportResult } from './import.service';
import { DataImport } from '../database/entities/data-import.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';

@ApiTags('import')
@Controller('import')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import university admission data (JSON payload)' })
  @ApiBody({ schema: { type: 'object', description: 'ImportPayload JSON' } })
  @RequirePermission('UNIVERSITY', 'edit_data', 'edit')
  async importData(@Body() payload: ImportPayload): Promise<ImportResult> {
    return this.importService.importData(payload);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get import history log' })
  @RequirePermission('UNIVERSITY', 'edit_data', 'view')
  async getHistory(): Promise<DataImport[]> {
    return this.importService.getImportHistory();
  }

  @Get('presets')
  @ApiOperation({
    summary: 'Get list of importable presets (JSON files in data/imports/)',
  })
  @RequirePermission('UNIVERSITY', 'edit_data', 'view')
  async getPresets() {
    return this.importService.getPresets();
  }

  @Post('presets/:filename/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run import for a specific preset file' })
  @RequirePermission('UNIVERSITY', 'edit_data', 'edit')
  async runPreset(@Param('filename') filename: string): Promise<ImportResult> {
    return this.importService.runPreset(filename);
  }
}
