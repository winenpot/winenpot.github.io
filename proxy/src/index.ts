/**
 * Cloudflare Worker entry: wires the real fetch, env (vars, secrets, the
 * rate-limit binding from wrangler.toml) and routes.json into handle().
 */
import { handle, type Env, type Routes } from './handler';
import routes from '../routes.json';

export default {
  fetch(req: Request, env: Env): Promise<Response> {
    return handle(req, env, routes as Routes);
  },
};
