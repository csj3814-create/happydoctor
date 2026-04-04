import OpenBrowserClient from './OpenBrowserClient'

type OpenBrowserPageProps = {
  searchParams: Promise<{
    next?: string
  }>
}

export default async function OpenBrowserPage({ searchParams }: OpenBrowserPageProps) {
  const resolvedSearchParams = await searchParams

  return <OpenBrowserClient nextPath={resolvedSearchParams.next} />
}
