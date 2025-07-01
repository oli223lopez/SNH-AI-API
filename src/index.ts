import express from "express";
const app = express();
const port = 2323;
import router from "./routers/treeRouter.ts";

app.use(express.json());
app.use(router);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
