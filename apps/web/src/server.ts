import serverEntry from "@tanstack/react-start/server-entry";
import { paraglideMiddleware } from "@/paraglide/server.js";

export default {
  async fetch(request: Request) {
    return await paraglideMiddleware(request, async () => {
      return await serverEntry.fetch(request);
    });
  },
};
