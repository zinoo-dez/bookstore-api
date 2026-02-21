import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { BlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';

describe('BlogsController', () => {
  let controller: BlogsController;
  let service: jest.Mocked<BlogsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlogsController],
      providers: [
        {
          provide: BlogsService,
          useValue: {
            listBlogs: jest.fn(),
            getBlog: jest.fn(),
            getTrendingTags: jest.fn(),
            getStaffPicks: jest.fn(),
            getUserProfile: jest.fn(),
            createBlog: jest.fn(),
            updateBlog: jest.fn(),
            deleteBlog: jest.fn(),
            publishBlog: jest.fn(),
            listLikedPostIds: jest.fn(),
            likeBlog: jest.fn(),
            unlikeBlog: jest.fn(),
            followAuthor: jest.fn(),
            unfollowAuthor: jest.fn(),
            listFollowedAuthors: jest.fn(),
            listComments: jest.fn(),
            addComment: jest.fn(),
            deleteComment: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<BlogsController>(BlogsController);
    service = module.get(BlogsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates listBlogs', async () => {
    const req = { user: { sub: 'user-1' } };
    const dto = { authorId: 'author-1' } as any;
    service.listBlogs.mockResolvedValue({ items: [], total: 0, page: 1, limit: 10 } as any);
    await controller.listBlogs(dto, req);
    expect(service.listBlogs).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('delegates createBlog', async () => {
    const req = { user: { sub: 'user-1' } };
    const dto = { title: 'T', content: 'C' };
    service.createBlog.mockResolvedValue({ id: 'blog-1' } as any);
    await controller.createBlog(req, dto);
    expect(service.createBlog).toHaveBeenCalledWith('user-1', dto);
  });

  it('delegates followAuthor and unfollowAuthor', async () => {
    const req = { user: { sub: 'user-1' } };
    service.followAuthor.mockResolvedValue({ id: 'f-1' } as any);
    service.unfollowAuthor.mockResolvedValue({ id: 'f-1' } as any);

    await controller.followAuthor(req, 'author-1');
    await controller.unfollowAuthor(req, 'author-1');

    expect(service.followAuthor).toHaveBeenCalledWith('user-1', 'author-1');
    expect(service.unfollowAuthor).toHaveBeenCalledWith('user-1', 'author-1');
  });

  it('delegates comments endpoints', async () => {
    const req = { user: { sub: 'user-1' } };
    const commentDto = { content: 'Nice post' };

    service.addComment.mockResolvedValue({ id: 'c-1' } as any);
    service.deleteComment.mockResolvedValue({ success: true } as any);
    service.listComments.mockResolvedValue([] as any);

    await controller.listComments('blog-1');
    await controller.addComment(req, 'blog-1', commentDto);
    await controller.deleteComment(req, 'c-1');

    expect(service.listComments).toHaveBeenCalledWith('blog-1');
    expect(service.addComment).toHaveBeenCalledWith(
      'user-1',
      'blog-1',
      commentDto,
    );
    expect(service.deleteComment).toHaveBeenCalledWith('user-1', 'c-1');
  });
});
