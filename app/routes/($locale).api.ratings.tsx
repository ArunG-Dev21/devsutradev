import { data } from 'react-router';

export async function loader({ request, context }: { request: Request; context: any }) {
  const url = new URL(request.url);
  const idsParam = url.searchParams.get('ids') || '';
  const handlesParam = url.searchParams.get('handles') || '';

  const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
  const handles = handlesParam.split(',').map((s) => s.trim()).filter(Boolean);

  if (!ids.length || ids.length !== handles.length) {
    return data({ summaries: {} });
  }

  const judgeMeToken = context.env?.JUDGEME_PRIVATE_API_TOKEN;
  const shopDomain = context.env?.PUBLIC_STORE_DOMAIN;

  if (typeof judgeMeToken !== 'string' || typeof shopDomain !== 'string') {
    return data({ summaries: {} });
  }

  try {
    const { getJudgeMeBatchSummaries } = await import('~/lib/judgeme.server');
    const products = ids.map((id, i) => ({ id, handle: handles[i] }));
    const summaryMap = await getJudgeMeBatchSummaries({
      shopDomain,
      apiToken: judgeMeToken,
      products,
    });
    const summaries: Record<string, { averageRating: number; reviewCount: number }> = {};
    for (const [id, summary] of summaryMap) {
      summaries[id] = summary;
    }
    return data({ summaries });
  } catch {
    return data({ summaries: {} });
  }
}
