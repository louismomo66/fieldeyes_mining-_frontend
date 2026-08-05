#!/usr/bin/env node
/**
 * List the users registered on a deployed FieldEyes instance.
 *
 *   node scripts/list-users.mjs https://your-app-domain
 *
 * Logs in with an admin account, calls GET /api/v1/admin/users, prints a
 * summary and writes users.csv next to wherever you run it.
 *
 * Credentials are prompted for and never written to disk, never echoed, and
 * never stored in shell history. Nothing is sent anywhere except the base URL
 * you pass in.
 */

import { createInterface } from "node:readline"
import { stdin, stdout, argv, exit } from "node:process"
import { writeFileSync } from "node:fs"

const baseUrl = (argv[2] || "").replace(/\/+$/, "")
if (!baseUrl) {
  console.error("Usage: node scripts/list-users.mjs https://your-app-domain")
  exit(1)
}

const rl = createInterface({ input: stdin, output: stdout })
const ask = (q) => new Promise((res) => rl.question(q, res))

// Read a line without echoing it back to the terminal.
const askSecret = (q) =>
  new Promise((res) => {
    const onData = (char) => {
      if (["\n", "\r", ""].includes(char.toString())) {
        stdin.removeListener("data", onData)
        return
      }
      stdout.write("\x1b[2K\x1b[200D" + q + "*".repeat(rl.line.length))
    }
    stdin.on("data", onData)
    rl.question(q, (value) => {
      stdout.write("\n")
      res(value)
    })
  })

const api = async (path, options = {}, token) => {
  const res = await fetch(`${baseUrl}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body?.success === false) {
    throw new Error(body?.error || body?.message || `${res.status} ${res.statusText}`)
  }
  return body
}

const csvCell = (v) => {
  const s = v == null ? "" : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

try {
  // The API authenticates by email address, not by a username.
  const email = await ask("Admin email: ")
  const password = await askSecret("Password: ")
  rl.close()

  const login = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), password }),
  })

  const token = login?.data?.token
  if (!token) throw new Error("Login succeeded but no token was returned")
  if (login?.data?.user?.role !== "admin") {
    throw new Error(`That account's role is "${login?.data?.user?.role}" — /admin/users needs an admin`)
  }

  const result = await api("/admin/users", {}, token)
  const users = Array.isArray(result?.data) ? result.data : []

  console.log(`\n${users.length} user${users.length === 1 ? "" : "s"}\n`)

  // Breakdown by role, which is usually the thing you actually wanted.
  const tally = (key) =>
    users.reduce((acc, u) => {
      const k = u?.[key] || "(not set)"
      acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})

  console.log("By account role:")
  for (const [k, n] of Object.entries(tally("role")).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${k}`)
  }
  console.log("\nBy supply-chain role:")
  for (const [k, n] of Object.entries(tally("chain_role")).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${k}`)
  }

  const columns = ["id", "name", "email", "phone", "role", "chain_role", "location", "created_at"]
  const csv = [
    columns.join(","),
    ...users.map((u) => columns.map((c) => csvCell(u?.[c])).join(",")),
  ].join("\n")

  writeFileSync("users.csv", csv)
  console.log(`\nWritten to users.csv (${columns.length} columns).`)
  console.log("It contains personal data — delete it when you are done with it.")
} catch (err) {
  console.error(`\nFailed: ${err.message}`)
  exit(1)
}
