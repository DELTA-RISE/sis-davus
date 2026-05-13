export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-16 px-4 py-24">
      <div className="space-y-6">
        <h1 className="text-4xl font-black text-foreground md:text-5xl">Política de Privacidade</h1>
        <p className="text-muted-foreground">Última atualização: 23 de outubro de 2026</p>
      </div>

      <div className="prose max-w-none prose-p:text-muted-foreground prose-h2:mt-12 prose-h2:text-foreground dark:prose-invert">
        <h2>1. Quais dados processamos</h2>
        <p>
          A Delta Rise (&quot;Sis Davus&quot;, &quot;nós&quot;, &quot;nosso&quot;) atua como processadora de dados sob a LGPD e GDPR. Os dados inseridos no sistema, incluindo cadastros de usuários corporativos, registros de estoque, fluxos de caixas e endereços de operações, são de propriedade exclusiva da empresa contratante.
        </p>

        <h2>2. Criptografia e Armazenamento</h2>
        <p>
          Os dados em trânsito são transportados sob TLS 1.3. Dados em repouso nos bancos PostgreSQL via Supabase são criptografados em nível de armazenamento. Nenhuma chave primária é exportada ou transferida em cleartext.
        </p>

        <h2>3. Compartilhamento com Terceiros</h2>
        <p>
          A Delta Rise <strong>não comercializa</strong> informações sobre usuários ou operações logísticas de nossos clientes. O compartilhamento ocorre exclusivamente com subprocessadores essenciais para a operação da plataforma.
        </p>

        <h2>4. Retenção e Deleção</h2>
        <p>
          Ao término do contrato Enterprise ou cancelamento da assinatura self-service, os dados associados ao locatário permanecem em formato read-only por um período de segurança de 30 dias. Findo este período, uma purga criptográfica completa é acionada.
        </p>

        <h2>5. Dúvidas sobre Privacidade</h2>
        <p>
          Requisições de titulares de dados e contatos oficiais com nosso DPO devem ser enviados para o canal indicado no portal de conformidade da plataforma.
        </p>
      </div>
    </div>
  );
}
