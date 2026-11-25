import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    janelasDias: [7, 3, 1],
    aviso: 'Alertas auxiliares enviados para obrigações próximas do vencimento.',
  });
}
