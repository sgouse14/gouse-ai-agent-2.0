/**
 * Minimal strict typings for the Express APIs used by this server.
 *
 * The runtime dependency is Express 4. These declarations keep server handlers
 * type-checked while the package lock is migrated to include @types/express.
 * Keep this surface limited to APIs actually used by the Saqlain server.
 */
declare module 'express' {
  import type { Socket } from 'node:net';
  import type { Server } from 'node:http';

  export interface Request {
    body: any;
    params: Record<string, string>;
    query: Record<string, unknown>;
    originalUrl: string;
    path: string;
    method: string;
    ip?: string;
    socket: Socket;
    header(name: string): string | undefined;
    saqlainIdentity?: { uid: string; authTime: number; tokenIssuedAt: number; tokenExpiresAt: number };
    saqlainProjectId?: string;
  }

  export interface Response {
    status(code: number): this;
    json(body?: unknown): this;
    send(body?: unknown): this;
    sendFile(path: string): void;
    setHeader(name: string, value: string | number | readonly string[]): this;
  }

  export type NextFunction = (error?: unknown) => void;
  export type RequestHandler = (req: Request, res: Response, next: NextFunction) => unknown;
  export type ErrorRequestHandler = (error: unknown, req: Request, res: Response, next: NextFunction) => unknown;

  export interface Router {
    get(path: string, ...handlers: RequestHandler[]): this;
    post(path: string, ...handlers: RequestHandler[]): this;
  }

  export interface Express {
    disable(name: string): this;
    set(name: string, value: unknown): this;
    use(handler: RequestHandler): this;
    use(handler: ErrorRequestHandler): this;
    use(path: string, handler: RequestHandler): this;
    use(path: string, handler: ErrorRequestHandler): this;
    use(path: string, handler: Router): this;
    get(path: string, ...handlers: RequestHandler[]): this;
    post(path: string, ...handlers: RequestHandler[]): this;
    listen(port: number, hostname?: string, callback?: () => void): Server;
  }

  export function Router(): Router;
  export function json(options?: { limit?: string }): RequestHandler;
  export function urlencoded(options?: { extended?: boolean; limit?: string }): RequestHandler;

  const express: {
    (): Express;
    Router: typeof Router;
    json: typeof json;
    urlencoded: typeof urlencoded;
    static(path: string): RequestHandler;
  };
  export default express;
}
