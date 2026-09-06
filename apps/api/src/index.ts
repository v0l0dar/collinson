import { createServer } from "node:http";
import { yoga } from "./yoga.js";

const port = Number(process.env.PORT ?? 4000);

const server = createServer(yoga);
server.listen(port, () => {
  console.log(`GraphQL API ready at http://localhost:${port}/graphql`);
});
