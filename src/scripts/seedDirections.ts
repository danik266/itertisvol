import dbConnect from '../lib/mongodb';
import Direction from '../models/Direction';
import { directions } from '../data';

async function seed() {
  await dbConnect();
  console.log('Seeding directions...');
  for (const dir of directions) {
    const existing = await Direction.findOne({ id: dir.id });
    if (!existing) {
      await Direction.create({ ...dir, _id: undefined });
      console.log('Created: ', dir.id);
    }
  }
  console.log('Directions seeded!');
  process.exit();
}
seed();
