export class UpdateKnowledgeDto {
  name?: string;
  description?: string;
  vectorIds?: string[];
  tableData?: unknown;
  tableSchema?: unknown;
}
