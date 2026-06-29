import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createFileRoute } from "@tanstack/react-router";
import { createContext } from "@app-template/api/context";
import { appRouter } from "@app-template/api/routers/index";

const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

async function handle({ request }: { request: Request }) {
  const RpcContext = await createContext({ req: request });
  const rpcResult = await rpcHandler.handle(request, {
    prefix: "/api/rpc",
    context: RpcContext,
  });
  if (rpcResult.response != null) return rpcResult.response;

  const ApiContext = await createContext({ req: request });
  const apiResult = await apiHandler.handle(request, {
    prefix: "/api/rpc/api-reference",
    context: ApiContext,
  });
  if (apiResult.response != null) return apiResult.response;

  return new Response("Not found", { status: 404 });
}

export const Route = createFileRoute("/api/rpc/$")({
  server: {
    handlers: {
      HEAD: handle,
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
});
