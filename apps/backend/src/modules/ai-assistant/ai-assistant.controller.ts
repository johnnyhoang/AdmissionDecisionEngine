import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsArray,
} from 'class-validator';
import { AiAssistantService } from './ai-assistant.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../auth/admin-role.guard';

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class SearchCutoffsDto {
  @IsEnum(['GRADE10', 'UNIVERSITY'])
  @IsNotEmpty()
  type: 'GRADE10' | 'UNIVERSITY';

  @IsString()
  @IsNotEmpty()
  schoolQuery: string;

  @IsString()
  @IsOptional()
  majorQuery?: string;

  @IsString()
  @IsOptional()
  schoolCode?: string;

  @IsString()
  @IsOptional()
  districtName?: string;

  @IsString()
  @IsOptional()
  districtCode?: string;
}

export class ImportCutoffsDto {
  @IsEnum(['GRADE10', 'UNIVERSITY'])
  @IsNotEmpty()
  type: 'GRADE10' | 'UNIVERSITY';

  @IsString()
  @IsNotEmpty()
  schoolCode: string;

  @IsString()
  @IsOptional()
  majorCode?: string;

  @IsString()
  @IsOptional()
  districtName?: string;

  @IsArray()
  @IsNotEmpty()
  overrides: any[];
}

@Controller('api/v1/ai')
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async chat(@Body() dto: ChatMessageDto) {
    return this.aiAssistantService.chat(dto.message);
  }

  @Post('search-cutoffs')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async searchCutoffs(@Body() dto: SearchCutoffsDto) {
    return this.aiAssistantService.searchCutoffs(dto);
  }

  @Post('import-cutoffs')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async importCutoffs(@Body() dto: ImportCutoffsDto) {
    return this.aiAssistantService.importCutoffs(dto);
  }
}
