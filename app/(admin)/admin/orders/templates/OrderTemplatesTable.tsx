'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
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
  OrderTemplate,
  createOrderTemplate,
  updateOrderTemplate,
  deleteOrderTemplate
} from '@/lib/firestore'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'

interface OrderTemplatesTableProps {
  initialData: OrderTemplate[]
  onDataChange: () => void
}

export function OrderTemplatesTable({ initialData, onDataChange }: OrderTemplatesTableProps) {
  const t = useTranslations('orderTemplates')
  const tActions = useTranslations('actions')
  const locale = useLocale()
  const router = useRouter()
  const { user } = useCurrentUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<OrderTemplate | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [note, setNote] = useState('')

  const resetForm = () => {
    setName('')
    setDescription('')
    setNote('')
    setEditingTemplate(null)
  }

  const openEditDialog = (template: OrderTemplate) => {
    setEditingTemplate(template)
    setName(template.name)
    setDescription(template.description)
    setNote(template.note)
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
        createdBy: user.uid,
        items: editingTemplate?.items || []
      }

      if (editingTemplate) {
        await updateOrderTemplate(editingTemplate.id, templateData)
      } else {
        // For new templates, redirect to create page with template data
        // Or create empty template and redirect to edit
        await createOrderTemplate(templateData)
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

  const handleDelete = async (templateId: string) => {
    if (!confirm(locale === 'de' ? 'Vorlage wirklich löschen?' : 'Really delete template?')) {
      return
    }

    setIsDeleting(templateId)
    try {
      await deleteOrderTemplate(templateId)
      onDataChange()
    } catch (error) {
      console.error('Failed to delete template:', error)
    } finally {
      setIsDeleting(null)
    }
  }

  const handleEditItems = (template: OrderTemplate) => {
    // Navigate to a dedicated edit page or open a dialog
    // For now, we'll show a message that items can be edited when creating an order from template
    router.push(`/admin/orders/create?template=${template.id}`)
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
                <Label htmlFor="name">{t('form.name')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('form.description')}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">{t('form.note')}</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {editingTemplate && (
                <div className="text-sm text-muted-foreground">
                  {editingTemplate.items.length} {locale === 'de' ? 'Produkte' : 'products'} {locale === 'de' ? 'in dieser Vorlage' : 'in this template'}
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
                <TableHead className="text-right">{t('columns.productCount')}</TableHead>
                <TableHead className="w-[150px]">{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {locale === 'de' ? 'Keine Vorlagen vorhanden' : 'No templates found'}
                  </TableCell>
                </TableRow>
              ) : (
                initialData.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {template.description || '—'}
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
                          <DropdownMenuItem
                            onClick={() => handleDelete(template.id)}
                            className="text-destructive"
                            disabled={isDeleting === template.id}
                          >
                            {isDeleting === template.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            {tActions('delete')}
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

