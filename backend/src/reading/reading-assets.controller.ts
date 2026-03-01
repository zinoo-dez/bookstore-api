import {
  Controller,
  Get,
  Param,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createReadStream, statSync } from 'fs';
import type { Request, Response } from 'express';
import { ReadingService } from './reading.service';

@ApiTags('reading')
@Controller('reading/assets')
export class ReadingAssetsController {
  constructor(private readonly readingService: ReadingService) {}

  @Get(':token')
  @ApiOperation({
    summary: 'Stream protected eBook asset from a short-lived token',
  })
  @ApiResponse({
    status: 200,
    description: 'eBook asset streamed',
  })
  async streamEbookAsset(
    @Param('token') token: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const asset = await this.readingService.resolveEbookAssetFromToken(token);
    const range = request.headers?.range;
    const fileStat = statSync(asset.absolutePath);
    const fileSize = fileStat.size;

    response.setHeader('Content-Type', asset.mimeType);
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${asset.fileName}"`,
    );
    response.setHeader('Cache-Control', 'private, max-age=300');
    response.setHeader('Accept-Ranges', 'bytes');

    if (range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (match) {
        const start = Number(match[1]);
        const end = match[2] ? Number(match[2]) : fileSize - 1;
        if (start < fileSize) {
          const chunkEnd = Math.min(end, fileSize - 1);
          const chunkSize = chunkEnd - start + 1;
          response.status(206);
          response.setHeader(
            'Content-Range',
            `bytes ${start}-${chunkEnd}/${fileSize}`,
          );
          response.setHeader('Content-Length', chunkSize.toString());
          return new StreamableFile(
            createReadStream(asset.absolutePath, { start, end: chunkEnd }),
          );
        }
      }
    }

    response.setHeader('Content-Length', fileSize.toString());
    return new StreamableFile(createReadStream(asset.absolutePath));
  }
}
