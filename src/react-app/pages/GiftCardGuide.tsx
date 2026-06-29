import { Printer, ArrowLeft, ExternalLink, Mail, Building2, TrendingUp, Shield, Users, DollarSign } from "lucide-react";
import { Link } from "react-router";

export default function GiftCardGuide() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Print-hidden header */}
      <div className="print:hidden bg-gray-900 text-white py-4 px-6 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 text-pink-400 hover:text-pink-300">
          <ArrowLeft className="w-5 h-5" />
          Voltar para retromynd
        </Link>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Printer className="w-5 h-5" />
          Salvar como PDF
        </button>
      </div>

      {/* Document content */}
      <div className="max-w-4xl mx-auto px-8 py-12 print:px-0 print:py-0">
        {/* Cover */}
        <div className="text-center mb-16 print:mb-12">
          <div className="inline-block bg-gradient-to-r from-pink-500 to-blue-500 text-transparent bg-clip-text">
            <h1 className="text-5xl font-bold mb-4 print:text-4xl">GUIA COMPLETO</h1>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2 print:text-2xl">
            Integração de Gift Cards
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Estratégia de entrada no mercado para retromynd
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>Versão 1.0</span>
            <span>•</span>
            <span>{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="mb-16 print:mb-12 p-6 bg-gray-50 rounded-xl print:bg-transparent print:border print:border-gray-300">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Índice</h3>
          <ol className="space-y-2 text-gray-700">
            <li>1. Visão Geral do Mercado</li>
            <li>2. Cadeia de Distribuição</li>
            <li>3. Fornecedores Tier 1 (Distribuidores Autorizados)</li>
            <li>4. Fornecedores Tier 2 (Agregadores)</li>
            <li>5. Modelo de Afiliados</li>
            <li>6. Requisitos para Aprovação</li>
            <li>7. Custos e Margens</li>
            <li>8. Templates de Contato</li>
            <li>9. Roadmap Recomendado</li>
            <li>10. Checklist de Implementação</li>
          </ol>
        </div>

        {/* Section 1 */}
        <section className="mb-12 print:mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center print:bg-transparent print:border-2 print:border-pink-500">
              <TrendingUp className="w-5 h-5 text-pink-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">1. Visão Geral do Mercado</h2>
          </div>
          
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              O mercado de gift cards digitais no Brasil está em crescimento acelerado, impulsionado pela 
              expansão do gaming e pela preferência dos consumidores por métodos de pagamento seguros para 
              compras online.
            </p>
            
            <div className="grid grid-cols-2 gap-4 my-6 print:grid-cols-2">
              <div className="p-4 bg-blue-50 rounded-lg print:bg-transparent print:border print:border-blue-300">
                <div className="text-2xl font-bold text-blue-600">R$ 2.5 bi</div>
                <div className="text-sm text-gray-600">Mercado anual de gift cards gaming no BR</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg print:bg-transparent print:border print:border-green-300">
                <div className="text-2xl font-bold text-green-600">15-20%</div>
                <div className="text-sm text-gray-600">Crescimento anual do setor</div>
              </div>
            </div>

            <p>
              <strong>Principais players no Brasil:</strong> Nuuvem, Level Up, Kinguin, G2A, Eneba
            </p>
            <p>
              <strong>Oportunidade para retromynd:</strong> Diferenciação através do ecossistema integrado 
              (arcade, marketplace, comunidade) que cria fidelização além da simples transação.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-12 print:mb-10 print:break-before-page">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center print:bg-transparent print:border-2 print:border-purple-500">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">2. Cadeia de Distribuição</h2>
          </div>

          <div className="my-6 p-6 bg-gray-50 rounded-xl font-mono text-sm print:bg-transparent print:border print:border-gray-300">
            <div className="flex flex-col items-center gap-2">
              <div className="px-4 py-2 bg-purple-500 text-white rounded font-bold print:bg-transparent print:text-purple-600 print:border-2 print:border-purple-500">
                PLATAFORMA (Steam, Sony, Microsoft, Nintendo)
              </div>
              <div className="text-2xl">↓</div>
              <div className="px-4 py-2 bg-blue-500 text-white rounded font-bold print:bg-transparent print:text-blue-600 print:border-2 print:border-blue-500">
                DISTRIBUIDORES TIER 1 (Ingram, Synnex, CCV)
              </div>
              <div className="text-2xl">↓</div>
              <div className="px-4 py-2 bg-cyan-500 text-white rounded font-bold print:bg-transparent print:text-cyan-600 print:border-2 print:border-cyan-500">
                AGREGADORES TIER 2 (Gamivo, Kinguin, Eneba)
              </div>
              <div className="text-2xl">↓</div>
              <div className="px-4 py-2 bg-pink-500 text-white rounded font-bold print:bg-transparent print:text-pink-600 print:border-2 print:border-pink-500">
                RETROMYND (Varejista)
              </div>
              <div className="text-2xl">↓</div>
              <div className="px-4 py-2 bg-green-500 text-white rounded font-bold print:bg-transparent print:text-green-600 print:border-2 print:border-green-500">
                CLIENTE FINAL
              </div>
            </div>
          </div>

          <div className="space-y-3 text-gray-700">
            <p><strong>Tier 1:</strong> Maior margem (8-15%), mas exige volume alto e processo de aprovação rigoroso.</p>
            <p><strong>Tier 2:</strong> Menor margem (3-8%), mas mais acessível e sem volume mínimo.</p>
            <p><strong>Afiliados:</strong> Menor margem ainda (2-5%), mas zero risco de estoque.</p>
          </div>
        </section>

        {/* Section 3 - Tier 1 */}
        <section className="mb-12 print:mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center print:bg-transparent print:border-2 print:border-blue-500">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">3. Fornecedores Tier 1</h2>
          </div>
          <p className="text-gray-600 mb-6">Distribuidores autorizados - parceiros oficiais das plataformas</p>

          {/* Ingram Micro */}
          <div className="mb-8 p-6 border-2 border-gray-200 rounded-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-3">Ingram Micro Brasil</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Website</p>
                <a href="https://www.ingrammicro.com.br" target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 flex items-center gap-1 hover:underline print:text-black">
                  ingrammicro.com.br <ExternalLink className="w-3 h-3 print:hidden" />
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Produtos</p>
                <p className="text-gray-800">Steam, PlayStation, Xbox, Nintendo, Google Play</p>
              </div>
            </div>
            <div className="space-y-2 text-gray-700">
              <p><strong>Requisitos:</strong> CNPJ ativo, contrato comercial, volume mínimo ~R$10.000/mês</p>
              <p><strong>Como abordar:</strong> Formulário de parceria no site → aguardar contato comercial</p>
              <p><strong>Prazo de aprovação:</strong> 2-4 semanas</p>
              <p><strong>Margem típica:</strong> 10-15%</p>
            </div>
          </div>

          {/* Synnex */}
          <div className="mb-8 p-6 border-2 border-gray-200 rounded-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-3">TD Synnex Brasil</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Website</p>
                <a href="https://www.synnex.com.br" target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 flex items-center gap-1 hover:underline print:text-black">
                  synnex.com.br <ExternalLink className="w-3 h-3 print:hidden" />
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Email Comercial</p>
                <a href="mailto:vendas@synnex.com.br" className="text-blue-600 flex items-center gap-1 hover:underline print:text-black">
                  <Mail className="w-3 h-3" /> vendas@synnex.com.br
                </a>
              </div>
            </div>
            <div className="space-y-2 text-gray-700">
              <p><strong>Produtos:</strong> Similar ao Ingram - principais plataformas gaming</p>
              <p><strong>Requisitos:</strong> CNPJ, histórico comercial, volume mínimo</p>
              <p><strong>Vantagem:</strong> Atendimento mais personalizado para novos parceiros</p>
            </div>
          </div>

          {/* CCV */}
          <div className="mb-8 p-6 border-2 border-gray-200 rounded-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-3">CCV Brasil</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Website</p>
                <a href="https://www.ccv.net.br" target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 flex items-center gap-1 hover:underline print:text-black">
                  ccv.net.br <ExternalLink className="w-3 h-3 print:hidden" />
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Especialidade</p>
                <p className="text-gray-800">Gift cards de varejo e serviços</p>
              </div>
            </div>
            <div className="space-y-2 text-gray-700">
              <p><strong>Produtos:</strong> iFood, Uber, Spotify, Netflix, além de gaming</p>
              <p><strong>Vantagem:</strong> Mais acessível para pequenos negócios</p>
              <p><strong>Ideal para:</strong> Diversificar além de gaming</p>
            </div>
          </div>
        </section>

        {/* Section 4 - Tier 2 */}
        <section className="mb-12 print:mb-10 print:break-before-page">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center print:bg-transparent print:border-2 print:border-cyan-500">
              <Users className="w-5 h-5 text-cyan-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">4. Fornecedores Tier 2</h2>
          </div>
          <p className="text-gray-600 mb-6">Agregadores e marketplaces - mais fácil acesso, menor volume mínimo</p>

          {/* Gamivo */}
          <div className="mb-6 p-6 border-2 border-cyan-200 rounded-xl bg-cyan-50 print:bg-transparent">
            <h3 className="text-xl font-bold text-gray-800 mb-3">Gamivo Business ⭐ Recomendado</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Website</p>
                <a href="https://gamivo.com/business" target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 flex items-center gap-1 hover:underline print:text-black">
                  gamivo.com/business <ExternalLink className="w-3 h-3 print:hidden" />
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">API</p>
                <p className="text-green-600 font-medium">✓ Disponível</p>
              </div>
            </div>
            <div className="space-y-2 text-gray-700">
              <p><strong>Produtos:</strong> Gift cards e chaves de jogos</p>
              <p><strong>Margem:</strong> 3-8%</p>
              <p><strong>Vantagem:</strong> Sem volume mínimo, API disponível, suporte em português</p>
              <p><strong>Como começar:</strong> Cadastro direto no site, aprovação em 24-48h</p>
            </div>
          </div>

          {/* Kinguin */}
          <div className="mb-6 p-6 border-2 border-gray-200 rounded-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-3">Kinguin Business</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Website</p>
                <a href="https://www.kinguin.net/business" target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 flex items-center gap-1 hover:underline print:text-black">
                  kinguin.net/business <ExternalLink className="w-3 h-3 print:hidden" />
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">API</p>
                <p className="text-green-600 font-medium">✓ Disponível</p>
              </div>
            </div>
            <div className="space-y-2 text-gray-700">
              <p><strong>Margem:</strong> 5-10%</p>
              <p><strong>Vantagem:</strong> Grande catálogo, marca conhecida</p>
            </div>
          </div>

          {/* Eneba */}
          <div className="mb-6 p-6 border-2 border-gray-200 rounded-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-3">Eneba Business</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Website</p>
                <a href="https://www.eneba.com/business" target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 flex items-center gap-1 hover:underline print:text-black">
                  eneba.com/business <ExternalLink className="w-3 h-3 print:hidden" />
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">API</p>
                <p className="text-green-600 font-medium">✓ Disponível</p>
              </div>
            </div>
            <div className="space-y-2 text-gray-700">
              <p><strong>Vantagem:</strong> Preços competitivos, boa seleção de gift cards</p>
            </div>
          </div>

          {/* G2A */}
          <div className="mb-6 p-6 border-2 border-gray-200 rounded-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-3">G2A Goldmine</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Website</p>
                <a href="https://www.g2a.com/goldmine" target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 flex items-center gap-1 hover:underline print:text-black">
                  g2a.com/goldmine <ExternalLink className="w-3 h-3 print:hidden" />
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Modelo</p>
                <p className="text-gray-800">Afiliado/Revenda</p>
              </div>
            </div>
            <div className="space-y-2 text-gray-700">
              <p><strong>Vantagem:</strong> Mais simples de começar</p>
              <p><strong>Desvantagem:</strong> Menor controle sobre preços e estoque</p>
            </div>
          </div>
        </section>

        {/* Section 5 - Affiliates */}
        <section className="mb-12 print:mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center print:bg-transparent print:border-2 print:border-green-500">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">5. Modelo de Afiliados</h2>
          </div>
          <p className="text-gray-600 mb-6">Ideal para começar sem risco de estoque</p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border-2 border-green-200 rounded-xl bg-green-50 print:bg-transparent">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Nuuvem Afiliados</h3>
              <a href="https://www.nuuvem.com/afiliados" target="_blank" rel="noopener noreferrer" 
                 className="text-blue-600 flex items-center gap-1 hover:underline mb-3 print:text-black">
                nuuvem.com/afiliados <ExternalLink className="w-3 h-3 print:hidden" />
              </a>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Comissão: 2-5% por venda</li>
                <li>• Sem necessidade de estoque</li>
                <li>• Cliente compra direto na Nuuvem</li>
                <li>• Pagamento mensal via PayPal</li>
              </ul>
            </div>

            <div className="p-6 border-2 border-gray-200 rounded-xl">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Kinguin Affiliates</h3>
              <a href="https://www.kinguin.net/affiliates" target="_blank" rel="noopener noreferrer" 
                 className="text-blue-600 flex items-center gap-1 hover:underline mb-3 print:text-black">
                kinguin.net/affiliates <ExternalLink className="w-3 h-3 print:hidden" />
              </a>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Comissão: 3-5%</li>
                <li>• Banners e links prontos</li>
                <li>• Dashboard de analytics</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 6 - Requirements */}
        <section className="mb-12 print:mb-10 print:break-before-page">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">6. Requisitos para Aprovação</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg print:bg-transparent print:border print:border-gray-300">
              <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 print:bg-transparent print:text-pink-600 print:border-2 print:border-pink-500">1</div>
              <div>
                <h4 className="font-bold text-gray-800">CNPJ Ativo</h4>
                <p className="text-gray-600 text-sm">MEI geralmente não é aceito pelos Tier 1. Recomenda-se ME ou LTDA.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg print:bg-transparent print:border print:border-gray-300">
              <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 print:bg-transparent print:text-pink-600 print:border-2 print:border-pink-500">2</div>
              <div>
                <h4 className="font-bold text-gray-800">Site Funcionando</h4>
                <p className="text-gray-600 text-sm">Com política de privacidade, termos de uso e informações de contato.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg print:bg-transparent print:border print:border-gray-300">
              <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 print:bg-transparent print:text-pink-600 print:border-2 print:border-pink-500">3</div>
              <div>
                <h4 className="font-bold text-gray-800">Conta Bancária PJ</h4>
                <p className="text-gray-600 text-sm">Necessária para faturamento e pagamentos.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg print:bg-transparent print:border print:border-gray-300">
              <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 print:bg-transparent print:text-pink-600 print:border-2 print:border-pink-500">4</div>
              <div>
                <h4 className="font-bold text-gray-800">Histórico Comercial</h4>
                <p className="text-gray-600 text-sm">Alguns fornecedores pedem 6+ meses de operação.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg print:bg-transparent print:border print:border-gray-300">
              <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 print:bg-transparent print:text-pink-600 print:border-2 print:border-pink-500">5</div>
              <div>
                <h4 className="font-bold text-gray-800">Capital Inicial</h4>
                <p className="text-gray-600 text-sm">R$1.000 - R$10.000 para primeira compra de códigos.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7 - Margins */}
        <section className="mb-12 print:mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">7. Custos e Margens Realistas</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 print:bg-transparent">
                  <th className="border border-gray-300 px-4 py-3 text-left">Produto</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Valor Face</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Preço Compra</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Margem</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-3">Steam R$50</td>
                  <td className="border border-gray-300 px-4 py-3">R$ 50,00</td>
                  <td className="border border-gray-300 px-4 py-3">~R$ 47,00</td>
                  <td className="border border-gray-300 px-4 py-3 text-green-600 font-medium">6%</td>
                </tr>
                <tr className="bg-gray-50 print:bg-transparent">
                  <td className="border border-gray-300 px-4 py-3">PSN R$100</td>
                  <td className="border border-gray-300 px-4 py-3">R$ 100,00</td>
                  <td className="border border-gray-300 px-4 py-3">~R$ 93,00</td>
                  <td className="border border-gray-300 px-4 py-3 text-green-600 font-medium">7%</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-3">Xbox R$50</td>
                  <td className="border border-gray-300 px-4 py-3">R$ 50,00</td>
                  <td className="border border-gray-300 px-4 py-3">~R$ 46,00</td>
                  <td className="border border-gray-300 px-4 py-3 text-green-600 font-medium">8%</td>
                </tr>
                <tr className="bg-gray-50 print:bg-transparent">
                  <td className="border border-gray-300 px-4 py-3">Nintendo R$100</td>
                  <td className="border border-gray-300 px-4 py-3">R$ 100,00</td>
                  <td className="border border-gray-300 px-4 py-3">~R$ 92,00</td>
                  <td className="border border-gray-300 px-4 py-3 text-green-600 font-medium">8%</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-3">Google Play R$30</td>
                  <td className="border border-gray-300 px-4 py-3">R$ 30,00</td>
                  <td className="border border-gray-300 px-4 py-3">~R$ 28,50</td>
                  <td className="border border-gray-300 px-4 py-3 text-green-600 font-medium">5%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 print:bg-transparent">
            <p className="text-gray-700">
              <strong>Nota:</strong> Margens parecem baixas, mas em volume (100+ vendas/mês) tornam-se significativas. 
              Além disso, o ecossistema retromynd pode gerar receita adicional através de assinaturas (RetroPass), 
              marketplace e produtos customizados.
            </p>
          </div>
        </section>

        {/* Section 8 - Email Templates */}
        <section className="mb-12 print:mb-10 print:break-before-page">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">8. Templates de Contato</h2>

          <div className="mb-8 p-6 bg-gray-50 rounded-xl print:bg-transparent print:border print:border-gray-300">
            <h3 className="font-bold text-gray-800 mb-3">📧 Email para Distribuidores Tier 1</h3>
            <div className="bg-white p-4 rounded border border-gray-200 font-mono text-sm whitespace-pre-wrap">
{`Assunto: Parceria Comercial - Revenda de Gift Cards Digitais

Prezados,

Meu nome é [SEU NOME] e sou responsável pela retromynd 
(retromynd.com), uma plataforma de e-commerce focada em 
cultura geek e gaming.

Estamos interessados em estabelecer parceria para revenda 
de gift cards digitais (Steam, PlayStation, Xbox, Nintendo, 
Google Play).

DADOS DA EMPRESA:
• CNPJ: [NÚMERO]
• Razão Social: [NOME]
• Site: retromynd.com
• Estimativa de volume inicial: R$ [X.XXX]/mês
• Público-alvo: Gamers brasileiros 18-35 anos

DIFERENCIAIS DA PLATAFORMA:
• Ecossistema integrado (arcade, marketplace, comunidade)
• Base de usuários ativos e engajados
• Sistema de fidelização (RetroPass)

Gostaríamos de agendar uma reunião para discutir:
1. Condições comerciais e margem
2. Processo de integração (API ou manual)
3. Formas de pagamento e prazos
4. Suporte técnico disponível

Fico à disposição para informações adicionais.

Atenciosamente,
[SEU NOME]
[TELEFONE]
[EMAIL]`}
            </div>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl print:bg-transparent print:border print:border-gray-300">
            <h3 className="font-bold text-gray-800 mb-3">📧 Email para Tier 2 / Agregadores</h3>
            <div className="bg-white p-4 rounded border border-gray-200 font-mono text-sm whitespace-pre-wrap">
{`Assunto: Business Partnership Inquiry - retromynd

Hi,

I'm reaching out regarding a business partnership for 
gift card reselling.

ABOUT US:
• Platform: retromynd.com
• Focus: Geek culture & gaming e-commerce
• Location: Brazil
• Target: Brazilian gamers

INTERESTS:
• Gift cards: Steam, PlayStation, Xbox, Nintendo
• API integration for automated fulfillment
• Competitive wholesale pricing

We already have an active user base and are ready to 
start selling immediately upon approval.

Could you please share:
1. Requirements for business account
2. API documentation
3. Pricing/margin structure
4. Payment terms

Looking forward to your response.

Best regards,
[YOUR NAME]
retromynd.com`}
            </div>
          </div>
        </section>

        {/* Section 9 - Roadmap */}
        <section className="mb-12 print:mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">9. Roadmap Recomendado</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg print:bg-transparent print:text-green-600 print:border-2 print:border-green-500">
                  1
                </div>
              </div>
              <div className="flex-1 pb-6 border-b border-gray-200">
                <h3 className="font-bold text-lg text-gray-800">FASE 1: Validação (Mês 1-2)</h3>
                <p className="text-gray-600 mb-3">Começar como afiliado para testar demanda sem risco</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>✓ Cadastrar no programa de afiliados Nuuvem</li>
                  <li>✓ Criar seção de gift cards no retromynd (links de afiliado)</li>
                  <li>✓ Medir conversão e demanda</li>
                  <li>✓ Meta: 20-50 vendas/mês</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg print:bg-transparent print:text-blue-600 print:border-2 print:border-blue-500">
                  2
                </div>
              </div>
              <div className="flex-1 pb-6 border-b border-gray-200">
                <h3 className="font-bold text-lg text-gray-800">FASE 2: Crescimento (Mês 3-6)</h3>
                <p className="text-gray-600 mb-3">Migrar para agregador com API</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>✓ Cadastrar conta business no Gamivo ou Eneba</li>
                  <li>✓ Implementar integração via API</li>
                  <li>✓ Comprar estoque de códigos mais vendidos</li>
                  <li>✓ Meta: 50-100 vendas/mês</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-lg print:bg-transparent print:text-purple-600 print:border-2 print:border-purple-500">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">FASE 3: Escala (Mês 6+)</h3>
                <p className="text-gray-600 mb-3">Negociar direto com distribuidores Tier 1</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>✓ Contatar Ingram Micro / Synnex</li>
                  <li>✓ Demonstrar volume de vendas existente</li>
                  <li>✓ Negociar melhores margens</li>
                  <li>✓ Meta: R$10.000+/mês em vendas</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 10 - Checklist */}
        <section className="mb-12 print:mb-10 print:break-before-page">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">10. Checklist de Implementação</h2>

          <div className="space-y-3">
            <h3 className="font-bold text-gray-800 mt-6 mb-3">📋 Preparação Legal/Empresarial</h3>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
              <span>Abrir CNPJ (ME ou LTDA recomendado)</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
              <span>Abrir conta bancária PJ</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
              <span>Consultar contador sobre tributação (Simples Nacional)</span>
            </label>

            <h3 className="font-bold text-gray-800 mt-6 mb-3">🌐 Preparação do Site</h3>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
              <span>Criar página de Termos de Uso</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
              <span>Criar página de Política de Privacidade</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
              <span>Adicionar informações de contato (email, telefone)</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
              <span>Configurar SSL/HTTPS (já ativo no Mocha)</span>
            </label>

            <h3 className="font-bold text-gray-800 mt-6 mb-3">🤝 Parcerias</h3>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
              <span>Cadastrar no programa de afiliados Nuuvem</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
              <span>Criar conta business no Gamivo</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
              <span>Enviar email para Ingram Micro (futuro)</span>
            </label>

            <h3 className="font-bold text-gray-800 mt-6 mb-3">💻 Implementação Técnica</h3>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
              <span>Criar seção de Gift Cards no retromynd</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
              <span>Implementar sistema de estoque de códigos</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
              <span>Configurar entrega automática por email</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
              <span>Integrar API do fornecedor (quando disponível)</span>
            </label>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm mb-2">
            Documento gerado para retromynd
          </p>
          <p className="text-gray-400 text-xs">
            {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </footer>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            margin: 1.5cm;
            size: A4;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
