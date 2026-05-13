export default function TermosPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-16 px-4 py-24">
      <div className="space-y-6">
        <h1 className="text-4xl font-black text-foreground md:text-5xl">Termos de Serviço</h1>
        <p className="text-muted-foreground">Vigência a partir de: 01 de janeiro de 2026</p>
      </div>

      <div className="prose max-w-none prose-p:text-muted-foreground prose-h2:mt-12 prose-h2:text-foreground dark:prose-invert">
        <h2>1. Aceite e Operação</h2>
        <p>
          A utilização do software &quot;Sis Davus&quot;, bem como acessar seus painéis web ou baixar os Progressive Web Apps vinculados, constitui anuência irrestrita aos Termos descritos neste documento. Ao se registrar, você declara possuir capacidade jurídica para vincular a empresa que você representa às obrigações contratuais aqui dispostas.
        </p>

        <h2>2. Disponibilidade Garantida (SLA)</h2>
        <p>
          Garantimos 99.9% de uptime para planos self-service e 99.99% para contratos da categoria Enterprise. Caso não atinjamos esses indicadores no período vigente mensal, os créditos equivalentes previstos no Apêndice B do Contrato serão abatidos do próximo faturamento.
        </p>

        <h2>3. Uso Injustificável (&quot;Fair Use&quot;)</h2>
        <p>
          Para proteger a integridade dos bancos de dados em nuvem, impomos Rate Limits nas rotas de API públicas e privadas. A raspagem automatizada, execução de DoS voluntário, engenharia reversa das Edge Functions e sublicenciamento das chaves JWT/API da plataforma constituem quebra deste Termo.
        </p>

        <h2>4. Limitações Críticas</h2>
        <p>
          Sob nenhuma hipótese a Delta Rise e seus mantenedores serão responsabilizados por perdas operacionais decorrentes da não observância manual dos parâmetros configurados nas regras de estoque, incluindo compras que falharam devido a configurações erradas nos limites de reposição.
        </p>

        <h2>5. Jurisdição Legal</h2>
        <p>
          Toda disputa decorrente destes Termos de Serviço deverá ser discutida sob a legislação vigente da República Federativa do Brasil e resolvida no foro competente.
        </p>
      </div>
    </div>
  );
}
