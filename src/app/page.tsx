'use client';
import { useRouter } from 'next/navigation';
import IntroVideo from '@/components/IntroVideo';

export default function IntroGate() {
  const router = useRouter();

  const handleComplete = () => {
    // Navigate to the main content area after the intro is done
    router.push('/main');
  };

  return (
    <main className="bg-[#1a7f84] min-h-screen flex items-center justify-center">
      <IntroVideo onComplete={handleComplete} />
    </main>
  );
}
