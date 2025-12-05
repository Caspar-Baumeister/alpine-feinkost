'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, Copy, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  PacklistTemplate,
  createPacklistTemplate,
  updatePacklistTemplate
} from '@/lib/firestore'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface TemplatesTableProps {
  initialData: PacklistTemplate[]
  onDataChange: () => void
}

export function TemplatesTable({ initialData, onDataChange }: TemplatesTableProps) {
  const t = useTranslations('templates')
  const tActions = useTranslations('actions')
  const { user } = useCurrentUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PacklistTemplate | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [note, setNote] = useState('')
  const [changeAmount, setChangeAmount] = useState('')

  const resetForm = () => {
    setName('')
    setDescription('')
    setNote('')
    setChangeAmount('')
    setEditingTemplate(null)
  }

  const openEditDialog = (template: PacklistTemplate) => {
    setEditingTemplate(template)
    setName(template.name)
    setDescription(template.description)
    setNote(template.note)
    setChangeAmount(template.changeAmount?.toString() || '')
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)

    try {
      const templateData = {
        name,
        description,
        note,
        defaultPosId: null,
        changeAmount: changeAmount ? parseFloat(changeAmount) : null,
        createdBy: user.uid,
        items: editingTemplate?.items || []
      }

      if (editingTemplate) {
        await updatePacklistTemplate(editingTemplate.id, templateData)
      } else {
        await createPacklistTemplate(templateData)
      }

      setIsDialogOpen(false)
      resetForm()
      onDataChange()
    } catch (error) {
      console.error('Failed to save template:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDuplicate = async (template: PacklistTemplate) => {
    if (!user) return

    try {
      await createPacklistTemplate({
        name: `${template.name} (Kopie)`,
        description: template.description,
        note: template.note,
        defaultPosId: template.defaultPosId,
        changeAmount: template.changeAmount,
        createdBy: user.uid,
        items: template.items
      })
      onDataChange()
    } catch (error) {
      console.error('Failed to duplicate template:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              {t('createTemplate')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? t('editTemplate') : t('createTemplate')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('columns.name')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('columns.description')}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="changeAmount">Standard-Wechselgeld (€)</Label>
                <Input
                  id="changeAmount"
                  type="number"
                  step="0.01"
                  value={changeAmount}
                  onChange={(e) => setChangeAmount(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Notiz</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {editingTemplate && (
                <div className="text-sm text-muted-foreground">
                  {editingTemplate.items.length} Produkte in dieser Vorlage
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSaving}
                >
                  {tActions('cancel')}
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tActions('save')}...
                    </>
                  ) : (
                    tActions('save')
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('columns.name')}</TableHead>
                <TableHead>{t('columns.description')}</TableHead>
                <TableHead>{t('columns.lastUsed')}</TableHead>
                <TableHead className="text-right">{t('columns.productCount')}</TableHead>
                <TableHead className="w-[150px]">{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Keine Vorlagen vorhanden
                  </TableCell>
                </TableRow>
              ) : (
                initialData.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {template.description || '—'}
                    </TableCell>
                    <TableCell>
                      {template.updatedAt
                        ? format(new Date(template.updatedAt), 'dd.MM.yyyy', { locale: de })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {template.items.length}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {tActions('edit')}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(template)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            {tActions('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            {tActions('duplicate')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
