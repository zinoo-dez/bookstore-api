import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
  BOOK_CATEGORIES,
  BOOK_GENRES,
  BOOK_GENRES_BY_CATEGORY,
} from '../src/books/constants/book-taxonomy';

const prisma = new PrismaClient();

const DEFAULT_CATEGORY = 'Reference';

const uniqueNormalized = (values: string[] | null | undefined) =>
  Array.from(new Set((values ?? []).map((value) => value.trim()).filter(Boolean)));

const categorySet = new Set<string>(BOOK_CATEGORIES);
const genreSet = new Set<string>(BOOK_GENRES);

const genreToCategories = new Map<string, string[]>();
for (const [category, genres] of Object.entries(BOOK_GENRES_BY_CATEGORY)) {
  for (const genre of genres) {
    const existing = genreToCategories.get(genre) ?? [];
    genreToCategories.set(genre, Array.from(new Set([...existing, category])));
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log(
    `📚 Normalizing book taxonomy (${dryRun ? 'DRY RUN' : 'WRITE MODE'})...`,
  );

  const books = await prisma.book.findMany({
    select: {
      id: true,
      title: true,
      categories: true,
      genres: true,
    },
  });

  let changed = 0;
  let repairedFromMixed = 0;
  let inferredCategories = 0;

  for (const book of books) {
    const originalCategories = uniqueNormalized(book.categories);
    const originalGenres = uniqueNormalized(book.genres);

    const genresFoundInCategories = originalCategories.filter((item) =>
      genreSet.has(item),
    );
    const cleanedCategories = originalCategories.filter((item) =>
      categorySet.has(item),
    );

    const provisionalGenres = Array.from(
      new Set([
        ...originalGenres.filter((item) => genreSet.has(item)),
        ...genresFoundInCategories,
      ]),
    );

    let nextCategories = [...cleanedCategories];
    if (genresFoundInCategories.length > 0) {
      repairedFromMixed++;
    }

    if (nextCategories.length === 0 && provisionalGenres.length > 0) {
      nextCategories = Array.from(
        new Set(
          provisionalGenres.flatMap((genre) => genreToCategories.get(genre) ?? []),
        ),
      ).sort((a, b) => a.localeCompare(b));
      if (nextCategories.length > 0) {
        inferredCategories++;
      }
    }

    if (nextCategories.length === 0) {
      nextCategories = [DEFAULT_CATEGORY];
    }

    const allowedGenresForCategories = new Set(
      nextCategories.flatMap(
        (category) =>
          BOOK_GENRES_BY_CATEGORY[category as keyof typeof BOOK_GENRES_BY_CATEGORY] ??
          [],
      ),
    );
    const nextGenres = provisionalGenres.filter((genre) =>
      allowedGenresForCategories.has(genre),
    );

    const categoriesChanged =
      JSON.stringify(originalCategories) !== JSON.stringify(nextCategories);
    const genresChanged = JSON.stringify(originalGenres) !== JSON.stringify(nextGenres);

    if (!categoriesChanged && !genresChanged) {
      continue;
    }

    changed++;
    console.log(`- ${book.title} (${book.id})`);
    console.log(`  categories: [${originalCategories.join(', ')}] -> [${nextCategories.join(', ')}]`);
    console.log(`  genres: [${originalGenres.join(', ')}] -> [${nextGenres.join(', ')}]`);

    if (!dryRun) {
      await prisma.book.update({
        where: { id: book.id },
        data: {
          categories: nextCategories,
          genres: nextGenres,
        },
      });
    }
  }

  console.log('\n✅ Book taxonomy normalization complete.');
  console.log(`Books scanned: ${books.length}`);
  console.log(`Books changed: ${changed}`);
  console.log(`Mixed category/genre repaired: ${repairedFromMixed}`);
  console.log(`Categories inferred from genre: ${inferredCategories}`);
  console.log(`Mode: ${dryRun ? 'dry-run (no writes)' : 'write mode'}`);
}

main()
  .catch((error) => {
    console.error('❌ Failed to normalize book taxonomy:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
