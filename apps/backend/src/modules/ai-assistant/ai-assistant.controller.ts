import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';

export class ChatMessageDto {
  message: string;
}

@Controller('api/v1/ai')
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() dto: ChatMessageDto) {
    return this.aiAssistantService.chat(dto.message);
  }
}
