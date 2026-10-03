import { redirect } from 'next/navigation';

export default function Home() {
  redirect(`/o/${process.env.DEFAULT_OFFICE_ID || 'demo-ward'}`);
}
