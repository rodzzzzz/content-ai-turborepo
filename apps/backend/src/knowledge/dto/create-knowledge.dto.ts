export class CreateKnowledgeDto {
  organizationId: string;
  name: string;
  description?: string;
  tableData?: unknown;
  tableSchema?: unknown;
}
