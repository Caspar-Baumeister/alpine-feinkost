import { getLocale, getTranslations } from 'next-intl/server'
import { listProducts, listOrderTemplates, Product, OrderTemplate } from '@/lib/firestore'
import { OrderForm } from './OrderForm'

export default async function CreateOrderPage() {
  const locale = (await getLocale()) as 'de' | 'en'
  const t = await getTranslations('orders')

  const [products, templates] = await Promise.all([
    listProducts(),
    listOrderTemplates()
  ])

  return (
    <div>
      <OrderForm products={products} templates={templates} />
    </div>
  )
}

