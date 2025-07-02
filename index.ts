import express from "express";
const app = express();
const port = 2323;
import {treeRouter} from "./routes/treeRouter.ts";
import { TreeController } from "./controllers/treeController.ts";
import { dbPromise } from "./db/index.ts";

const treeController = new TreeController( await dbPromise);


app.use(express.json());
app.use(treeRouter(treeController));

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
