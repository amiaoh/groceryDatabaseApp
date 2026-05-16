export const runtime = "nodejs"

let handler: (req: Request) => Response | Promise<Response>

try {
  const [{ handle }, { default: app }] = await Promise.all([
    import("hono/vercel"),
    import("../src/app.ts"),
  ])
  handler = handle(app)
} catch (e: unknown) {
  const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e)
  handler = () => new Response(`STARTUP ERROR:\n${msg}`, { status: 500, headers: { "Content-Type": "text/plain" } })
}

export default handler
