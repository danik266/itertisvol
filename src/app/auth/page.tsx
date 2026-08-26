'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/LangContext';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { compressImage, ACCEPTED_IMAGE_TYPES } from '@/lib/image';
import {
  User, Mail, Lock, Phone, MapPin, Calendar, AlertCircle, Building2, Briefcase,
  Camera, Check, ArrowRight, ArrowLeft, Instagram, Facebook, Send, Globe,
  HeartHandshake, UserRound,
} from 'lucide-react';

type Mode = 'login' | 'register';
type Entity = 'individual' | 'legal';
type Account = 'volunteer' | 'user';

const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram', icon: <Instagram size={15} />, placeholder: 'https://instagram.com/...' },
  { key: 'telegram', label: 'Telegram', icon: <Send size={15} />, placeholder: 'https://t.me/...' },
  { key: 'whatsapp', label: 'WhatsApp', icon: <Phone size={15} />, placeholder: '+7 700 000 00 00' },
  { key: 'facebook', label: 'Facebook', icon: <Facebook size={15} />, placeholder: 'https://facebook.com/...' },
  { key: 'website', label: 'Web', icon: <Globe size={15} />, placeholder: 'https://...' },
] as const;

export default function AuthPage() {
  const { t } = useLang();
  const { register, login, error, clearError, setError } = useAuth();
  const { directions } = useData();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('register');
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [accountType, setAccountType] = useState<Account>('volunteer');
  const [entityType, setEntityType] = useState<Entity>('individual');
  const [avatar, setAvatar] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    firstName: '', lastName: '', orgName: '', activityType: '',
    dob: '', city: '', address: '', phone: '', email: '', password: '', bio: '',
  });

  const isLegal = entityType === 'legal';
  const isVolunteer = accountType === 'volunteer';
  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatar(await compressImage(file));
    } catch {
      setError(t('Не удалось обработать фото', 'Фотосуретті өңдеу мүмкін болмады'));
    }
  };

  const toggleDirection = (id: string) =>
    setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));

  const validateStep0 = () => {
    const { email, password, firstName, lastName, orgName, city, phone } = form;
    if (!email || !password) return t('Заполните email и пароль', 'Email мен құпия сөзді толтырыңыз');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('Неверный формат email', 'Email форматы қате');
    if (password.length < 6) return t('Пароль минимум 6 символов', 'Құпия сөз кемінде 6 таңба');
    if (isLegal && !orgName) return t('Укажите наименование', 'Атауын көрсетіңіз');
    if (!isLegal && (!firstName || !lastName)) return t('Укажите имя и фамилию', 'Аты-жөніңізді көрсетіңіз');
    if (isLegal && !firstName) return t('Укажите контактное лицо', 'Байланысатын тұлғаны көрсетіңіз');
    if (!city || !phone) return t('Укажите город и телефон', 'Қала мен телефонды көрсетіңіз');
    return null;
  };

  const next = () => {
    const problem = validateStep0();
    if (problem) return setError(problem);
    clearError();
    if (isVolunteer) setStep(1);
    else submit();
  };

  const submit = async () => {
    clearError();
    setSubmitting(true);
    try {
      if (mode === 'login') {
        if (await login(form.email, form.password)) router.push('/cabinet');
        return;
      }
      if (isVolunteer && !picked.length) {
        setError(t('Выберите хотя бы одно направление', 'Кемінде бір бағыт таңдаңыз'));
        return;
      }
      const ok = await register({
        ...form, accountType, entityType, avatar, socials,
        directions: isVolunteer ? picked : [],
      });
      if (ok) router.push(isVolunteer ? '/volunteers' : '/cabinet');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50 px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700">
            <span className="font-display text-xl font-bold text-white">IT</span>
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold">IT Ertis Volunteer</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('Единая платформа волонтёров Прииртышья', 'Ертіс өңірі волонтерлерінің біртұтас платформасы')}
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
            {(['register', 'login'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setStep(0); clearError(); }}
                className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
                  mode === m ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                {m === 'register' ? t('Регистрация', 'Тіркелу') : t('Войти', 'Кіру')}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <div className="space-y-4">
              <Field icon={<Mail size={16} />} name="email" type="email" placeholder="Email" value={form.email} onChange={set} />
              <Field icon={<Lock size={16} />} name="password" type="password" placeholder={t('Пароль', 'Құпия сөз')} value={form.password} onChange={set} />
            </div>
          ) : step === 0 ? (
            <div className="space-y-5">
              <div>
                <Label>{t('Тип аккаунта', 'Тіркелгі түрі')}</Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <RoleCard
                    active={isVolunteer}
                    onClick={() => setAccountType('volunteer')}
                    title={t('Волонтёр', 'Волонтер')}
                    hint={t('Попадёте в общий каталог, сможете публиковать', 'Жалпы каталогқа кіресіз, жариялай аласыз')}
                    icon={<HeartHandshake size={18} />}
                  />
                  <RoleCard
                    active={!isVolunteer}
                    onClick={() => setAccountType('user')}
                    title={t('Пользователь', 'Қолданушы')}
                    hint={t('Просто смотреть и откликаться', 'Тек қарау және жауап беру')}
                    icon={<UserRound size={18} />}
                  />
                </div>
              </div>

              <div>
                <Label>{t('Кто вы', 'Сіз кімсіз')}</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <TypeButton active={!isLegal} onClick={() => setEntityType('individual')} icon={<User size={16} />}>
                    {t('Физическое лицо', 'Жеке тұлға')}
                  </TypeButton>
                  <TypeButton active={isLegal} onClick={() => setEntityType('legal')} icon={<Building2 size={16} />}>
                    {t('Юридическое лицо', 'Заңды тұлға')}
                  </TypeButton>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="group relative cursor-pointer">
                  <input type="file" accept={ACCEPTED_IMAGE_TYPES} onChange={onPickAvatar} className="hidden" />
                  {avatar ? (
                    <img src={avatar} alt="" className="h-20 w-20 rounded-2xl object-cover ring-2 ring-teal-200" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 transition-colors group-hover:border-teal-400 group-hover:text-teal-500">
                      <Camera size={22} />
                    </div>
                  )}
                </label>
                <div className="text-sm text-slate-500">
                  {t('Фото профиля', 'Профиль фотосы')}
                  <div className="text-xs text-slate-400">{t('необязательно', 'міндетті емес')}</div>
                </div>
              </div>

              {isLegal && (
                <Field icon={<Building2 size={16} />} name="orgName" placeholder={t('Наименование организации', 'Ұйым атауы')} value={form.orgName} onChange={set} />
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field icon={<User size={16} />} name="firstName" placeholder={isLegal ? t('Контактное лицо', 'Байланыс тұлғасы') : t('Имя', 'Аты')} value={form.firstName} onChange={set} />
                <Field icon={<User size={16} />} name="lastName" placeholder={t('Фамилия', 'Тегі')} value={form.lastName} onChange={set} />
              </div>
              {isLegal ? (
                <Field icon={<Briefcase size={16} />} name="activityType" placeholder={t('Вид деятельности', 'Қызмет түрі')} value={form.activityType} onChange={set} />
              ) : (
                <Field icon={<Calendar size={16} />} name="dob" type="date" placeholder={t('Дата рождения', 'Туған күні')} value={form.dob} onChange={set} />
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field icon={<MapPin size={16} />} name="city" placeholder={t('Город', 'Қала')} value={form.city} onChange={set} />
                <Field icon={<MapPin size={16} />} name="address" placeholder={t('Адрес', 'Мекенжай')} value={form.address} onChange={set} />
              </div>
              <Field icon={<Phone size={16} />} name="phone" type="tel" placeholder={t('Телефон', 'Телефон')} value={form.phone} onChange={set} />
              <Field icon={<Mail size={16} />} name="email" type="email" placeholder="Email" value={form.email} onChange={set} />
              <Field icon={<Lock size={16} />} name="password" type="password" placeholder={t('Пароль', 'Құпия сөз')} value={form.password} onChange={set} />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <Label>{t('Направления волонтёрства', 'Волонтерлік бағыттар')}</Label>
                <p className="mt-1 text-xs text-slate-400">
                  {t('Выберите одно или несколько — это обязательно', 'Бір немесе бірнешеуін таңдаңыз — міндетті')}
                </p>
                <div className="mt-3 space-y-2">
                  {directions.map(d => {
                    const active = picked.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        onClick={() => toggleDirection(d.id)}
                        className={`w-full rounded-xl border-2 p-3 text-left transition-all ${
                          active ? 'border-transparent' : 'border-slate-200 hover:border-slate-300'
                        }`}
                        style={active ? { background: d.bg, borderColor: d.color } : undefined}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-bold" style={{ color: active ? d.color : undefined }}>
                              {t(d.labelRu, d.labelKz)}
                            </div>
                            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                              {t(d.descRu, d.descKz)}
                            </p>
                          </div>
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                              active ? 'border-transparent text-white' : 'border-slate-300'
                            }`}
                            style={active ? { background: d.color } : undefined}
                          >
                            {active && <Check size={12} />}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>{t('Социальные сети', 'Әлеуметтік желілер')}</Label>
                <div className="mt-3 space-y-2">
                  {SOCIAL_FIELDS.map(s => (
                    <div key={s.key} className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{s.icon}</span>
                      <input
                        value={socials[s.key] || ''}
                        onChange={e => setSocials(v => ({ ...v, [s.key]: e.target.value }))}
                        placeholder={s.placeholder}
                        className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-teal-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>{t('О себе', 'Өзің туралы')}</Label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={set}
                  rows={3}
                  placeholder={t('Пара слов о вас или организации', 'Өзіңіз туралы бірер сөз')}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none transition-colors focus:border-teal-400"
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {mode === 'register' && step === 1 && (
              <button
                onClick={() => { setStep(0); clearError(); }}
                className="flex items-center gap-1 rounded-full border-2 border-slate-200 px-5 py-3 text-sm font-bold text-slate-500 transition-colors hover:border-slate-300"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <button
              onClick={mode === 'register' && step === 0 ? next : submit}
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              {submitting
                ? t('Отправляем...', 'Жіберілуде...')
                : mode === 'login'
                ? t('Войти', 'Кіру')
                : step === 0
                ? isVolunteer
                  ? t('Далее', 'Келесі')
                  : t('Зарегистрироваться', 'Тіркелу')
                : t('Завершить регистрацию', 'Тіркеуді аяқтау')}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </div>

          {mode === 'register' && isVolunteer && (
            <div className="mt-4 flex justify-center gap-1.5">
              {[0, 1].map(i => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    step === i ? 'w-6 bg-teal-500' : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  active, onClick, title, hint, icon,
}: {
  active: boolean; onClick: () => void; title: string; hint: string; icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border-2 p-4 text-left transition-all ${
        active ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <span className={`inline-flex items-center gap-2 text-sm font-bold ${
        active ? 'text-teal-700' : 'text-slate-600'
      }`}>
        {icon}
        {title}
      </span>
      <span className="mt-1 block text-xs leading-relaxed text-slate-500">{hint}</span>
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{children}</span>;
}

function TypeButton({
  active, onClick, icon, children,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-all ${
        active ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Field({
  icon, name, placeholder, type = 'text', value, onChange,
}: {
  icon: React.ReactNode; name: string; placeholder: string; type?: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
      />
    </div>
  );
}
