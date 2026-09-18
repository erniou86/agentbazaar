import type { Agent } from './types.js';

const agents: Agent[] = [
  { id: 'a1', name: 'Code Reviewer', description: 'PR 自动 code review，找 bug 与安全问题', price: 5, category: 'dev', rating: 4.8, downloads: 1320, createdAt: '2026-01-12T00:00:00Z' },
  { id: 'a2', name: 'Blog Writer', description: '根据关键词生成 SEO 友好的长文', price: 3, category: 'content', rating: 4.6, downloads: 980, createdAt: '2026-02-03T00:00:00Z' },
  { id: 'a3', name: 'Data Analyst', description: '上传 CSV 自动出图表与洞察报告', price: 8, category: 'data', rating: 4.9, downloads: 760, createdAt: '2026-03-21T00:00:00Z' },
  { id: 'a4', name: 'Translator Pro', description: '中英日韩高质量翻译与润色', price: 2, category: 'content', rating: 4.5, downloads: 2100, createdAt: '2026-04-11T00:00:00Z' },
  { id: 'a5', name: 'DevOps Bot', description: '生成 Dockerfile / CI 配置与部署检查', price: 6, category: 'dev', rating: 4.7, downloads: 540, createdAt: '2026-05-02T00:00:00Z' },
];

export function listAgents(q?: string, category?: string): Agent[] {
  let result = agents;
  if (q) {
    const k = q.toLowerCase();
    result = result.filter((a) => a.name.toLowerCase().includes(k) || a.description.toLowerCase().includes(k));
  }
  if (category) {
    result = result.filter((a) => a.category === category);
  }
  return result;
}

export function getAgent(id: string): Agent | undefined {
  return agents.find((a) => a.id === id);
}

export function recordDownload(id: string): void {
  const a = getAgent(id);
  if (a) a.downloads += 1;
}
