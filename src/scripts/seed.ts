import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://ertvol:wHr5XH6q8@cluster0.zcg4hf7.mongodb.net/ertis_volunteer?appName=Cluster0';

// Data from src/data/index.ts
const organizations = [
  {
    orgId: 1,
    name: 'EcoLife Pavlodar',
    direction: 'eco',
    descRu: 'Организация экологических акций, уборок и посадки деревьев в Павлодарской области.',
    descKz: 'Павлодар облысында экологиялық акциялар, тазалау және ағаш отырғызу.',
    city: 'Павлодар',
    phone: '+7 (7182) 55-11-22',
    email: 'ecolife@pavlodar.kz',
    social: { instagram: 'https://instagram.com/ecolife_pvl', facebook: 'https://facebook.com/ecolife.pvl' },
    volunteers: 120,
  },
  {
    orgId: 2,
    name: 'Жылу (Тепло)',
    direction: 'social',
    descRu: 'Помощь пожилым, одиноким людям и детям из малообеспеченных семей.',
    descKz: 'Қарт, жалғыз адамдарға және аз қамтамасыз етілген отбасылардың балаларына көмек.',
    city: 'Павлодар',
    phone: '+7 (7182) 33-44-55',
    email: 'zhylu@mail.kz',
    social: { instagram: 'https://instagram.com/zhylu_pvl', vk: 'https://vk.com/zhylu_pvl' },
    volunteers: 85,
  },
  {
    orgId: 3,
    name: 'Досым (Друг мой)',
    direction: 'animal',
    descRu: 'Волонтёры помогают приютам для животных, организуют пристройство питомцев.',
    descKz: 'Волонтерлер жануарлар баспаналарына көмектеседі, үй жануарларын орналастырады.',
    city: 'Павлодар',
    phone: '+7 (7182) 77-88-99',
    email: 'dosym@animals.kz',
    social: { instagram: 'https://instagram.com/dosym_pvl' },
    volunteers: 60,
  },
  {
    orgId: 4,
    name: 'Ertis Fest Crew',
    direction: 'event',
    descRu: 'Команда организаторов городских фестивалей, спортивных мероприятий и молодёжных акций.',
    descKz: 'Қалалық фестивальдарды, спорттық іс-шараларды және жастар акцияларын ұйымдастырушылар тобы.',
    city: 'Павлодар',
    phone: '+7 (7182) 11-22-33',
    email: 'ertisfest@kz',
    social: { instagram: 'https://instagram.com/ertisfest', telegram: 'https://t.me/ertisfest' },
    volunteers: 95,
  },
  {
    orgId: 5,
    name: 'Білім Беру (Дай знания)',
    direction: 'edu',
    descRu: 'Волонтёры-преподаватели и IT-специалисты обучают молодёжь цифровым навыкам.',
    descKz: 'Волонтер-мұғалімдер мен IT-мамандар жастарды цифрлық дағдыларға үйретеді.',
    city: 'Павлодар',
    phone: '+7 (7182) 44-55-66',
    email: 'bilim@edu.kz',
    social: { instagram: 'https://instagram.com/bilimberu_pvl', youtube: 'https://youtube.com/@bilimberu_pvl' },
    volunteers: 70,
  },
  {
    orgId: 6,
    name: 'Красный Полумесяц Казахстана',
    direction: 'crisis',
    descRu: 'Оказание гуманитарной помощи, обучение первой помощи, работа в ЧС.',
    descKz: 'Гуманитарлық көмек көрсету, алғашқы көмекке үйрету, ТЖ-да жұмыс.',
    city: 'Павлодар',
    phone: '+7 (7182) 22-33-44',
    email: 'redcrescent@kz',
    social: { instagram: 'https://instagram.com/redcrescent_kz', facebook: 'https://facebook.com/redcrescent.kz' },
    volunteers: 200,
  },
];

