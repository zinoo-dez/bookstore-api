import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { LibraryService } from './library.service';

@ApiTags('library')
@Controller('library')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get('wishlist')
  @ApiOperation({ summary: 'Get user wishlist' })
  @ApiResponse({ status: 200, description: 'Wishlist retrieved successfully' })
  getWishlist(@Request() req: any) {
    return this.libraryService.getWishlist(req.user.sub);
  }

  @Post('wishlist/:bookId')
  @ApiOperation({ summary: 'Add book to wishlist' })
  @ApiResponse({ status: 201, description: 'Book added to wishlist' })
  addToWishlist(@Request() req: any, @Param('bookId') bookId: string) {
    return this.libraryService.addToWishlist(req.user.sub, bookId);
  }

  @Delete('wishlist/:bookId')
  @ApiOperation({ summary: 'Remove book from wishlist' })
  @ApiResponse({ status: 200, description: 'Book removed from wishlist' })
  removeFromWishlist(@Request() req: any, @Param('bookId') bookId: string) {
    return this.libraryService.removeFromWishlist(req.user.sub, bookId);
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Get user favorites' })
  @ApiResponse({ status: 200, description: 'Favorites retrieved successfully' })
  getFavorites(@Request() req: any) {
    return this.libraryService.getFavorites(req.user.sub);
  }

  @Post('favorites/:bookId')
  @ApiOperation({ summary: 'Add book to favorites' })
  @ApiResponse({ status: 201, description: 'Book added to favorites' })
  addToFavorites(@Request() req: any, @Param('bookId') bookId: string) {
    return this.libraryService.addToFavorites(req.user.sub, bookId);
  }

  @Delete('favorites/:bookId')
  @ApiOperation({ summary: 'Remove book from favorites' })
  @ApiResponse({ status: 200, description: 'Book removed from favorites' })
  removeFromFavorites(@Request() req: any, @Param('bookId') bookId: string) {
    return this.libraryService.removeFromFavorites(req.user.sub, bookId);
  }
}
