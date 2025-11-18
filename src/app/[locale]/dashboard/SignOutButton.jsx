'use client'

import { useLocale } from '@/contexts/LocaleContext'
import { signOut } from '@/app/auth/actions'
import { useParams } from 'next/navigation'

export default function SignOutButton() {
  const { t } = useLocale()
  const params = useParams()
  const locale = params.locale

  return (
    <form action={signOut}>
      <input type="hidden" name="locale" value={locale} />
      <button
        type="submit"
        className="rounded-full border border-solid border-black/[.08] bg-white px-5 py-2 text-sm font-medium text-black transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:bg-black dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
      >
        {t('common.signOut')}
      </button>
    </form>
  )
}

