import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBlogCommentDto } from './dto/create-blog-comment.dto';
import { CreateBlogDto } from './dto/create-blog.dto';
import { ListBlogsDto } from './dto/list-blogs.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

const BLOG_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;

@Injectable()
export class BlogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async ensureUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(
        'Invalid user session. Please login again.',
      );
    }
    return user;
  }

  private estimateReadingTime(content: string) {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 220));
  }

  private normalizeTags(tags?: string[]) {
    if (!tags) return [];

    const unique = new Set<string>();
    for (const raw of tags) {
      const normalized = raw.trim().toLowerCase();
      if (!normalized) continue;
      unique.add(normalized.slice(0, 40));
    }

    return Array.from(unique).slice(0, 8);
  }

  private async assertBooksExist(bookIds: string[]) {
    if (bookIds.length === 0) return;

    const existingCount = await this.prisma.book.count({
      where: { id: { in: bookIds } },
    });

    if (existingCount !== bookIds.length) {
      throw new NotFoundException(
        'One or more referenced books were not found',
      );
    }
  }

  private blogInclude(currentUserId?: string): any {
    return {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarType: true,
          avatarValue: true,
          backgroundColor: true,
          pronouns: true,
          shortBio: true,
          about: true,
          coverImage: true,
        },
      },
      tags: {
        include: { tag: true },
      },
      bookReferences: {
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImage: true,
            },
          },
        },
      },
      likes: currentUserId
        ? {
            where: { userId: currentUserId },
            select: { id: true },
            take: 1,
          }
        : false,
      _count: {
        select: {
          comments: true,
        },
      },
    };
  }

  private mapBlog(item: any, currentUserId?: string) {
    return {
      ...item,
      tags: (item.tags ?? []).map((t: any) => t.tag),
      bookReferences: (item.bookReferences ?? []).map((r: any) => r.book),
      isLikedByMe: currentUserId ? (item.likes ?? []).length > 0 : false,
    };
  }

  async listBlogs(dto: ListBlogsDto, currentUserId?: string) {
    const db = this.prisma as any;
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;
    const tab = dto.tab ?? 'for_you';
    const tagFilters = Array.from(
      new Set(
        [
          dto.tag?.trim(),
          ...(dto.tags ?? '')
            .split(',')
            .map((name) => name.trim()),
        ].filter((name): name is string => !!name),
      ),
    ).slice(0, 8);

    let followedAuthorIds: string[] = [];
    if (currentUserId) {
      const follows = await db.authorFollow.findMany({
        where: { followerId: currentUserId },
        select: { authorId: true },
      });
      followedAuthorIds = follows.map((f: any) => f.authorId);
    }

    const where: any = {
      ...(dto.authorId ? { authorId: dto.authorId } : {}),
      ...(dto.status
        ? { status: dto.status }
        : { status: BLOG_STATUS.PUBLISHED }),
    };

    if (tagFilters.length > 0) {
      where.AND = [
        ...(where.AND ?? []),
        {
          OR: tagFilters.map((name) => ({
            tags: {
              some: {
                tag: {
                  name: {
                    equals: name,
                    mode: 'insensitive',
                  },
                },
              },
            },
          })),
        },
      ];
    }

    if (tab === 'following') {
      where.authorId = followedAuthorIds.length
        ? { in: followedAuthorIds }
        : '__none__';
    }

    if (tab === 'for_you' && followedAuthorIds.length > 0) {
      where.OR = [
        { authorId: { in: followedAuthorIds } },
        { likesCount: { gte: 8 } },
        { commentsCount: { gte: 4 } },
      ];
    }

    const orderBy: any[] =
      tab === 'trending'
        ? [
            { likesCount: 'desc' },
            { commentsCount: 'desc' },
            { viewsCount: 'desc' },
            { createdAt: 'desc' },
          ]
        : tab === 'for_you'
          ? [{ createdAt: 'desc' }, { likesCount: 'desc' }]
          : [{ createdAt: 'desc' }];

    const [items, total] = await Promise.all([
      db.authorBlog.findMany({
        where,
        include: this.blogInclude(currentUserId),
        orderBy,
        skip,
        take: limit,
      }),
      db.authorBlog.count({ where }),
    ]);

    return {
      items: items.map((item: any) => this.mapBlog(item, currentUserId)),
      total,
      page,
      limit,
    };
  }

  async getBlog(blogId: string, currentUserId?: string) {
    const db = this.prisma as any;
    const existing = await db.authorBlog.findUnique({ where: { id: blogId } });
    if (!existing) {
      throw new NotFoundException('Blog post not found');
    }

    if (
      existing.status === BLOG_STATUS.DRAFT &&
      (!currentUserId || existing.authorId !== currentUserId)
    ) {
      throw new NotFoundException('Blog post not found');
    }

    const blog = await db.authorBlog.update({
      where: { id: blogId },
      data: { viewsCount: { increment: 1 } },
      include: {
        ...this.blogInclude(currentUserId),
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarType: true,
                avatarValue: true,
                backgroundColor: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return this.mapBlog(blog, currentUserId);
  }

  async createBlog(userId: string, dto: CreateBlogDto) {
    const db = this.prisma as any;
    const user = await this.ensureUser(userId);
    const tags = this.normalizeTags(dto.tags);
    const bookIds = Array.from(new Set(dto.bookIds ?? []));
    await this.assertBooksExist(bookIds);

    const readingTime =
      dto.readingTime ?? this.estimateReadingTime(dto.content);
    const status = dto.status ?? BLOG_STATUS.DRAFT;

    const blog = await db.authorBlog.create({
      data: {
        authorId: userId,
        title: dto.title.trim(),
        subtitle: dto.subtitle?.trim() || null,
        content: dto.content,
        coverImage: dto.coverImage?.trim() || null,
        readingTime,
        status,
        tags: tags.length
          ? {
              create: tags.map((name) => ({
                tag: {
                  connectOrCreate: {
                    where: { name },
                    create: { name },
                  },
                },
              })),
            }
          : undefined,
        bookReferences: bookIds.length
          ? {
              create: bookIds.map((bookId) => ({
                book: {
                  connect: { id: bookId },
                },
              })),
            }
          : undefined,
      },
      include: this.blogInclude(userId),
    });

    if (status === BLOG_STATUS.PUBLISHED) {
      await this.notifyFollowersOnPublish(user, blog.id, blog.title);
    }

    return this.mapBlog(blog, userId);
  }

  async updateBlog(userId: string, blogId: string, dto: UpdateBlogDto) {
    const db = this.prisma as any;
    const user = await this.ensureUser(userId);

    const existing = await db.authorBlog.findUnique({ where: { id: blogId } });
    if (!existing) {
      throw new NotFoundException('Blog post not found');
    }

    if (
      existing.authorId !== userId &&
      user.role !== Role.ADMIN &&
      String(user.role) !== 'SUPER_ADMIN'
    ) {
      throw new ForbiddenException('You can only edit your own blog posts');
    }

    const nextTags = dto.tags ? this.normalizeTags(dto.tags) : undefined;
    const nextBookIds = dto.bookIds
      ? Array.from(new Set(dto.bookIds))
      : undefined;
    if (nextBookIds) {
      await this.assertBooksExist(nextBookIds);
    }

    const statusBefore = existing.status;

    const updated = await db.$transaction(async (tx: any) => {
      if (nextTags) {
        await tx.blogPostTag.deleteMany({ where: { postId: blogId } });
      }

      if (nextBookIds) {
        await tx.blogPostBookReference.deleteMany({
          where: { postId: blogId },
        });
      }

      return tx.authorBlog.update({
        where: { id: blogId },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.subtitle !== undefined
            ? { subtitle: dto.subtitle?.trim() || null }
            : {}),
          ...(dto.content !== undefined ? { content: dto.content } : {}),
          ...(dto.coverImage !== undefined
            ? { coverImage: dto.coverImage?.trim() || null }
            : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.readingTime !== undefined
            ? { readingTime: dto.readingTime }
            : dto.content !== undefined
              ? { readingTime: this.estimateReadingTime(dto.content) }
              : {}),
          ...(nextTags
            ? {
                tags: {
                  create: nextTags.map((name) => ({
                    tag: {
                      connectOrCreate: {
                        where: { name },
                        create: { name },
                      },
                    },
                  })),
                },
              }
            : {}),
          ...(nextBookIds
            ? {
                bookReferences: {
                  create: nextBookIds.map((bookId) => ({
                    book: {
                      connect: { id: bookId },
                    },
                  })),
                },
              }
            : {}),
        },
        include: this.blogInclude(userId),
      });
    });

    if (
      statusBefore !== BLOG_STATUS.PUBLISHED &&
      updated.status === BLOG_STATUS.PUBLISHED
    ) {
      await this.notifyFollowersOnPublish(user, updated.id, updated.title);
    }

    return this.mapBlog(updated, userId);
  }

  async publishBlog(userId: string, blogId: string) {
    return this.updateBlog(userId, blogId, { status: BLOG_STATUS.PUBLISHED });
  }

  async deleteBlog(userId: string, blogId: string) {
    const user = await this.ensureUser(userId);
    const existing = await this.prisma.authorBlog.findUnique({
      where: { id: blogId },
    });

    if (!existing) {
      throw new NotFoundException('Blog post not found');
    }

    if (
      existing.authorId !== userId &&
      user.role !== Role.ADMIN &&
      String(user.role) !== 'SUPER_ADMIN'
    ) {
      throw new ForbiddenException('You can only delete your own blog posts');
    }

    return this.prisma.authorBlog.delete({ where: { id: blogId } });
  }

  async likeBlog(userId: string, blogId: string) {
    const db = this.prisma as any;
    const user = await this.ensureUser(userId);
    const blog = await db.authorBlog.findUnique({ where: { id: blogId } });

    if (!blog || blog.status !== BLOG_STATUS.PUBLISHED) {
      throw new NotFoundException('Blog post not found');
    }

    const existing = await db.blogLike.findUnique({
      where: { postId_userId: { postId: blogId, userId } },
    });

    if (existing) {
      return { liked: true };
    }

    await db.$transaction([
      db.blogLike.create({ data: { postId: blogId, userId } }),
      db.authorBlog.update({
        where: { id: blogId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);

    if (blog.authorId !== userId) {
      await this.notificationsService.createUserNotification({
        userId: blog.authorId,
        type: 'blog_like' as any,
        title: 'New like on your post',
        message: `${user.name} liked "${blog.title}".`,
        link: `/blogs/${blog.id}`,
      });
    }

    return { liked: true };
  }

  async unlikeBlog(userId: string, blogId: string) {
    const db = this.prisma as any;
    await this.ensureUser(userId);

    const existing = await db.blogLike.findUnique({
      where: { postId_userId: { postId: blogId, userId } },
    });

    if (!existing) {
      return { liked: false };
    }

    await db.$transaction([
      db.blogLike.delete({ where: { id: existing.id } }),
      db.authorBlog.update({
        where: { id: blogId },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);

    return { liked: false };
  }

  async listLikedPostIds(userId: string) {
    const db = this.prisma as any;
    await this.ensureUser(userId);

    const likes = await db.blogLike.findMany({
      where: { userId },
      select: { postId: true },
    });

    return { postIds: likes.map((like: any) => like.postId) };
  }

  async followAuthor(userId: string, authorId: string) {
    const db = this.prisma as any;
    const user = await this.ensureUser(userId);
    await this.ensureUser(authorId);

    if (userId === authorId) {
      throw new ForbiddenException('You cannot follow yourself');
    }

    const existing = await db.authorFollow.findUnique({
      where: { followerId_authorId: { followerId: userId, authorId } },
    });

    if (existing) {
      return existing;
    }

    const follow = await db.authorFollow.create({
      data: {
        followerId: userId,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarType: true,
            avatarValue: true,
            backgroundColor: true,
            pronouns: true,
            shortBio: true,
            about: true,
            coverImage: true,
          },
        },
      },
    });

    await this.notificationsService.createUserNotification({
      userId: authorId,
      type: 'blog_follow' as any,
      title: 'New follower',
      message: `${user.name} started following you.`,
      link: `/user/${user.id}`,
    });

    return follow;
  }

  async unfollowAuthor(userId: string, authorId: string) {
    const db = this.prisma as any;
    await this.ensureUser(userId);

    const follow = await db.authorFollow.findUnique({
      where: { followerId_authorId: { followerId: userId, authorId } },
    });

    if (!follow) {
      throw new NotFoundException('Follow relationship not found');
    }

    return db.authorFollow.delete({ where: { id: follow.id } });
  }

  async listFollowedAuthors(userId: string) {
    const db = this.prisma as any;
    await this.ensureUser(userId);

    return db.authorFollow.findMany({
      where: { followerId: userId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarType: true,
            avatarValue: true,
            backgroundColor: true,
            pronouns: true,
            shortBio: true,
            about: true,
            coverImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserProfile(userId: string, currentUserId?: string) {
    const db = this.prisma as any;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarType: true,
        avatarValue: true,
        backgroundColor: true,
        pronouns: true,
        shortBio: true,
        about: true,
        coverImage: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [posts, followers, following, isFollowing] = await Promise.all([
      db.authorBlog.findMany({
        where: { authorId: userId, status: BLOG_STATUS.PUBLISHED },
        include: this.blogInclude(currentUserId),
        orderBy: { createdAt: 'desc' },
      }),
      db.authorFollow.count({ where: { authorId: userId } }),
      db.authorFollow.count({ where: { followerId: userId } }),
      currentUserId
        ? db.authorFollow.findUnique({
            where: {
              followerId_authorId: {
                followerId: currentUserId,
                authorId: userId,
              },
            },
          })
        : null,
    ]);

    return {
      user,
      stats: {
        followers,
        following,
        posts: posts.length,
      },
      isFollowing: !!isFollowing,
      posts: posts.map((item: any) => this.mapBlog(item, currentUserId)),
    };
  }

  async listComments(blogId: string) {
    const db = this.prisma as any;
    const blog = await db.authorBlog.findUnique({ where: { id: blogId } });
    if (!blog || blog.status !== BLOG_STATUS.PUBLISHED) {
      throw new NotFoundException('Blog post not found');
    }

    return db.blogComment.findMany({
      where: { blogId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarType: true,
            avatarValue: true,
            backgroundColor: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addComment(userId: string, blogId: string, dto: CreateBlogCommentDto) {
    const db = this.prisma as any;
    const commenter = await this.ensureUser(userId);

    const blog = await db.authorBlog.findUnique({ where: { id: blogId } });
    if (!blog || blog.status !== BLOG_STATUS.PUBLISHED) {
      throw new NotFoundException('Blog post not found');
    }

    const comment = await db.$transaction(async (tx: any) => {
      const created = await tx.blogComment.create({
        data: {
          blogId,
          userId,
          content: dto.content,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarType: true,
              avatarValue: true,
              backgroundColor: true,
            },
          },
        },
      });

      await tx.authorBlog.update({
        where: { id: blogId },
        data: { commentsCount: { increment: 1 } },
      });

      return created;
    });

    if (blog.authorId !== userId) {
      await this.notificationsService.createUserNotification({
        userId: blog.authorId,
        type: 'blog_comment' as any,
        title: 'New comment on your post',
        message: `${commenter.name} commented on "${blog.title}".`,
        link: `/blogs/${blog.id}`,
      });
    }

    return comment;
  }

  async deleteComment(userId: string, commentId: string) {
    const db = this.prisma as any;
    const user = await this.ensureUser(userId);

    const comment = await db.blogComment.findUnique({
      where: { id: commentId },
      include: { blog: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (
      comment.userId !== userId &&
      comment.blog.authorId !== userId &&
      user.role !== Role.ADMIN &&
      String(user.role) !== 'SUPER_ADMIN'
    ) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await db.$transaction([
      db.blogComment.delete({ where: { id: commentId } }),
      db.authorBlog.update({
        where: { id: comment.blogId },
        data: { commentsCount: { decrement: 1 } },
      }),
    ]);

    return { success: true };
  }

  async getTrendingTags() {
    const db = this.prisma as any;
    const grouped = await db.blogPostTag.groupBy({
      by: ['tagId'],
      _count: { tagId: true },
      orderBy: { _count: { tagId: 'desc' } },
      take: 12,
    });

    if (!grouped.length) return [];

    const tags = await db.blogTag.findMany({
      where: { id: { in: grouped.map((g: any) => g.tagId) } },
    });
    const byId = new Map<string, any>(tags.map((tag: any) => [tag.id, tag]));

    return grouped
      .map((group: any) => {
        const tag: any = byId.get(group.tagId);
        if (!tag) return null;
        return {
          id: tag.id,
          name: tag.name,
          usageCount: group._count.tagId,
        };
      })
      .filter((item: any) => !!item);
  }

  async getStaffPicks() {
    const db = this.prisma as any;
    const picks = await db.authorBlog.findMany({
      where: { status: BLOG_STATUS.PUBLISHED },
      include: this.blogInclude(),
      orderBy: [
        { likesCount: 'desc' },
        { commentsCount: 'desc' },
        { viewsCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 4,
    });

    return picks.map((item: any) => this.mapBlog(item));
  }

  private async notifyFollowersOnPublish(
    author: { id: string; name: string },
    blogId: string,
    title: string,
  ) {
    const followers = await this.prisma.authorFollow.findMany({
      where: { authorId: author.id },
      select: { followerId: true },
    });

    if (followers.length === 0) return;

    await Promise.all(
      followers.map((follower) =>
        this.notificationsService.createUserNotification({
          userId: follower.followerId,
          type: 'announcement',
          title: 'New post from an author you follow',
          message: `${author.name} published "${title}".`,
          link: `/blogs/${blogId}`,
        }),
      ),
    );
  }
}
