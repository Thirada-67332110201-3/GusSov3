import { AUTHORS_DATA } from '@/lib/authors-data'
import { AuthorClient } from './author-client'
import { notFound } from 'next/navigation'

export function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' }
  ]
}

export default async function AuthorProfilePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const authorId = Number(id)
  const author = AUTHORS_DATA[authorId]

  if (!author) {
    notFound()
  }

  return <AuthorClient author={author} />
}
