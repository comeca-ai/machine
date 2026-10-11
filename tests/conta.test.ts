import { describe, it, expect } from 'vitest'
import { cookieSessao, lerCookie, mesmaOrigem, normalizarEmail, remetente, tokenAleatorio, tokenValido, hmacHex } from '../apps/runtime/src/sessao'
import { mensagemDoLink } from '../apps/runtime/src/conta'

describe('link mágico: utilitários puros', () => {
  it('token tem 256 bits em base64url e é sempre diferente', () => {
    const a = tokenAleatorio(), b = tokenAleatorio()
    expect(tokenValido(a)).toBe(true)
    expect(a).toHaveLength(43)
    expect(a).not.toBe(b)
    expect(tokenValido('curto')).toBe(false)
    expect(tokenValido(a + '=')).toBe(false)
  })

  it('normaliza e-mail e recusa lixo', () => {
    expect(normalizarEmail('  Maria.Silva+prova@Exemplo.com.BR ')).toBe('maria.silva+prova@exemplo.com.br')
    expect(normalizarEmail('sem-arroba')).toBeNull()
    expect(normalizarEmail('a@b')).toBeNull()
    expect(normalizarEmail('x <a@b.com>')).toBeNull()
    expect(normalizarEmail(42)).toBeNull()
  })

  it('cookie de sessão é HttpOnly, SameSite=Lax e Secure só em https', () => {
    const c = cookieSessao('abc', true)
    expect(c).toMatch(/HttpOnly/)
    expect(c).toMatch(/SameSite=Lax/)
    expect(c).toMatch(/Secure/)
    expect(cookieSessao('abc', false)).not.toMatch(/Secure/)
    expect(cookieSessao('', true, 0)).toMatch(/Max-Age=0/)
  })

  it('lê o cookie certo entre vários', () => {
    expect(lerCookie('a=1; sessao=xyz; b=2', 'sessao')).toBe('xyz')
    expect(lerCookie('xsessao=1', 'sessao')).toBeNull()
    expect(lerCookie(undefined, 'sessao')).toBeNull()
  })

  it('remetente aceita "Nome <email>"', () => {
    expect(remetente('Minha Marca <acesso@exemplo.com.br>')).toEqual({ name: 'Minha Marca', email: 'acesso@exemplo.com.br' })
    expect(remetente('acesso@x.com')).toBe('acesso@x.com')
  })

  it('HMAC do e-mail é estável e depende da chave', async () => {
    const a = await hmacHex('k1', 'email:a@b.com')
    expect(a).toMatch(/^[0-9a-f]{64}$/)
    expect(await hmacHex('k1', 'email:a@b.com')).toBe(a)
    expect(await hmacHex('k2', 'email:a@b.com')).not.toBe(a)
  })

  it('mesma origem: Origin igual, ou Origin "null" com Sec-Fetch-Site same-origin (formulário em aba nova)', () => {
    const ctx = (h: Record<string, string>) => ({ req: { url: 'https://exemplo.com.br/pub/x', header: (n: string) => h[n] } }) as never
    expect(mesmaOrigem(ctx({ origin: 'https://exemplo.com.br' }))).toBe(true)
    expect(mesmaOrigem(ctx({ origin: 'https://golpe.example' }))).toBe(false)
    expect(mesmaOrigem(ctx({ origin: 'https://golpe.example', 'sec-fetch-site': 'same-origin' }))).toBe(false)
    expect(mesmaOrigem(ctx({ origin: 'null', 'sec-fetch-site': 'same-origin' }))).toBe(true)
    expect(mesmaOrigem(ctx({ origin: 'null', 'sec-fetch-site': 'cross-site' }))).toBe(false)
    expect(mesmaOrigem(ctx({}))).toBe(false)
  })

  it('e-mail do link: botão, prazo, uso único, marca com destaque e tudo escapado', () => {
    const link = 'https://exemplo.com.br/entrar?p=meu-produto#t=abc'
    const m = mensagemDoLink('Minha Marca', link, 15, 'Marca')
    expect(m.assunto).toBe('Seu acesso ao Minha Marca')
    expect(m.html).toContain('Abrir meu acesso')
    expect(m.html).toContain(`href="${link}"`)
    expect(m.html).toContain('Minha <span style="color:#C52D23">Marca</span>')
    expect(m.html).toContain('15 minutos')
    expect(m.texto).toContain(link)
    expect(m.texto).toMatch(/uma vez só/)
    const x = mensagemDoLink('<b>X</b>', 'https://a.b/?q="><script>', 15)
    expect(x.html).not.toContain('<b>X</b>')
    expect(x.html).not.toContain('"><script>')
  })
})
