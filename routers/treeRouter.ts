import express from "express";
import type { Request, Response } from "express";
import { TreeController } from "../controllers/treeController.ts";
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
  const rows = await treeController.getAllTrees();
  res.status(200).json(rows);
});

router.get("/api/tree/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: "ID must be a positive number" });
    return;
  }
  const node = await treeController.getTreeById(id);
  if (!node) {
    res.status(404).json({ error: "Node not found" });
    return;
  }
  res.status(200).json(node);
});

router.post(
  "/api/tree",
  express.json(),
  async (req: Request, res: Response) => {
    const { label, parentId: rawParentId } = req.body;

    if (!label || typeof label !== "string" || label.trim().length === 0) {
      res.status(400).json({ error: "Label must be a non-empty string" });
      return;
    }

    let parentId: number | null = null;
    if (rawParentId !== undefined && rawParentId !== null) {
      parentId =
        typeof rawParentId === "string"
          ? parseInt(rawParentId, 10)
          : rawParentId;
      if (typeof parentId !== "number" || isNaN(parentId) || parentId <= 0) {
        res
          .status(400)
          .json({ error: "Parent ID must be a positive number or null" });
        return;
      }
    }

    try {
      const node = await treeController.createTree({ parentId, label });
      res.status(201).json({
        message: "Node was successfully added to the tree",
        createdNode: node,
      });
      return;
    } catch (error) {
      const message = (error as Error).message;
      const status = message.includes("not found") ? 404 : 400;
      res.status(status).json({ error: message });
    }
  }
);

export default router;
