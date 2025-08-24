import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createPersonInputSchema, 
  updatePersonInputSchema,
  getPersonInputSchema,
  createRelationshipInputSchema,
  deleteRelationshipInputSchema
} from './schema';

// Import handlers
import { createPerson } from './handlers/create_person';
import { getPeople } from './handlers/get_people';
import { getPerson } from './handlers/get_person';
import { updatePerson } from './handlers/update_person';
import { deletePerson } from './handlers/delete_person';
import { createRelationship } from './handlers/create_relationship';
import { deleteRelationship } from './handlers/delete_relationship';
import { getFamilyTree } from './handlers/get_family_tree';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Person management endpoints
  createPerson: publicProcedure
    .input(createPersonInputSchema)
    .mutation(({ input }) => createPerson(input)),

  getPeople: publicProcedure
    .query(() => getPeople()),

  getPerson: publicProcedure
    .input(getPersonInputSchema)
    .query(({ input }) => getPerson(input)),

  updatePerson: publicProcedure
    .input(updatePersonInputSchema)
    .mutation(({ input }) => updatePerson(input)),

  deletePerson: publicProcedure
    .input(getPersonInputSchema)
    .mutation(({ input }) => deletePerson(input)),

  // Relationship management endpoints
  createRelationship: publicProcedure
    .input(createRelationshipInputSchema)
    .mutation(({ input }) => createRelationship(input)),

  deleteRelationship: publicProcedure
    .input(deleteRelationshipInputSchema)
    .mutation(({ input }) => deleteRelationship(input)),

  // Family tree visualization endpoint
  getFamilyTree: publicProcedure
    .query(() => getFamilyTree()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC Family Tree server listening at port: ${port}`);
}

start();