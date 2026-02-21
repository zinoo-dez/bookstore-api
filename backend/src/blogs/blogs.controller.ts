import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { CreateBlogCommentDto } from './dto/create-blog-comment.dto';
import { ListBlogsDto } from './dto/list-blogs.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@ApiTags('blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'List blog posts for feed tabs' })
  @ApiResponse({
    status: 200,
    description: 'Blog posts retrieved successfully',
  })
  listBlogs(@Query() dto: ListBlogsDto, @Request() req?: any) {
    return this.blogsService.listBlogs(dto, req?.user?.sub);
  }

  @Get('trending-tags')
  @ApiOperation({ summary: 'Get trending tags from published posts' })
  trendingTags() {
    return this.blogsService.getTrendingTags();
  }

  @Get('staff-picks')
  @ApiOperation({ summary: 'Get staff picks from top-performing recent posts' })
  staffPicks() {
    return this.blogsService.getStaffPicks();
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('users/:userId')
  @ApiOperation({ summary: 'Get public user profile with published posts' })
  getUserProfile(@Param('userId') userId: string, @Request() req?: any) {
    return this.blogsService.getUserProfile(userId, req?.user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post()
  @ApiOperation({ summary: 'Create blog post draft or publish' })
  createBlog(@Request() req: any, @Body() dto: CreateBlogDto) {
    return this.blogsService.createBlog(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch(':blogId')
  @ApiOperation({ summary: 'Update own blog post (or admin)' })
  updateBlog(
    @Request() req: any,
    @Param('blogId') blogId: string,
    @Body() dto: UpdateBlogDto,
  ) {
    return this.blogsService.updateBlog(req.user.sub, blogId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':blogId')
  @ApiOperation({ summary: 'Delete own blog post (or admin)' })
  deleteBlog(@Request() req: any, @Param('blogId') blogId: string) {
    return this.blogsService.deleteBlog(req.user.sub, blogId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post(':blogId/publish')
  @ApiOperation({ summary: 'Publish own draft blog post' })
  publishPost(@Request() req: any, @Param('blogId') blogId: string) {
    return this.blogsService.publishBlog(req.user.sub, blogId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('likes/me')
  @ApiOperation({ summary: 'List ids of blog posts liked by current user' })
  listMyLikes(@Request() req: any) {
    return this.blogsService.listLikedPostIds(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post(':blogId/like')
  @ApiOperation({ summary: 'Like a blog post' })
  likeBlog(@Request() req: any, @Param('blogId') blogId: string) {
    return this.blogsService.likeBlog(req.user.sub, blogId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':blogId/like')
  @ApiOperation({ summary: 'Unlike a blog post' })
  unlikeBlog(@Request() req: any, @Param('blogId') blogId: string) {
    return this.blogsService.unlikeBlog(req.user.sub, blogId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('authors/:authorId/follow')
  @ApiOperation({ summary: 'Follow an author' })
  followAuthor(@Request() req: any, @Param('authorId') authorId: string) {
    return this.blogsService.followAuthor(req.user.sub, authorId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete('authors/:authorId/follow')
  @ApiOperation({ summary: 'Unfollow an author' })
  unfollowAuthor(@Request() req: any, @Param('authorId') authorId: string) {
    return this.blogsService.unfollowAuthor(req.user.sub, authorId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('follows/me')
  @ApiOperation({ summary: 'List authors followed by current user' })
  listFollowedAuthors(@Request() req: any) {
    return this.blogsService.listFollowedAuthors(req.user.sub);
  }

  @Get(':blogId/comments')
  @ApiOperation({ summary: 'List blog comments' })
  listComments(@Param('blogId') blogId: string) {
    return this.blogsService.listComments(blogId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':blogId')
  @ApiOperation({ summary: 'Get a published blog post and comments' })
  getBlog(@Param('blogId') blogId: string, @Request() req?: any) {
    return this.blogsService.getBlog(blogId, req?.user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post(':blogId/comments')
  @ApiOperation({ summary: 'Add comment to blog post' })
  addComment(
    @Request() req: any,
    @Param('blogId') blogId: string,
    @Body() dto: CreateBlogCommentDto,
  ) {
    return this.blogsService.addComment(req.user.sub, blogId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Delete comment' })
  deleteComment(@Request() req: any, @Param('commentId') commentId: string) {
    return this.blogsService.deleteComment(req.user.sub, commentId);
  }
}
