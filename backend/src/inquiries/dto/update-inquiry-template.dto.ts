import { PartialType } from '@nestjs/swagger';
import { CreateInquiryTemplateDto } from './create-inquiry-template.dto';

export class UpdateInquiryTemplateDto extends PartialType(
  CreateInquiryTemplateDto,
) {}