const events = [
  {
    eventId: 1,
    titleRu: 'Эко-акция в парке им. Гагарина',
    titleKz: 'Гагарин атындағы parkте экоакция',
    descRu: 'Генеральная уборка парка и посадка 100 деревьев. Приходите всей семьёй!',
    descKz: 'Parkты жалпы тазалау және 100 ағаш отырғызу. Бүкіл отбасымен келіңіз!',
    date: '25 мая 2025',
    location: 'Парк Гагарина, Павлодар',
    direction: 'eco',
    color: '#22c55e',
    emoji: '🌱',
  },
  {
    eventId: 2,
    titleRu: 'Тренинг по первой помощи',
    titleKz: 'Алғашқы көмек тренингі',
    descRu: 'Практический курс первой помощи для всех желающих. Сертификат участника.',
    descKz: 'Барлық тілектілер үшін практикалық алғашқы көмек курсы. Қатысушы куәлігі.',
    date: '18 июня 2025',
    location: 'ДК Металлург, Павлодар',
    direction: 'crisis',
    color: '#ef4444',
    emoji: '🏥',
  },
  {
    eventId: 3,
    titleRu: 'День помощи бездомным животным',
    titleKz: 'Үйсіз жануарларға көмек күні',
    descRu: 'Помогаем приюту: уборка, уход, фотосессии для поиска хозяев.',
    descKz: 'Баспанаға көмектесеміз: тазалау, күтім, иелерін табу үшін фотосессиялар.',
    date: '10 июля 2025',
    location: 'Приют "Добрые руки", Павлодар',
    direction: 'animal',
    color: '#f59e0b',
    emoji: '🐕',
  },
  {
    eventId: 4,
    titleRu: 'IT-фестиваль молодёжи',
    titleKz: 'Жастардың IT-фестивалі',
    descRu: 'Хакатон, мастер-классы по программированию и дизайну. Призы лучшим командам!',
    descKz: 'Хакатон, бағдарламалау мен дизайн бойынша шеберлік сабақтары. Үздік командаларға сыйлықтар!',
    date: '5 августа 2025',
    location: 'Технопарк, Павлодар',
    direction: 'edu',
    color: '#06b6d4',
    emoji: '💻',
  },
];

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected!');

  const bcrypt = require('bcryptjs');
  const UserModel = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    role: String,
  }));

  const adminEmail = 'admin@itvolunteer.kz';
  const existingAdmin = await UserModel.findOne({ email: adminEmail });
  if (!existingAdmin) {
    console.log('👤 Creating admin user...');
    const hashed = await bcrypt.hash('admin123', 10);
    await UserModel.create({
      firstName: 'Главный',
      lastName: 'Администратор',
      email: adminEmail,
      password: hashed,
      role: 'admin'
    });
    console.log('✅ Admin user created: admin@itvolunteer.kz / admin123');
  }

  // Clear existing
  const OrgModel = mongoose.models.Organization || mongoose.model('Organization', new mongoose.Schema({
    orgId: Number,
    name: String,
    direction: String,
    descRu: String,
    descKz: String,
    city: String,
    phone: String,
    email: String,
    social: mongoose.Schema.Types.Mixed,
    volunteers: Number,
  }));

  const EvtModel = mongoose.models.Event || mongoose.model('Event', new mongoose.Schema({
    eventId: Number,
    titleRu: String,
    titleKz: String,
    descRu: String,
    descKz: String,
    date: String,
    location: String,
    direction: String,
    color: String,
    emoji: String,
  }));

  console.log('🗑️  Clearing existing data...');
  await OrgModel.deleteMany({});
  await EvtModel.deleteMany({});

  console.log('📥 Inserting organizations...');
  await OrgModel.insertMany(organizations);
  console.log(`✅ ${organizations.length} organizations inserted`);

  console.log('📥 Inserting events...');
  await EvtModel.insertMany(events);
  console.log(`✅ ${events.length} events inserted`);

  await mongoose.disconnect();
  console.log('🎉 Seed complete!');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
