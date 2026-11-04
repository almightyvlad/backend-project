import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.js'
import { AvatarsService } from './avatars.service.js'
import { FileInterceptor } from '@nestjs/platform-express'

@Controller('avatars')
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        if (!['image/png', 'image/jpeg'].includes(file.mimetype)) {
          return callback(
            new BadRequestException('Only JPEG and PNG files are allowed'),
            false,
          )
        }

        callback(null, true)
      },
    }),
  )
  uploadAvatar(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required')
    }

    return this.avatarsService.uploadAvatar(request.user.sub, file)
  }

  @Delete(':id')
  deleteAvatar(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.avatarsService.deleteAvatar(id, request.user.sub)
  }
}
