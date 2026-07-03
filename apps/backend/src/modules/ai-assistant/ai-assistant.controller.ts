import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';

export class ChatMessageDto {
  message: string;
}

export class SearchCutoffsDto {
  password?: string;
  type: 'GRADE10' | 'UNIVERSITY';
  schoolQuery: string;
  majorQuery?: string;
}

export class ImportCutoffsDto {
  password?: string;
  type: 'GRADE10' | 'UNIVERSITY';
  schoolCode: string;
  majorCode?: string;
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
