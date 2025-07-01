import express from "express";
import type { Request, Response } from "express";
import { TreeController } from "../controllers/treeController.ts";
import { Database } from "sqlite";
import { dbPromise } from "../db/index.ts";

const router = express.Router();
let treeController: TreeController;

async function startDB() {
  const db = await dbPromise;
  treeController = new TreeController(db);
}

Promise.all([startDB()]);

router.get("/api", async (req: Request, res: Response) => {
  res.send("SNH AI Tree API");
});

router.get("/api/trees", async (req: Request, res: Response) => {
  console.log("Getting all trees");
  const rows = await treeController.getAllTrees();
  res.status(200).send(rows);
});

router.get("/api/tree", async (req: Request, res: Response) => {
  const {id} = req.query
  console.log("Getting tree by id");
  const node = await treeController.getTreeById(JSON.parse(id as string));
  if(!node){
    res.status(404).send('Tree wasnt found with the given id')
  }
  res.status(201).json(node);
});

router.post("/api/tree", async (req: Request, res: Response) => {
  console.log("Creating new node");
  let { parentId } = req.query;
  const { label } = req.query;
  if (!parentId) {
    parentId = "null";
  }

  try {
    await treeController.createTree({
      parentId: JSON.parse(parentId as string),
      label: label,
    });
  } catch (error) {
    const stringError = error as Error
    const [errorCode, message] = stringError.message.split(':')
    res.status(JSON.parse(errorCode)).send(message)
    throw error;
  }
  res.status(201).send("Node was successfully added to the tree");
});

export default router;
