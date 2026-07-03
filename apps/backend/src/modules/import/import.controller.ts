import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ImportService, ImportPayload, ImportResult } from './import.service';
import { DataImport } from '../database/entities/data-import.entity';

@ApiTags('import')
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import university admission data (JSON payload)' })
  @ApiBody({ schema: { type: 'object', description: 'ImportPayload JSON' } })
  async importData(@Body() payload: ImportPayload): Promise<ImportResult> {
    return this.importService.importData(payload);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get import history log' })
  async getHistory(): Promise<DataImport[]> {
    return this.importService.getImportHistory();
  }
}
