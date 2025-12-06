'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Pencil, Loader2, UserCheck, UserX, AlertCircle } from 'lucide-react'
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
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { StatusBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AppUser, upsertUser, AppRole } from '@/lib/firestore'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'

interface UsersTableProps {
  initialData: AppUser[]
  onDataChange: () => void
}

export function UsersTable({ initialData, onDataChange }: UsersTableProps) {
  const t = useTranslations('users')
  const tActions = useTranslations('actions')
  const { user: currentUser } = useCurrentUser()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AppRole>('worker')
  const [active, setActive] = useState(true)

  const resetForm = () => {
    setDisplayName('')
    setEmail('')
    setRole('worker')
    setActive(true)
    setEditingUser(null)
    setError(null)
  }

  const openEditDialog = (user: AppUser) => {
    setEditingUser(user)
    setDisplayName(user.displayName)
    setEmail(user.email)
    setRole(user.role)
    setActive(user.active)
    setError(null)
    setIsDialogOpen(true)
  }

  // Check if this is the current user (cannot deactivate self)
  const isCurrentUser = (uid: string) => currentUser?.uid === uid

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setIsSaving(true)
    setError(null)

    try {
      // Update existing user
      await upsertUser({
        uid: editingUser.uid,
        email,
        displayName,
        role,
        locale: editingUser.locale,
        active
      })

      setIsDialogOpen(false)
      resetForm()
      onDataChange()
    } catch (err) {
      console.error('Failed to save user:', err)
      setError(err instanceof Error ? err.message : 'Failed to save user')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (user: AppUser) => {
    // Cannot deactivate self
    if (isCurrentUser(user.uid)) return

    try {
      await upsertUser({
        ...user,
        active: !user.active
      })
      onDataChange()
    } catch (err) {
      console.error('Failed to update user:', err)
    }
  }

  const getRoleBadgeClass = (role: AppRole) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
      case 'admin':
        return 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30'
      case 'worker':
        return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
      default:
        return ''
    }
  }

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case 'superadmin':
        return t('form.roleSuperadmin')
      case 'admin':
        return t('form.roleAdmin')
      case 'worker':
        return t('form.roleWorker')
      default:
        return role
    }
  }

  return (
    <div className="space-y-4">
      {/* Info Alert - No create button since users are created in Firebase Console */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('note.firebaseAuth')}
        </AlertDescription>
      </Alert>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editUser')}</DialogTitle>
            <DialogDescription>
              {isCurrentUser(editingUser?.uid || '')
                ? t('note.cannotDeactivateSelf')
                : null
              }
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">{t('form.name')}</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('form.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t('form.role')}</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">{t('form.roleSuperadmin')}</SelectItem>
                  <SelectItem value="admin">{t('form.roleAdmin')}</SelectItem>
                  <SelectItem value="worker">{t('form.roleWorker')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">{t('form.active')}</Label>
              <Switch
                id="active"
                checked={active}
                onCheckedChange={setActive}
                disabled={isCurrentUser(editingUser?.uid || '')}
              />
            </div>

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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('columns.name')}</TableHead>
                <TableHead>{t('columns.email')}</TableHead>
                <TableHead>{t('columns.role')}</TableHead>
                <TableHead>{t('columns.status')}</TableHead>
                <TableHead className="w-[150px]">{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t('noUsers')}
                  </TableCell>
                </TableRow>
              ) : (
                initialData.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {user.displayName}
                        {isCurrentUser(user.uid) && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getRoleBadgeClass(user.role)}
                      >
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.active ? 'active' : 'inactive'} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(user)}
                          disabled={isCurrentUser(user.uid)}
                          title={isCurrentUser(user.uid) ? t('note.cannotDeactivateSelf') : undefined}
                        >
                          {user.active ? (
                            <UserX className="h-4 w-4 text-destructive" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-emerald-500" />
                          )}
                        </Button>
                      </div>
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
