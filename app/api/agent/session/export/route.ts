import { NextResponse } from 'next/server'
import { getSessionHistory } from '@/utils/sessionStore'
import { getArtifacts } from '@/utils/artifactsStore'

export const runtime = 'nodejs'

/**
 * @route GET /api/agent/session/export?sessionId=...&format=json|csv|html|markdown
 * @description Returns the session history in JSON (default), CSV, HTML, or Markdown
 */
export async function GET (request: Request) {
  try {
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId') || ''
    const format = (url.searchParams.get('format') || 'json').toLowerCase()

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    const history = getSessionHistory(sessionId)
    const artifacts = getArtifacts(sessionId)

    if (format === 'csv') {
      const header = 'timestamp,role,content\n'
      const rows = history.map(h => {
        const safeContent = (h.content || '').replace(/"/g, '""')
        return `${h.timestamp},${h.role},"${safeContent}"`
      })
      const csv = header + rows.join('\n')
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="session-${sessionId}.csv"`
        }
      })
    }

    if (format === 'html') {
      const escapeHtml = (s: string) => s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;')

      const times = [...history.map(h => h.timestamp), ...artifacts.map(a => a.timestamp)].sort()
      const startedAt = times[0] || ''
      const endedAt = times[times.length - 1] || ''
      const userCount = history.filter(h => h.role === 'user').length
      const agentCount = history.filter(h => h.role === 'agent').length

      const items = history.map(h => `
        <li class="item ${h.role}">
          <div class="meta">
            <span class="role">${h.role === 'user' ? 'You' : 'Agent'}</span>
            <span class="time">${h.timestamp}</span>
          </div>
          <div class="content">${escapeHtml(h.content || '')}</div>
        </li>
      `).join('\n')

      const artifactItems = artifacts.map(a => `
        <li class="artifact ${a.type}">
          <div class="meta"><span class="type">${a.type}</span> · <span class="time">${a.timestamp}</span></div>
          ${a.type === 'screenshot' && a.data?.image ? `<img alt="Screenshot" src="${a.data.image}" style="max-width:100%;border:1px solid #e5e7eb;border-radius:8px" />` : ''}
          ${a.type !== 'screenshot' ? `<pre style="white-space:pre-wrap;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:8px">${escapeHtml(JSON.stringify(a.data ?? {}, null, 2))}</pre>` : ''}
        </li>
      `).join('\n')

      const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Session Summary – ${sessionId}</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;line-height:1.6;margin:0;background:#f7f7f8;color:#111827}
    .wrap{max-width:880px;margin:0 auto;padding:24px}
    h1{font-size:22px;margin:0 0 8px}
    .muted{color:#6b7280}
    .card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-top:16px}
    .summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .summary div{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:8px}
    ul.timeline{list-style:none;padding:0;margin:0}
    .item{border-bottom:1px solid #f1f5f9;padding:12px 0}
    .item:last-child{border-bottom:none}
    .item .meta{font-size:12px;color:#6b7280;margin-bottom:4px;display:flex;gap:8px}
    .item.user .role{color:#2563eb}
    .item.agent .role{color:#16a34a}
    .content{white-space:pre-wrap}
    .artifacts{margin-top:16px}
    .artifact .meta{font-size:12px;color:#6b7280;margin:8px 0}
  </style>
  </head>
<body>
  <div class="wrap">
    <h1>Session Summary</h1>
    <div class="muted">Session ID: ${sessionId}</div>

    <div class="card summary">
      <div><strong>Started</strong><br/>${startedAt || '—'}</div>
      <div><strong>Ended</strong><br/>${endedAt || '—'}</div>
      <div><strong>User messages</strong><br/>${userCount}</div>
      <div><strong>Agent responses</strong><br/>${agentCount}</div>
    </div>

    <div class="card">
      <h2 style="margin:0 0 8px;font-size:18px">What happened</h2>
      <ul class="timeline">
        ${items || '<li class="item"><div class="content muted">No events recorded.</div></li>'}
      </ul>
    </div>

    <div class="card artifacts">
      <h2 style="margin:0 0 8px;font-size:18px">Artifacts</h2>
      ${artifactItems || '<div class="muted">No artifacts captured.</div>'}
    </div>

  </div>
</body>
</html>`

      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="session-${sessionId}-summary.html"`
        }
      })
    }

    if (format === 'markdown' || format === 'md') {
      const times = [...history.map(h => h.timestamp), ...artifacts.map(a => a.timestamp)].sort()
      const startedAt = times[0] || ''
      const endedAt = times[times.length - 1] || ''
      const userCount = history.filter(h => h.role === 'user').length
      const agentCount = history.filter(h => h.role === 'agent').length
      const lines = [
        `# Session Summary`,
        `Session ID: ${sessionId}`,
        '',
        `- Started: ${startedAt || '—'}`,
        `- Ended: ${endedAt || '—'}`,
        `- User messages: ${userCount}`,
        `- Agent responses: ${agentCount}`,
        '',
        `## Timeline`,
        ...history.map(h => `- ${h.timestamp} — ${h.role === 'user' ? 'You' : 'Agent'}: ${h.content?.replace(/\r?\n/g, ' ') || ''}`),
        '',
        `## Artifacts`,
        ...artifacts.map(a => `- ${a.timestamp} [${a.type}] ${a.label || ''}\n\n${'```json'}\n${JSON.stringify(a.data ?? {}, null, 2)}\n${'```'}`)
      ]
      const md = lines.join('\n')
      return new NextResponse(md, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="session-${sessionId}-summary.md"`
        }
      })
    }

    // default JSON
    return new NextResponse(JSON.stringify({ sessionId, history }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="session-${sessionId}.json"`
      }
    })
  } catch (error: any) {
    console.error('[API /session/export] Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 })
  }
}


