import { Database, Statement } from "sqlite";


interface TreeNode{
    id: number
    children: TreeNode[],
    label: string,
    parentId: number | null
}

interface CreateTreeInput{
    parentId: number | null,
    label: string
}

export class TreeController{
    private db: Database
    private treeCache: Map<number, TreeNode> = new Map();
    private rootNodes: TreeNode[] = []

    constructor( db: Database ){
        this.db = db
    }

    async createTree(newNodeInfo: CreateTreeInput): Promise<TreeNode> {
        const { parentId, label } = newNodeInfo;

        await this.labelValidation(label);

        if (parentId !== null && (typeof parentId !== 'number' || isNaN(parentId) || parentId <= 0)) {
            throw new Error('Parent ID must be a positive number or null');
        }

        if (!this.treeCache.size) {
            await this.buildTree();
        }

        const parentNodeExist = parentId ? this.treeCache.get(parentId) : false;
        if (parentId && !parentNodeExist) {
            throw new Error('Parent node not found');
        }

        let result;
        try {
            const sql = 'INSERT INTO nodes (parentId, label) VALUES (?, ?)';
            result = await this.db.run(sql, [parentId, label]);
            if (!result.lastID) {
            throw new Error('Failed to create node: No ID returned');
            }
        } catch (error) {
            throw new Error(`Failed to create node: ${(error as Error).message}`);
        }

        const treeNode: TreeNode = { id: result.lastID, label, parentId, children: [] };
        this.treeCache.set(result.lastID, treeNode);
        if (!parentId) {
            this.rootNodes.push(treeNode);
        } else {
            this.treeCache.get(parentId)!.children.push(treeNode);
        }

        return treeNode;
    }

    async getAllTrees(): Promise<TreeNode[]>{
        if(!this.treeCache.size){
            return await this.buildTree()
        }
        return this.rootNodes
    }

    async getTreeById(id: number):Promise<TreeNode | undefined>{
        if(!this.treeCache.size){
            await this.buildTree()
        }
        return this.treeCache.get(id)
    }

    private async labelValidation(label: any){
        // Validate label
        if (!label || typeof label !== 'string' || label.trim().length === 0) {
            throw new Error('Label is required and must be a non-empty string');
        }
        if (label.length > 255) {
            throw new Error('Label must not exceed 255 characters');
        }

        // Check for duplicate label
        const labelCheckSql = 'SELECT id FROM nodes WHERE label = ?';
        const existingNode = await this.db.get(labelCheckSql, [label]);
        if (existingNode) {
            throw new Error('Label already exists');
        }
 
    }

    private async buildTree():Promise<TreeNode[]>{
        const sql = "SELECT * FROM nodes ORDER BY parentId asc";
        const rows = await this.db.all(sql);
        this.treeCache = new Map<number, TreeNode>()

        for(const row of rows){
            const node: TreeNode = {id: row.id, label: row.label, parentId: row.parentId, children: []}
            this.treeCache.set(row.id, node)
            if(!row.parentId){
                this.rootNodes.push(node)
            }
        }

        for(const node of this.treeCache.values()){
            if(!node.parentId){
                continue;
            }
            const parent = this.treeCache.get(node.parentId)
            if(parent){
                parent.children.push(node)
            }
        }

        return this.rootNodes

    }

}
