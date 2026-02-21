import 'dotenv/config';
import { BlogPostStatus, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const buildLongContent = (
  theme: string,
  angle: string,
  checklist: string[],
) =>
  [
    `I keep seeing the same pattern in reading communities: people buy good books but fail to create a system around them. This post focuses on ${theme.toLowerCase()} and explains a practical path you can apply immediately.`,
    `Core angle: ${angle}. The goal is not to optimize for speed; it is to optimize for retention, decision quality, and long-term consistency.`,
    `A framework that works in practice:\n- ${checklist[0]}\n- ${checklist[1]}\n- ${checklist[2]}`,
    `A common mistake is treating every book the same. Technical books, narrative books, and reference books should have different reading rhythms. If you standardize one process for all, motivation drops and review quality weakens.`,
    `Operationally, I recommend a weekly checkpoint. On that checkpoint, capture what changed in your understanding, which concepts you can now apply, and where you still have confusion. This closes the loop between reading and execution.`,
    `Final note: build a repeatable workflow, then adjust slowly. You do not need a perfect system on day one. You need a sustainable one that keeps producing progress over months.`,
  ].join('\n\n');

async function ensureUser(email: string, name: string, passwordHash: string) {
  return prisma.user.upsert({
    where: { email },
    update: { name },
    create: {
      email,
      name,
      password: passwordHash,
      role: Role.USER,
    },
  });
}

async function main() {
  console.log('🌱 Starting append seed (non-destructive)...');

  const authorPassword = await bcrypt.hash('author123', 10);

  const authorUsers = await Promise.all([
    ensureUser('author.nora@example.com', 'Nora Everly', authorPassword),
    ensureUser('author.julian@example.com', 'Julian Vale', authorPassword),
    ensureUser('author.samira@example.com', 'Samira Kline', authorPassword),
    ensureUser('author.owen@example.com', 'Owen Hart', authorPassword),
  ]);

  const tagNames = [
    'Writing',
    'Productivity',
    'Reading',
    'Technology',
    'Classics',
    'Book Lists',
    'Learning Systems',
    'Notes & PKM',
    'Critical Thinking',
    'Workflows',
    'Author Life',
    'Recommendations',
  ];

  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.blogTag.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );
  const tagByName = new Map(tags.map((tag) => [tag.name, tag]));

  const books = await prisma.book.findMany({
    select: { id: true, title: true },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });
  const bookIdByTitle = new Map(books.map((book) => [book.title, book.id]));
  const postPlans: Array<{
    title: string;
    subtitle: string;
    theme: string;
    angle: string;
    readingTime: number;
    tagNames: string[];
  }> = [
    {
      title: 'How I Plan My Weekly Reading Stack',
      subtitle: 'A practical method to finish more books consistently.',
      theme: 'reading cadence',
      angle: 'mix hard, medium, and light books each week',
      readingTime: 5,
      tagNames: ['Reading', 'Productivity', 'Learning Systems'],
    },
    {
      title: '3 Signals a Book Is Worth Re-reading',
      subtitle: 'Not all five-star books deserve a second pass.',
      theme: 're-reading strategy',
      angle: 're-read only when behavior or judgment improves',
      readingTime: 4,
      tagNames: ['Reading', 'Book Lists', 'Critical Thinking'],
    },
    {
      title: 'Building a Home Library That You Actually Use',
      subtitle: 'Shelf design, category logic, and maintenance rhythm.',
      theme: 'library system design',
      angle: 'organize by usage frequency, not aesthetics',
      readingTime: 6,
      tagNames: ['Classics', 'Writing', 'Workflows'],
    },
    {
      title: 'Programmer Books That Aged Surprisingly Well',
      subtitle: 'Some titles remain useful beyond trends and frameworks.',
      theme: 'timeless technical reading',
      angle: 'prioritize principles over tool-specific tutorials',
      readingTime: 7,
      tagNames: ['Technology', 'Book Lists', 'Recommendations'],
    },
    {
      title: 'The 20-Minute Rule for Busy Readers',
      subtitle: 'Consistency beats intensity in long reading seasons.',
      theme: 'habit formation',
      angle: 'anchor short sessions to existing routines',
      readingTime: 5,
      tagNames: ['Reading', 'Productivity', 'Learning Systems'],
    },
    {
      title: 'How I Turn Book Highlights Into Action Items',
      subtitle: 'A lightweight workflow from notes to execution.',
      theme: 'knowledge application',
      angle: 'convert highlights into weekly implementation tasks',
      readingTime: 6,
      tagNames: ['Notes & PKM', 'Workflows', 'Productivity'],
    },
    {
      title: 'Choosing the Right Book for Your Current Season',
      subtitle: 'Pick books based on constraints, not hype.',
      theme: 'book selection',
      angle: 'match book depth to current energy and time budget',
      readingTime: 5,
      tagNames: ['Recommendations', 'Reading', 'Critical Thinking'],
    },
    {
      title: 'Why Most Reading Plans Fail by Week Three',
      subtitle: 'Fixing the hidden friction points early.',
      theme: 'plan durability',
      angle: 'reduce decision fatigue with pre-committed slots',
      readingTime: 6,
      tagNames: ['Productivity', 'Learning Systems', 'Workflows'],
    },
    {
      title: 'A Better Way to Read Dense Non-Fiction',
      subtitle: 'Slow, deliberate, and recall-focused.',
      theme: 'deep reading',
      angle: 'use question-led reading before each chapter',
      readingTime: 8,
      tagNames: ['Reading', 'Critical Thinking', 'Notes & PKM'],
    },
    {
      title: 'How Authors Can Build Trust Through Consistency',
      subtitle: 'Publishing rhythm and voice discipline.',
      theme: 'author growth',
      angle: 'consistency compounds audience trust over time',
      readingTime: 5,
      tagNames: ['Author Life', 'Writing', 'Workflows'],
    },
    {
      title: 'The Two-Notebook Method I Use Every Day',
      subtitle: 'One for capture, one for synthesis.',
      theme: 'note architecture',
      angle: 'separate raw capture from reviewed insights',
      readingTime: 6,
      tagNames: ['Notes & PKM', 'Productivity', 'Reading'],
    },
    {
      title: 'Reading Classics Without Getting Stuck',
      subtitle: 'Context-first methods for older texts.',
      theme: 'classic literature',
      angle: 'preview context before diving into the language',
      readingTime: 7,
      tagNames: ['Classics', 'Reading', 'Critical Thinking'],
    },
    {
      title: 'How to Evaluate a Book in 15 Minutes',
      subtitle: 'A fast quality screen before committing.',
      theme: 'book evaluation',
      angle: 'scan structure, evidence, and assumptions first',
      readingTime: 4,
      tagNames: ['Recommendations', 'Critical Thinking', 'Reading'],
    },
    {
      title: 'From Reader to Reviewer: Writing Better Reviews',
      subtitle: 'Specific, useful, and honest reviews.',
      theme: 'review craftsmanship',
      angle: 'describe outcomes, not just opinions',
      readingTime: 5,
      tagNames: ['Writing', 'Reading', 'Author Life'],
    },
    {
      title: 'What I Learned From Re-reading in Public',
      subtitle: 'Sharing notes changed how I pay attention.',
      theme: 'public learning',
      angle: 'social accountability improves reading depth',
      readingTime: 5,
      tagNames: ['Author Life', 'Notes & PKM', 'Reading'],
    },
    {
      title: 'Designing a Reading Workflow for Teams',
      subtitle: 'Turn individual reading into team leverage.',
      theme: 'team learning',
      angle: 'sync summaries into recurring team rituals',
      readingTime: 7,
      tagNames: ['Workflows', 'Learning Systems', 'Productivity'],
    },
    {
      title: 'The Difference Between Skimming and Scanning',
      subtitle: 'Use each mode intentionally.',
      theme: 'reading techniques',
      angle: 'separate objective discovery from quick triage',
      readingTime: 4,
      tagNames: ['Reading', 'Learning Systems', 'Critical Thinking'],
    },
    {
      title: 'How I Recover After a Reading Slump',
      subtitle: 'Restart protocol when momentum drops.',
      theme: 'habit recovery',
      angle: 'restart with tiny commitments and visible wins',
      readingTime: 5,
      tagNames: ['Productivity', 'Reading', 'Workflows'],
    },
    {
      title: 'Creating Better Book Lists for Different Goals',
      subtitle: 'Career, creativity, and curiosity tracks.',
      theme: 'list curation',
      angle: 'curate by desired behavior change',
      readingTime: 6,
      tagNames: ['Book Lists', 'Recommendations', 'Reading'],
    },
    {
      title: 'The 5-Question Debrief After Every Book',
      subtitle: 'A simple reflection template.',
      theme: 'post-reading reflection',
      angle: 'capture transfer, disagreement, and next experiments',
      readingTime: 5,
      tagNames: ['Notes & PKM', 'Critical Thinking', 'Reading'],
    },
    {
      title: 'Why Reading Speed Is the Wrong KPI',
      subtitle: 'Optimize for insight quality instead.',
      theme: 'reading metrics',
      angle: 'track application quality, not pages per hour',
      readingTime: 4,
      tagNames: ['Critical Thinking', 'Productivity', 'Reading'],
    },
    {
      title: 'Using Fiction to Improve Analytical Thinking',
      subtitle: 'Narrative complexity as mental training.',
      theme: 'cognitive training',
      angle: 'fiction sharpens inference and perspective taking',
      readingTime: 6,
      tagNames: ['Classics', 'Critical Thinking', 'Reading'],
    },
    {
      title: 'A Minimal Editorial Calendar for Authors',
      subtitle: 'Publish consistently without burnout.',
      theme: 'author operations',
      angle: 'lightweight planning beats over-engineered schedules',
      readingTime: 5,
      tagNames: ['Author Life', 'Writing', 'Productivity'],
    },
    {
      title: 'How I Pair Books to Learn Faster',
      subtitle: 'Read complementary titles in parallel.',
      theme: 'parallel reading',
      angle: 'pair theory books with case-study books',
      readingTime: 6,
      tagNames: ['Learning Systems', 'Book Lists', 'Reading'],
    },
    {
      title: 'When to Quit a Book (Without Guilt)',
      subtitle: 'Decision rules for leaving unhelpful books.',
      theme: 'quit criteria',
      angle: 'stop early when mismatch is clear',
      readingTime: 4,
      tagNames: ['Reading', 'Productivity', 'Critical Thinking'],
    },
    {
      title: 'How I Use Margin Notes During Re-reads',
      subtitle: 'Annotating for better retrieval later.',
      theme: 'annotation system',
      angle: 'write short prompts, not long summaries',
      readingTime: 5,
      tagNames: ['Notes & PKM', 'Reading', 'Workflows'],
    },
    {
      title: 'Building a Personal Canon Over Time',
      subtitle: 'Selecting books that define your thinking.',
      theme: 'long-term curation',
      angle: 'revisit and rank high-leverage titles annually',
      readingTime: 7,
      tagNames: ['Classics', 'Book Lists', 'Critical Thinking'],
    },
    {
      title: 'How to Read Technical Books With Better Retention',
      subtitle: 'Practice loops and concept checks.',
      theme: 'technical retention',
      angle: 'apply each chapter before moving forward',
      readingTime: 8,
      tagNames: ['Technology', 'Learning Systems', 'Notes & PKM'],
    },
    {
      title: 'From Wishlist to Reading Queue',
      subtitle: 'A practical method to prioritize backlog.',
      theme: 'queue management',
      angle: 'score books by urgency and leverage',
      readingTime: 5,
      tagNames: ['Productivity', 'Book Lists', 'Reading'],
    },
    {
      title: 'How to Build Trustworthy Book Recommendations',
      subtitle: 'Recommend based on context, not popularity.',
      theme: 'recommendation quality',
      angle: 'match recommendations to reader constraints',
      readingTime: 6,
      tagNames: ['Recommendations', 'Critical Thinking', 'Writing'],
    },
  ];

  const posts: Array<{
    authorEmail: string;
    title: string;
    subtitle: string;
    content: string;
    readingTime: number;
    tagNames: string[];
    bookTitles?: string[];
    createdAt: Date;
  }> = postPlans.map((plan, index) => {
    const primary = books[index % books.length]?.title;
    const secondary = books[(index + 9) % books.length]?.title;
    const tertiary = books[(index + 17) % books.length]?.title;
    return {
      authorEmail: authorUsers[index % authorUsers.length].email,
      title: plan.title,
      subtitle: plan.subtitle,
      content: buildLongContent(plan.theme, plan.angle, [
        `Define one concrete reading objective before starting each chapter.`,
        `Capture insight notes in your own words within 24 hours.`,
        `Schedule one implementation action before opening the next book.`,
      ]),
      readingTime: plan.readingTime,
      tagNames: plan.tagNames,
      bookTitles: [primary, secondary, tertiary].filter(
        (title): title is string => Boolean(title),
      ),
      createdAt: daysAgo(index + 2),
    };
  });

  let createdPosts = 0;
  for (const post of posts) {
    const author = authorUsers.find((user) => user.email === post.authorEmail);
    if (!author) continue;

    const existing = await prisma.authorBlog.findFirst({
      where: {
        authorId: author.id,
        title: post.title,
      },
      select: { id: true },
    });

    if (existing) continue;

    const tagIds = post.tagNames
      .map((name) => tagByName.get(name)?.id)
      .filter((id): id is string => Boolean(id));
    const refBookIds = (post.bookTitles || [])
      .map((title) => bookIdByTitle.get(title))
      .filter((id): id is string => Boolean(id));

    await prisma.authorBlog.create({
      data: {
        authorId: author.id,
        title: post.title,
        subtitle: post.subtitle,
        content: post.content,
        readingTime: post.readingTime,
        status: BlogPostStatus.PUBLISHED,
        viewsCount: 0,
        likesCount: 0,
        commentsCount: 0,
        createdAt: post.createdAt,
        updatedAt: post.createdAt,
        tags: {
          create: tagIds.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
        bookReferences: {
          create: refBookIds.map((bookId) => ({
            book: { connect: { id: bookId } },
          })),
        },
      },
    });

    createdPosts += 1;
  }

  const existingPublishedPosts = await prisma.authorBlog.findMany({
    where: { status: BlogPostStatus.PUBLISHED },
    select: { id: true, authorId: true },
    take: 120,
    orderBy: { createdAt: 'desc' },
  });

  const readers = await prisma.user.findMany({
    where: { role: Role.USER },
    select: { id: true },
    take: 20,
    orderBy: { createdAt: 'asc' },
  });

  let upsertedLikes = 0;
  let createdComments = 0;
  let createdFollows = 0;
  const commentTemplates = [
    'This breakdown is clear and practical. I can apply this this week.',
    'Great angle. The workflow section was especially useful for me.',
    'I liked the examples. Would love a follow-up with real weekly templates.',
    'Strong post. The decision rules were the most valuable part.',
    'Very actionable. I shared this with my reading group.',
  ];

  for (let index = 0; index < existingPublishedPosts.slice(0, 60).length; index += 1) {
    const post = existingPublishedPosts[index];
    const eligibleReaders = readers.filter((reader) => reader.id !== post.authorId);
    if (eligibleReaders.length === 0) {
      continue;
    }

    const likeTargets = [
      eligibleReaders[index % eligibleReaders.length],
      eligibleReaders[(index + 3) % eligibleReaders.length],
      eligibleReaders[(index + 7) % eligibleReaders.length],
    ];

    for (const liker of likeTargets) {
      await prisma.blogLike.upsert({
        where: { postId_userId: { postId: post.id, userId: liker.id } },
        update: {},
        create: { postId: post.id, userId: liker.id },
      });
      upsertedLikes += 1;
    }

    const commentTargets = [
      eligibleReaders[(index + 1) % eligibleReaders.length],
      eligibleReaders[(index + 5) % eligibleReaders.length],
    ];
    for (let cIndex = 0; cIndex < commentTargets.length; cIndex += 1) {
      const commenter = commentTargets[cIndex];
      const message =
        commentTemplates[(index + cIndex) % commentTemplates.length];
      const existingComment = await prisma.blogComment.findFirst({
        where: {
          blogId: post.id,
          userId: commenter.id,
          content: message,
        },
        select: { id: true },
      });

      if (!existingComment) {
        await prisma.blogComment.create({
          data: {
            blogId: post.id,
            userId: commenter.id,
            content: message,
          },
        });
        createdComments += 1;
      }
    }

    const followTargets = [
      eligibleReaders[(index + 2) % eligibleReaders.length],
      eligibleReaders[(index + 9) % eligibleReaders.length],
    ];
    for (const follower of followTargets) {
      await prisma.authorFollow.upsert({
        where: { followerId_authorId: { followerId: follower.id, authorId: post.authorId } },
        update: {},
        create: { followerId: follower.id, authorId: post.authorId },
      });
      createdFollows += 1;
    }
  }

  for (const post of existingPublishedPosts) {
    const [likesCount, commentsCount] = await Promise.all([
      prisma.blogLike.count({ where: { postId: post.id } }),
      prisma.blogComment.count({ where: { blogId: post.id } }),
    ]);
    await prisma.authorBlog.update({
      where: { id: post.id },
      data: { likesCount, commentsCount },
    });
  }

  console.log('✅ Append seed completed.');
  console.log(`   - Total post blueprints: ${postPlans.length}`);
  console.log(`   - Posts created: ${createdPosts}`);
  console.log(`   - Likes upserted: ${upsertedLikes}`);
  console.log(`   - Comments created: ${createdComments}`);
  console.log(`   - Follows upserted: ${createdFollows}`);
  console.log('🔑 Author login (default password):');
  console.log('   author.nora@example.com / author123');
  console.log('   author.julian@example.com / author123');
  console.log('   author.samira@example.com / author123');
  console.log('   author.owen@example.com / author123');
}

main()
  .catch((error) => {
    console.error('❌ Append seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
