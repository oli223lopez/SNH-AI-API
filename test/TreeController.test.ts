import { Database } from "sqlite";
import { initDb } from "../db/index.ts";
import { TreeController } from "../controllers/treeController.ts";

describe("TreeController", () => {
  let db: Database;
  let treeController: TreeController;

  beforeEach(async () => {
    db = await initDb(":memory:");
    treeController = new TreeController(db);
  });

  afterEach(async () => {
    await db.close();
  });

  describe("createTree", () => {
    it("creates a root node successfully", async () => {
      const result = await treeController.createTree({
        label: "root",
        parentId: null,
      });
      expect(result).toEqual({
        id: 1,
        label: "root",
        parentId: null,
        children: [],
      });

      const node = await db.get("SELECT * FROM nodes WHERE id = ?", [1]);
      expect(node).toEqual({ id: 1, label: "root", parentId: null });
    });

    it("creates a child node successfully", async () => {
      await treeController.createTree({ label: "root", parentId: null });
      const result = await treeController.createTree({
        label: "child",
        parentId: 1,
      });
      expect(result).toEqual({
        id: 2,
        label: "child",
        parentId: 1,
        children: [],
      });

      const node = await db.get("SELECT * FROM nodes WHERE id = ?", [2]);
      expect(node).toEqual({ id: 2, label: "child", parentId: 1 });
    });

    it("rejects duplicate labels", async () => {
      await treeController.createTree({ label: "root", parentId: null });
      await expect(
        treeController.createTree({ label: "root", parentId: null })
      ).rejects.toThrow("Label already exists");
    });

    it("rejects invalid parentId", async () => {
      await expect(
        treeController.createTree({ label: "child", parentId: 999 })
      ).rejects.toThrow("Parent node not found");
    });

    it("rejects empty or invalid label", async () => {
      await expect(
        treeController.createTree({ label: "", parentId: null })
      ).rejects.toThrow("Label is required and must be a non-empty string");
      await expect(
        treeController.createTree({ label: "x".repeat(256), parentId: null })
      ).rejects.toThrow("Label must not exceed 255 characters");
    });

    it("prevents SQL injection", async () => {
      const maliciousLabel = "'); DROP TABLE nodes; --";
      const result = await treeController.createTree({
        label: maliciousLabel,
        parentId: null,
      });
      expect(result.label).toBe(maliciousLabel);

      const node = await db.get("SELECT * FROM nodes WHERE id = ?", [1]);
      expect(node.label).toBe(maliciousLabel);
      expect(await db.get("SELECT * FROM nodes")).toBeDefined();
    });
  });

  describe("getAllTrees", () => {
    it("returns empty array when no nodes exist", async () => {
      const trees = await treeController.getAllTrees();
      expect(trees).toEqual([]);
    });

    it("returns nested tree structure", async () => {
      await treeController.createTree({ label: "root", parentId: null });
      await treeController.createTree({ label: "child1", parentId: 1 });
      await treeController.createTree({ label: "child2", parentId: 1 });
      const trees = await treeController.getAllTrees();
      expect(trees).toEqual([
        {
          id: 1,
          label: "root",
          parentId: null,
          children: [
            { id: 2, label: "child1", parentId: 1, children: [] },
            { id: 3, label: "child2", parentId: 1, children: [] },
          ],
        },
      ]);
    });
  });

  describe("getTreeById", () => {
    it("returns undefined when node isnt present", async () => {
      await expect(await treeController.getTreeById(1)).toEqual(undefined);
    });

    it("returns single node", async () => {
      await treeController.createTree({ parentId: null, label: "first" });
      await expect(await treeController.getTreeById(1)).toEqual({
        id: 1,
        parentId: null,
        label: "first",
        children: [],
      });
    });
  });
});
