import { Database, Statement } from "sqlite";


interface TreeNode{
    id: number
    children: TreeNode[],
    label: string,
    parentId: number
}

export class TreeController{
    private db: Database
    private treeCache: Map<number, TreeNode> | null= null;
    private rootNodes: TreeNode[] = []

    constructor( db: Database ){
        this.db = db
    }

    async createTree(newNodeInfo: any): Promise<TreeNode>{
        let { parentId } = newNodeInfo;
        const { label } = newNodeInfo;

        try{
            await this.labelValidation(label)
        } catch(e){
            throw e
        }

        // Will attempt to build the tree if the current cache/rootNodes are empty
        if(!this.treeCache || this.rootNodes.length == 0 ){
            await this.buildTree()
        }

        // Validate parentId
        const parentNodeExist = parentId && parentId > 0 ? this.treeCache?.get(parentId) : false;
        if (parentId && !parentNodeExist) {
            throw new Error('404: Parent node was not found');
        }
        
        // Performs the creation of the new node in the db
        const sql = "INSERT INTO nodes (parentId, label) VALUES (?, ?)"

        const result = await this.db.run(sql, [parentId ? parentId : null, label])
        if( !result.lastID){
            throw new Error("500: Failed to create node")
        }

        // Updates treeCache and rootNodes appropriately
        const treeNode = {id: result.lastID, label: label, parentId: parentId, children: []}
        this.treeCache?.set(result.lastID, treeNode)
        if(!parentId){
            this.rootNodes.push(treeNode)
        } else {
           this.treeCache?.get(parentId)?.children.push(treeNode)
        }
        
        return treeNode
    }

    async getAllTrees(): Promise<TreeNode[]>{
        if(!this.treeCache || this.rootNodes.length == 0 ){
            return await this.buildTree()
        }

        return this.rootNodes
    }

    async getTreeById(id: number):Promise<TreeNode | undefined>{
        if(!this.treeCache || this.rootNodes.length == 0 ){
            await this.buildTree()
        }
        return this.treeCache?.get(id)
    }
   
    private async labelValidation(label: any){

        // Validate label
        if (!label || typeof label !== 'string' || label.trim().length === 0) {
            throw new Error('400: Label is required and must be a non-empty string');
        }
        if (label.length > 255) {
            throw new Error('400: Label must not exceed 255 characters');
        }

        // Check for duplicate label
        const labelCheckSql = 'SELECT id FROM nodes WHERE label = ?';
        const existingNode = await this.db.get(labelCheckSql, [label]);
        if (existingNode) {
            throw new Error('400: Label already exists');
        }
 
    }

    private async buildTree(){
        console.log('first building tree')
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
