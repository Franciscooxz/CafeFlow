import { redirect } from 'next/navigation';

interface Props {
  params: { locale: string };
}

export default function LocaleRootPage({ params }: Props) {
  redirect(`/${params.locale}/dashboard`);
}
