const GITHUB_TOKEN = process.env.GITHUB_TOKEN!
const GITHUB_REPO = process.env.GITHUB_REPO || 'enixlab/ENIX-WAR-ROOM'
const API = 'https://api.github.com'

const headers = () => ({
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'enix-lab-command',
  'Content-Type': 'application/json',
})

async function getFile(path: string) {
  const res = await fetch(`${API}/repos/${GITHUB_REPO}/contents/${path}`, {
    headers: headers(),
    cache: 'no-store',
  })
  if (!res.ok) {
    if (res.status === 404) return { data: null, sha: null }
    throw new Error(`GitHub GET error: ${res.status}`)
  }
  const file = await res.json()
  const data = JSON.parse(Buffer.from(file.content, 'base64').toString())
  return { data, sha: file.sha }
}

async function putFile(path: string, data: unknown, sha?: string | null) {
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64')
  const body: Record<string, string> = {
    message: `[ENIX CMD] Update ${path}`,
    content,
  }
  if (sha) body.sha = sha

  const res = await fetch(`${API}/repos/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  })

  // 409 = SHA conflict — refetch the latest SHA and retry once
  if (res.status === 409) {
    const fresh = await getFile(path)
    const retryBody: Record<string, string> = {
      message: `[ENIX CMD] Update ${path}`,
      content,
    }
    if (fresh.sha) retryBody.sha = fresh.sha
    const retry = await fetch(`${API}/repos/${GITHUB_REPO}/contents/${path}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(retryBody),
    })
    if (!retry.ok) {
      const err = await retry.text()
      throw new Error(`GitHub PUT retry error: ${retry.status} — ${err}`)
    }
    return retry.json()
  }

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GitHub PUT error: ${res.status} — ${err}`)
  }
  return res.json()
}

export async function readData<T>(filename: string): Promise<T[]> {
  const { data } = await getFile(filename)
  return data || []
}

export async function writeData<T>(filename: string, data: T[]): Promise<void> {
  const { sha } = await getFile(filename)
  await putFile(filename, data, sha)
}

export async function upsertItem<T extends { id: string }>(
  filename: string,
  item: T
): Promise<void> {
  const { data, sha } = await getFile(filename)
  const arr: T[] = data || []
  const idx = arr.findIndex((i) => i.id === item.id)
  if (idx > -1) arr[idx] = item
  else arr.push(item)
  await putFile(filename, arr, sha)
}

export async function updateItem<T extends { id: string }>(
  filename: string,
  id: string,
  updates: Partial<T>
): Promise<void> {
  const { data, sha } = await getFile(filename)
  const arr: T[] = data || []
  const idx = arr.findIndex((i) => i.id === id)
  if (idx > -1) arr[idx] = { ...arr[idx], ...updates }
  await putFile(filename, arr, sha)
}

export async function deleteItem(filename: string, id: string): Promise<void> {
  const { data, sha } = await getFile(filename)
  const arr = (data || []).filter((i: { id: string }) => i.id !== id)
  await putFile(filename, arr, sha)
}

// File constants
export const FILES = {
  LEADS: 'LEADS.json',
  ARTICLES_QUEUE: 'ARTICLES_QUEUE.json',
  CRM: 'CRM_CONTACTS.json',
  DEVIS: 'DEVIS.json',
  FACTURES: 'FACTURES.json',
  AGENDA: 'AGENDA.json',
  REJECTED_TOPICS: 'REJECTED_TOPICS.json',
}
