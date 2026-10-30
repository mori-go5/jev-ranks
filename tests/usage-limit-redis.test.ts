import { execFile, execFileSync, spawn, type ChildProcess } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import { promisify } from 'node:util'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { RESERVE_USAGE_SCRIPT } from '../server/utils/usage-limit'

const run = promisify(execFile)
describe.skipIf(process.env.RUN_REDIS_TESTS !== '1')('atomic Lua reservations on real Redis', () => {
  let directory: string
  let port: string
  let script: string
  let server: ChildProcess
  const keys = ['stop', 'daily', 'monthly', 'burst'].map(key => `test:{usage}:${key}`)
  const command = (...args: string[]) => execFileSync('redis-cli', ['-h', '127.0.0.1', '-p', port, '--json', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  const time = () => Number(JSON.parse(command('TIME'))[0])
  const args = (daily = 100, monthly = 2000, burst = 20) => {
    const date = new Date(time() * 1000)
    return [daily, monthly, burst,
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1) / 1000,
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1) / 1000, 900].map(String)
  }
  const reserve = (limits = args()) => JSON.parse(command('--eval', script, ...keys, ',', ...limits)) as number[]
  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), 'jev-redis-'))
    port = await new Promise<string>((resolve, reject) => {
      const probe = createServer()
      probe.on('error', reject)
      probe.listen(0, '127.0.0.1', () => {
        const address = probe.address() as { port: number }
        probe.close(() => resolve(String(address.port)))
      })
    })
    script = join(directory, 'reserve.lua')
    writeFileSync(script, RESERVE_USAGE_SCRIPT)
    server = spawn('redis-server', ['--bind', '127.0.0.1', '--port', port, '--save', '', '--appendonly', 'no'], { stdio: 'ignore' })
    for (let attempt = 0; attempt < 100; attempt++) {
      try { if (command('PING') === '"PONG"') return }
      catch { /* wait for server */ }
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    throw new Error('Local Redis did not start')
  })
  beforeEach(() => { command('FLUSHDB') })
  afterAll(() => { server?.kill(); if (directory) rmSync(directory, { recursive: true, force: true }) })

  it('allows exactly the daily cap under concurrent requests', async () => {
    const limits = args(7, 2000, 100)
    const results = await Promise.all(Array.from({ length: 40 }, async () => {
      const result = await run('redis-cli', ['-h', '127.0.0.1', '-p', port, '--json', '--eval', script, ...keys, ',', ...limits])
      return JSON.parse(result.stdout) as number[]
    }))
    expect(results.filter(result => result[0] === 1)).toHaveLength(7)
    expect(JSON.parse(command('HGET', keys[2]!, 'count'))).toBe('7')
  })
  it('enforces the monthly cap independently of daily use', () => {
    expect(reserve(args(100, 2, 100))[0]).toBe(1)
    expect(reserve(args(100, 2, 100))[0]).toBe(1)
    const result = reserve(args(100, 2, 100))
    expect(result[0]).toBe(0)
    expect(result[2]).toBe(3)
    expect(Math.abs(result[1]! - (Number(args()[4]) - time()))).toBeLessThanOrEqual(1)
    expect(JSON.parse(command('HGET', keys[1]!, 'count'))).toBe('2')
  })
  it('trips and holds the cooldown without consuming additional quota', () => {
    reserve(args(100, 2000, 2)); reserve(args(100, 2000, 2))
    expect(reserve(args(100, 2000, 2))).toEqual([0, 900, 1])
    expect(reserve()[2]).toBe(1)
    expect(JSON.parse(command('HGET', keys[1]!, 'count'))).toBe('2')
    command('DEL', keys[0]!, keys[3]!)
    expect(reserve()[0]).toBe(1)
  })
  it('honors a permanent manual stop', () => {
    command('SET', keys[0]!, 'manual')
    expect(reserve()).toEqual([0, 1, 1])
    expect(command('EXISTS', keys[1]!)).toBe('0')
    command('DEL', keys[0]!)
    expect(reserve()[0]).toBe(1)
  })
  it('resets old daily and monthly periods without retaining history', () => {
    command('HSET', keys[1]!, 'period', '-1', 'count', '999999')
    command('HSET', keys[2]!, 'period', '-1', 'count', '999999')
    expect(reserve()[0]).toBe(1)
    expect(JSON.parse(command('HGET', keys[1]!, 'count'))).toBe('1')
    expect(JSON.parse(command('HGET', keys[2]!, 'count'))).toBe('1')
    expect(command('HLEN', keys[1]!)).toBe('2')
    expect(Number(command('TTL', keys[1]!))).toBeGreaterThan(0)
    expect(Number(command('TTL', keys[2]!))).toBeGreaterThan(0)
  })
  it('rejects stale month boundaries without consuming quota', () => {
    const limits = args(); limits[4] = String(time() - 1)
    expect(reserve(limits)).toEqual([-1, 1, 0])
    expect(command('EXISTS', keys[1]!)).toBe('0')
  })
})
