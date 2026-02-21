export default function TermosPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-24 space-y-16">
            <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-black text-white">Termos de Serviço</h1>
                <p className="text-white/40">Vigência a partir de: 01 de Janeiro de 2026</p>
            </div>

            <div className="prose prose-invert prose-p:text-white/60 prose-h2:text-white prose-h2:mt-12 max-w-none">
                <h2>1. Aceite e Operação</h2>
                <p>
                    A utilização do software "Sis Davus", bem como acessar seus painéis web ou baixar os Progressive Web Apps vinculados, constitui anuência irrestrita aos Termos descritos neste documento. Ao se registrar, você declara possuir capacidade jurídica para vincular a Empresa que você representa às obrigações contratuais aqui dispostas.
                </p>

                <h2>2. Disponibilidade Garantida (SLA)</h2>
                <p>
                    Garantimos 99.9% de Uptime para planos Self-Service e 99.99% para contratos da categoria Enterprise. Caso não atinjamos esses indicadores no período vigente mensal (medido externamente com base em pings a cada 10 segundos no cluster core), os créditos equivalentes previstos no Apêndice B do Contrato serão abatidos do próximo faturamento. A rede CDN é assegurada pela Cloudflare SLA.
                </p>

                <h2>3. Uso Injustificável ("Fair Use")</h2>
                <p>
                    Para proteger a integridade dos bancos de dados em nuvem operados para a totalidade de organizações na plataforma, impomos "Rate Limits" (Limites de Requisição) nas rotas de API públicas e privadas. A raspagem automatizada (Scraping), execução de DoS voluntário usando contas provisionadas, engenharia reversa das Edge Functions, e sublocação das chaves JWT/API da plataforma a terceiros constituem quebra flagrante deste Termo, resultando no encerramento imediato do acesso.
                </p>

                <h2>4. Limitações Críticas</h2>
                <p>
                    Sob nenhuma hipótese a Delta Rise e seus mantenedores serão responsabilizados direta ou subsidiariamente por perdas operacionais, interrupções sistêmicas (lucros cessantes) decorrentes da não observância manual (por parte dos administradores de Tenant do cliente) dos parâmetros configurados nas regras de estoque; incluindo compras que falharam devido a configurações erradas nos limites de "Gatilho de Reposição ABC".
                </p>

                <h2>5. Jurisdição Legal</h2>
                <p>
                    Toda disputa a ser analisada decorrente destes Termos de Serviço deverá ser discutida obrigatoriamente sob a legislação vigente da República Federativa do Brasil e resolvida majoritariamente no Fórum de São Paulo/SP.
                </p>
            </div>
        </div>
    );
}
