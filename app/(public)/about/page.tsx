import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

export default async function AboutPage() {
  const t = await getTranslations('marketing.about')

  const sections = [
    { title: t('origin.title'), body: t('origin.body') },
    { title: t('craft.title'), body: t('craft.body') },
    { title: t('values.title'), body: t('values.body') }
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <div className="grid items-center gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">{t('kicker')}</p>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{t('title')}</h1>
          <p className="text-lg text-muted-foreground">{t('intro')}</p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-400/15 via-background to-background shadow-lg">
          <Image
            src="/alpinefeinkostlabel.png"
            alt="Alpine Feinkost"
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-contain p-8"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {sections.map((section) => (
          <div
            key={section.title}
            className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/40 p-8">
        <h3 className="text-lg font-semibold text-foreground">{t('promise.title')}</h3>
        <p className="mt-3 text-muted-foreground leading-relaxed">{t('promise.body')}</p>
      </div>
    </div>
  )
}

