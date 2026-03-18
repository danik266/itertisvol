'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/LangContext';
import { useAuth } from '@/lib/AuthContext';
import { User, Mail, Lock, Phone, MapPin, Calendar, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const { t } = useLang();
  const { register, login, error, clearError, loading: authLoading, setError } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    city: '',
    phone: '',
    email: '',
    password: '',
  });

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    setSubmitting(true);
    clearError();

    const { email, password, firstName, lastName, dob, city, phone } = form;
    
    // Frontend validation
    if (!email || !password) {
      setError(t('Заполните email и пароль', 'Email мен құпия сөзді толтырыңыз'));
      setSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('Неверный формат email', 'Email форматы қате'));
      setSubmitting(false);
      return;
    }

    if (mode === 'register') {
      if (!firstName || !lastName || !dob || !city || !phone) {
        setError(t('Заполните все поля профиля', 'Барлық профиль өрістерін толтырыңыз'));
        setSubmitting(false);
        return;
      }
      if (password.length < 6) {
        setError(t('Пароль должен содержать минимум 6 символов', 'Құпия сөз кемінде 6 таңбадан тұруы керек'));
        setSubmitting(false);
        return;
      }
    }

    try {
      if (mode === 'register') {
        const ok = await register(form);
        if (ok) router.push('/quiz');
      } else {
        const ok = await login(form.email, form.password);
        if (ok) router.push('/cabinet');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 border border-gray-100">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-gradient mx-auto flex items-center justify-center mb-3">
            <span className="text-white font-display font-bold text-xl">IT</span>
          </div>
          <h1 className="font-display text-2xl font-bold">IT Ertis Volunteer</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t('Присоединяйся к команде волонтёров', 'Волонтерлер командасына қосылыңыз')}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
          {(['register', 'login'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); clearError(); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === m ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
            >
              {m === 'register' ? t('Регистрация', 'Тіркелу') : t('Войти', 'Кіру')}
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="space-y-4">
          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <InputField icon={<User size={16} />} name="firstName" placeholder={t('Имя', 'Аты')} value={form.firstName} onChange={handle} />
                <InputField icon={<User size={16} />} name="lastName" placeholder={t('Фамилия', 'Тегі')} value={form.lastName} onChange={handle} />
              </div>
              <InputField icon={<Calendar size={16} />} name="dob" placeholder={t('Дата рождения', 'Туған күні')} type="date" value={form.dob} onChange={handle} />
              <InputField icon={<MapPin size={16} />} name="city" placeholder={t('Город', 'Қала')} value={form.city} onChange={handle} />
              <InputField icon={<Phone size={16} />} name="phone" placeholder={t('Телефон', 'Телефон')} type="tel" value={form.phone} onChange={handle} />
            </>
          )}
          <InputField icon={<Mail size={16} />} name="email" placeholder="Email" type="email" value={form.email} onChange={handle} />
          <InputField icon={<Lock size={16} />} name="password" placeholder={t('Пароль', 'Құпия сөз')} type="password" value={form.password} onChange={handle} />
        </div>

        <button
          onClick={submit}
          disabled={submitting || authLoading}
          className="w-full mt-6 btn-primary text-base py-4 text-center shadow-lg shadow-orange-200 disabled:opacity-50"
        >
          {submitting
            ? t('Загрузка...', 'Жүктелуде...')
            : mode === 'register'
            ? t('Зарегистрироваться и пройти анкету →', 'Тіркелу және анкетаны өту →')
            : t('Войти', 'Кіру')}
        </button>

        {mode === 'register' && (
          <p className="text-xs text-gray-400 text-center mt-4">
            {t(
              'После регистрации вы пройдёте анкетирование для определения направления',
              'Тіркелгеннен кейін бағытты анықтау үшін анкетадан өтесіз'
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function InputField({ icon, name, placeholder, type = 'text', value, onChange }: {
  icon: React.ReactNode;
  name: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent transition-all"
      />
    </div>
  );
}
