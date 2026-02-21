import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { BlogsService } from './blogs.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('BlogsService', () => {
  let service: BlogsService;
  let prisma: any;
  let notificationsService: { createUserNotification: jest.Mock };

  beforeEach(async () => {
    notificationsService = {
      createUserNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogsService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
            book: { count: jest.fn() },
            authorBlog: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            authorFollow: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            blogLike: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            blogComment: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    service = module.get<BlogsService>(BlogsService);
    prisma = module.get(PrismaService);

    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'User One',
      role: 'USER',
    });
    prisma.book.count.mockResolvedValue(0);
    prisma.$transaction.mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('createBlog creates notifications for followers when published', async () => {
    prisma.authorBlog.create.mockResolvedValue({
      id: 'blog-1',
      authorId: 'user-1',
      title: 'Post A',
      content: 'Body',
      tags: [],
      bookReferences: [],
      likes: [],
      _count: { comments: 0 },
    });
    prisma.authorFollow.findMany.mockResolvedValue([
      { followerId: 'u-2' },
      { followerId: 'u-3' },
    ]);

    const result = await service.createBlog('user-1', {
      title: 'Post A',
      content: 'Body',
      status: 'PUBLISHED',
    });

    expect(notificationsService.createUserNotification).toHaveBeenCalledTimes(2);
    expect(notificationsService.createUserNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u-2',
        link: '/blogs/blog-1',
      }),
    );
    expect(notificationsService.createUserNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u-3',
        link: '/blogs/blog-1',
      }),
    );
    expect(result.id).toBe('blog-1');
  });

  it('followAuthor prevents following self', async () => {
    await expect(service.followAuthor('user-1', 'user-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('followAuthor creates follow relation', async () => {
    prisma.authorFollow.findUnique.mockResolvedValue(null);
    prisma.authorFollow.create.mockResolvedValue({ id: 'follow-1' });

    const result = await service.followAuthor('user-1', 'author-1');

    expect(prisma.authorFollow.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          followerId: 'user-1',
          authorId: 'author-1',
        },
      }),
    );
    expect(result.id).toBe('follow-1');
  });

  it('updateBlog only allows owner', async () => {
    prisma.authorBlog.findUnique.mockResolvedValue({
      id: 'blog-1',
      authorId: 'author-2',
    });
    await expect(
      service.updateBlog('user-1', 'blog-1', { title: 'x' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deleteComment allows blog owner', async () => {
    prisma.blogComment.findUnique.mockResolvedValue({
      id: 'comment-1',
      blogId: 'blog-1',
      userId: 'other-user',
      blog: { authorId: 'user-1' },
    });

    const result = await service.deleteComment('user-1', 'comment-1');
    expect(result).toEqual({ success: true });
  });

  it('listLikedPostIds returns liked post ids for user', async () => {
    prisma.blogLike.findMany.mockResolvedValue([
      { postId: 'blog-1' },
      { postId: 'blog-2' },
    ]);
    const result = await service.listLikedPostIds('user-1');
    expect(result).toEqual({ postIds: ['blog-1', 'blog-2'] });
  });

  it('unlikeBlog returns liked false when no like exists', async () => {
    prisma.blogLike.findUnique.mockResolvedValue(null);
    const result = await service.unlikeBlog('user-1', 'blog-1');
    expect(result).toEqual({ liked: false });
  });

  it('throws unauthorized if user session is invalid', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.listFollowedAuthors('user-1')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws not found when blog for comments does not exist', async () => {
    prisma.authorBlog.findUnique.mockResolvedValue(null);
    await expect(service.listComments('blog-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
