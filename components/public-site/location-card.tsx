import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

type LocationCardProps = {
  name: string
  address: string
  notes?: string
  tagLabel?: string
}

export function LocationCard({ name, address, notes, tagLabel }: LocationCardProps) {
  return (
    <Card className="h-full border-border/70 bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{address}</p>
        </div>
        {tagLabel ? (
          <Badge variant="secondary" className="shrink-0 whitespace-nowrap">
            {tagLabel}
          </Badge>
        ) : null}
      </div>

      {notes ? <p className="mt-3 text-sm text-muted-foreground">{notes}</p> : null}
    </Card>
  )
}

