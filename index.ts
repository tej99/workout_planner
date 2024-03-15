import {ApolloServer} from 'apollo-server-express';
import express from 'express';
import {resolvers, typeDefs} from "./workoutSchedule";


async function startServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  const app = express();

  await server.start(); // Ensure server is started before applying middleware
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 4000;
  app.listen({ port: PORT }, () => console.log(`Server running at http://localhost:${PORT}${server.graphqlPath}`));
}

startServer();
