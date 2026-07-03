import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { IsString, IsOptional, IsEnum, IsNotEmpty, IsArray } from 'class-validator';
import { AiAssistantService } from './ai-assistant.service';

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class SearchCutoffsDto {
  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(['GRADE10', 'UNIVERSITY'])
  @IsNotEmpty()
  type: 'GRADE10' | 'UNIVERSITY';

  @IsString()
  @IsNotEmpty()
  schoolQuery: string;

  @IsString()
  @IsOptional()
  majorQuery?: string;
}

export class ImportCutoffsDto {
  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(['GRADE10', 'UNIVERSITY'])
  @IsNotEmpty()
  type: 'GRADE10' | 'UNIVERSITY';

  @IsString()
  @IsNotEmpty()
  schoolCode: string;

  @IsString()
  @IsOptional()
  majorCode?: string;

  @IsArray()
  @IsNotEmpty()
  overrides: any[];
}

@Controller('api/v1/ai')
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() dto: ChatMessageDto) {
    return this.aiAssistantService.chat(dto.message);
  }

  @Post('search-cutoffs')
  @HttpCode(HttpStatus.OK)
  async searchCutoffs(@Body() dto: SearchCutoffsDto) {
    return this.aiAssistantService.searchCutoffs(dto);
  }

  @Post('import-cutoffs')
  @HttpCode(HttpStatus.OK)
  async importCutoffs(@Body() dto: ImportCutoffsDto) {
    return this.aiAssistantService.importCutoffs(dto);
  }
}
