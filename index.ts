import express from "express";
const app = express();
const port = 2323;
import {treeRouter} from "./routes/treeRouter.ts";
import { TreeController } from "./controllers/treeController.ts";
import { dbPromise } from "./db/index.ts";

const treeController = new TreeController( await dbPromise);


app.use(express.json());
app.use(treeRouter(treeController));
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON format' });
  }
  next(err);
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
