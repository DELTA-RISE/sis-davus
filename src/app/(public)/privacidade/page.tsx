export default function PrivacidadePage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-24 space-y-16">
            <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-black text-white">Política de Privacidade</h1>
                <p className="text-white/40">Última atualização: Outubro 23, 2026</p>
            </div>

            <div className="prose prose-invert prose-p:text-white/60 prose-h2:text-white prose-h2:mt-12 max-w-none">
                <h2>1. Quais dados processamos</h2>
                <p>
                    A Delta Rise ("Sis Davus", "nós", "nosso") atua rigorosamente como Processadora de Dados sob a LGPD (Lei Geral de Proteção de Dados - Brasil) e GDPR. Os dados inseridos no sistema, incluindo cadastros de usuários corporativos, registros de estoque, fluxos de caixas e endereços de operações são de propriedade exclusiva do Controlador (a empresa contratante). Nós apenas processamos metadados de acesso (Analytics anônimo) e logs de conexão essenciais para a garantia de segurança da infraestrutura.
                </p>

                <h2>2. Criptografia e Armazenamento</h2>
                <p>
                    Os dados em trânsito são transportados sob o protocolo TLS 1.3 obrigatório. Dados em repouso nos nossos bancos (PostgreSQL via Supabase) são criptografados através do padrão AES-256 no nível do disco de armazenamento. Nenhuma chave primária é exportada ou transferida em cleartext em qualquer circunstância.
                </p>

                <h2>3. Compartilhamento com Terceiros</h2>
                <p>
                    A Delta Rise <strong>não comercializa</strong> informações sobre usuários ou operações logísticas de nossos clientes. O compartilhamento ocorre única e exclusivamente com os Subprocessadores essenciais listados no Acordo de Processamento de Dados (DPA): Supabase (Database hospedado na AWS South America) e Cloudflare (WAF/CDN e Edge Functions).
                </p>

                <h2>4. Retenção e Deleção</h2>
                <p>
                    Ao término do contrato Enterprise ou cancelamento da assinatura Self-service, os dados do Database associado ao locatário (Tenant) permanecem na arquitetura em formato read-only por um período de segurança (grace period) de 30 dias. Findo este período, uma purga criptográfica completa (Full Cryptographic Erasure) é acionada irreversivelmente.
                </p>

                <h2>5. Dúvidas sobre Privacidade</h2>
                <p>
                    As requisições de titulares de dados e contatos oficiais com nosso DPO (Data Protection Officer) devem ser enviadas ao e-mail listado em nosso portal de conformidade SOC-2, ou diretamente para: dpo@davus.app.
                </p>
            </div>
        </div>
    );
}
