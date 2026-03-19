import dbConnect from '../lib/mongodb';
import Direction from '../models/Direction';
import { directions } from '../data';

async function seed() {
  await dbConnect();
  console.log('Seeding directions...');
  for (const dir of directions) {
    const existing = await Direction.findOne({ id: dir.id });
    if (existing) {
      await Direction.updateOne({ id: dir.id }, { $set: { ...dir, _id: undefined } });
      console.log('Updated: ', dir.id);
    } else {
      await Direction.create({ ...dir, _id: undefined });
      console.log('Created: ', dir.id);
    }
  }
  console.log('Directions seeded!');
  process.exit();
}
seed();
