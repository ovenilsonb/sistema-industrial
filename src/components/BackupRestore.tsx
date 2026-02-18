import React, { useRef, useState } from 'react';
import { useStore } from '../store/useStore';

interface BackupData {
  version: string;
  backupVersion?: string;
  exportedAt: string;
  data: {
    rawMaterials: any[];
    formulas: any[];
    pricings: any[];
    companyLogo?: string;
  };
  fields: {
    rawMaterials: string[];
    formulas: string[];
    pricings: string[];
  };
}

interface FieldWarning {
  module: string;
  missingFields: string[];
  extraFields: string[];
}

interface BackupRestoreProps {
  isOpen: boolean;
  onClose: () => void;
}

import { APP_VERSION } from '@/constants/version';
export { APP_VERSION };

// Changelog de versões
export const CHANGELOG = [
  {
    version: '3.4.0',
    date: '2024-12-21',
    changes: [
      'NOVA ABA: Estoque - Gerenciamento completo de estoque de produtos acabados',
      'Dashboard de estoque com alertas de vencimento e valor total',
      'Integração automática: Ordens de produção finalizadas vão para o estoque',
      'FÁBRICA: Geração automática de Lote (4 letras do produto + sequencial)',
      'FÁBRICA: Campo de Vencimento para controle de validade',
      'Controle de movimentações de estoque (Entrada/Saída)',
      'Relatórios de estoque individual e geral',
    ],
  },
  {
    version: '3.6.0',
    date: '2024-12-21',
    changes: [
      'INTEGRAÇÃO VENDAS-FÁBRICA: Produção concluída atualiza status da venda para "Verde"',
      'Identificação visual na fábrica com tag "Pedido #XXXX"',
      'Feedback visual de status (Vermelho/Verde) em Vendas e Fábrica',
    ]
  },
  {
    version: '3.7.1',
    date: '2024-12-21',
    changes: [
      'VENDAS: Seleção de tipo de venda (Varejo, Atacado, Fardo)',
      'Preenchimento automático de preço baseado no tipo selecionado',
      'Visualização clara do tipo de venda no modal',
    ]
  },
  {
    version: '3.8.0',
    date: '2024-12-21',
    changes: [
      'CORREÇÃO DE PRECIFICAÇÃO: Cálculo exato replicando a lógica de custos e markups',
      'RELATÓRIO DE VENDAS A4: Novo layout profissional para impressão',
    ]
  },
  {
    version: '3.9.2',
    date: '2024-12-21',
    changes: [
      'ABA PROPORÇÃO: Edição inteligente de quantidades calculadas',
      'Ajuste reverso: Atualize a fórmula original baseada na proporção editada',
      'LOG DE ALTERAÇÕES: Histórico completo de mudanças nas fórmulas',
      'Melhorias visuais na edição de valores (hover, ícones)',
    ]
  },
  {
    version: '4.0.0',
    date: '2024-12-21',
    changes: [
      'DOCUMENTAÇÃO: Novo manual completo (README) de instalação e uso',
      'Versão estável para produção',
    ]
  },
  {
    version: '3.3.0',
    date: '2024-12-20',
    changes: [
      'NOVA ABA: Fábrica - Crie e gerencie ordens de produção com código sequencial (PROD/0001, PROD/0002, etc.)',
      'Campo "Lista de Insumo" adicionado no cadastro de fórmulas para identificar listas de materiais',
      'Seleção de produto, data de produção e quantidade desejada',
      'Cálculo automático de proporção baseado na quantidade escolhida',
      'Campo de quantidade com slider, botões (-) e (+), e atalhos rápidos (10, 25, 50, 100, 200, 500, 1000)',
      'Exibição da Lista de Insumo da fórmula com proporção aplicada',
      'Status da ordem: Pendente, Em Produção, Concluído, Cancelado',
      'Relatório de Ordem de Produção para impressão em A4',
      'Visualização em blocos, lista e ordem alfabética',
    ],
  },
  {
    version: '3.2.0',
    date: '2024-12-20',
    changes: [
      'Relatório de Proporção otimizado para caber em uma folha A4',
      'Ajuste automático de fontes conforme quantidade de ingredientes (8, 9 ou 10pt)',
      'Margens reduzidas para 15mm em todos os lados',
      'Colunas da tabela com larguras fixas e proporcionais',
      'Nome e variante da matéria-prima em uma única linha',
      'Espaçamentos e paddings otimizados para impressão',
    ],
  },
  {
    version: '3.1.0',
    date: '2024-12-20',
    changes: [
      'NOVA ABA: Proporção de Fórmulas - Calcule quantidades proporcionais dos ingredientes',
      'Selecione uma fórmula e defina a quantidade desejada de unidades',
      'O sistema calcula automaticamente as quantidades proporcionais de cada ingrediente',
      'Campo de quantidade com slider horizontal, botões (-) e (+), e atalhos rápidos (10, 25, 50, 100, 200, 500, 1000)',
      'Fator de escala exibido em tempo real',
      'Relatório de Proporção para impressão em A4 (sem fundo escuro)',
      'Exibe: quantidade original vs proporcional, custo total, custo por unidade',
      'Tabela detalhada com custo unitário e total de cada ingrediente',
    ]
  },
  {
    version: '3.0.0',
    date: '2024-12-20',
    changes: [
      'Relatório de fórmulas completamente reorganizado para folha A4',
      'Removida seção de Distribuição de Custos do relatório',
      'Fontes ajustadas automaticamente baseado no número de ingredientes',
      'Margens de 25mm para impressão profissional',
      'Layout mais limpo e organizado',
    ]
  },
  {
    version: '2.9.0',
    date: '2024-12-20',
    changes: [
      'Removida seção "Distribuição de Custos" do relatório de fórmulas',
      'Relatório simplificado: Header, Info do Produto, Stats, Tabela de Ingredientes, Notas e Footer',
      'Corrigido problema de escala/zoom que cortava elementos',
      'Layout responsivo que se adapta ao conteúdo',
      'Margens ajustadas: 20mm superior/inferior, 15mm laterais',
      'Fontes otimizadas para melhor legibilidade (corpo 11pt, tabela 10pt)',
    ]
  },
  {
    version: '2.8.0',
    date: '2024-12-20',
    changes: [
      'Relatório de fórmulas: Margens de 2,5 cm (25mm) em todos os lados',
      'Colunas da tabela com larguras fixas adequadas ao conteúdo',
      'Coluna Matéria-Prima: flexível | Qtd: 60px | Unid: 45px | Custo Unit: 75px | Custo Total: 75px | %: 50px',
      'Fontes aumentadas para melhor legibilidade (corpo 10pt, tabela 9pt)',
      'Legenda do gráfico em 2 colunas com fontes maiores',
      'Espaçamentos e paddings aumentados proporcionalmente',
    ]
  },
  {
    version: '2.7.0',
    date: '2024-12-20',
    changes: [
      'Relatório de fórmulas ultra compacto para caber em UMA folha A4 (até 17 ingredientes)',
      'Legenda do gráfico agora em 2 COLUNAS para melhor aproveitamento do espaço',
      'Fontes reduzidas: corpo 6pt, tabela 5.5pt, legenda 5pt',
      'Margens da página reduzidas de 8mm para 4mm',
      'Gráfico de pizza reduzido de 100px para 70px',
      'Espaçamentos entre seções otimizados',
    ]
  },
  {
    version: '2.6.0',
    date: '2024-12-20',
    changes: [
      'Relatório de fórmulas otimizado para caber em folha A4',
      'Gráfico de distribuição de custos em página separada quando necessário (8+ ingredientes)',
      'Quebra de página automática para fórmulas grandes',
      'Fontes e espaçamentos reduzidos proporcionalmente para acomodar mais ingredientes',
      'CSS de impressão melhorado com page-break-before e avoid-break',
    ]
  },
  {
    version: '2.5.0',
    date: '2024-12-20',
    changes: [
      'Correção de erro de validação nos sliders de preço',
      'Adicionado noValidate nos formulários',
      'Sliders agora aceitam qualquer valor numérico',
    ]
  },
  {
    version: '2.4.0',
    date: '2024-12-20',
    changes: [
      'PRODUTO QUÍMICO - Novo campo "Produto Químico?" no cadastro de matéria-prima',
      'Toggle estilo "modo avião" para indicar se é produto químico ou material de embalagem',
      'Coluna "Químico" na tabela de matérias-primas com badge visual',
      'PORCENTAGEM CORRIGIDA - Agora calcula % apenas dos produtos químicos na fórmula',
      'Materiais não-químicos (embalagem, rótulo, tampa) mostram "—" na coluna de porcentagem',
      'Gráfico de distribuição mostra apenas composição química da fórmula',
      'Relatório de fórmulas atualizado para separar produtos químicos de materiais de embalagem',
    ]
  },
  {
    version: '2.3.0',
    date: '2024-12-19',
    changes: [
      'GERENCIAMENTO DE GRUPOS - Novo botão "Gerenciar" para administrar grupos de fórmulas',
      'Editar nome e cor de grupos existentes',
      'Excluir grupos (fórmulas ficam sem categoria, não são excluídas)',
      'RELATÓRIO POR GRUPO - Botão "Relatório do Grupo" aparece ao filtrar por um grupo',
      'Relatório impresso em A4 com estatísticas do grupo, lista de fórmulas e custos',
      'Visual organizado com cores do grupo e informações completas',
    ]
  },
  {
    version: '2.2.0',
    date: '2024-12-19',
    changes: [
      'GRUPOS DE FÓRMULAS - Interface visual para filtrar e organizar fórmulas por grupos/categorias',
      'Botões de filtro coloridos para selecionar fórmulas por grupo',
      'Botão "+ Grupo" para criar novos grupos com nome e cor personalizados',
      'Badge colorida nos cards de fórmulas indicando o grupo',
      'Seleção de grupo no formulário de criação/edição de fórmulas',
      'CADASTRO RÁPIDO de Matérias-Primas - Quando pesquisa não encontra resultado, mostra botão para cadastrar rapidamente',
      'Nome e código SKU preenchidos automaticamente com o termo pesquisado',
    ]
  },
  {
    version: '2.1.0',
    date: '2024-12-19',
    changes: [
      'Preparação do sistema de grupos de fórmulas',
      'Melhorias na interface de precificação',
    ]
  },
  {
    version: '2.0.0',
    date: '2024-12-19',
    changes: [
      'NOVA ABA: Clientes - Cadastro completo com histórico de compras',
      'NOVA ABA: Fornecedores - Cadastro completo com histórico de compras',
      'Grupos de Fórmulas - Organize suas fórmulas por categorias/linhas de produto',
      'Visualização em blocos, lista e ordem alfabética para Clientes e Fornecedores',
      'Dashboard: Gráfico de produtos rentáveis com melhor visualização de nomes',
      'Matérias-Primas: Opção de cadastro rápido quando pesquisa não encontra resultado',
      'Histórico de compras com registro de data, valor e itens',
    ]
  },
  {
    version: '1.9.0',
    date: '2024-12-19',
    changes: [
      'CORREÇÃO CRÍTICA: Custo na precificação agora considera o preço das VARIANTES',
      'Antes o sistema usava sempre o preço base da matéria-prima, ignorando a variante selecionada',
      'Agora se um ingrediente usa uma variante (ex: Essência Coco R$150), o custo é calculado corretamente',
      'Corrigido bug que mostrava custo diferente entre Fórmulas e Precificação',
    ]
  },
  {
    version: '1.8.0',
    date: '2024-12-19',
    changes: [
      'Porcentagem no relatório de fórmulas agora é calculada pela QUANTIDADE de cada matéria-prima',
      'Anteriormente era calculada pelo custo/preço de cada ingrediente',
      'Correção para refletir a proporção real de cada ingrediente na fórmula',
    ]
  },
  {
    version: '1.7.0',
    date: '2024-12-19',
    changes: [
      'Sistema de variantes para matérias-primas implementado',
      'Possibilidade de cadastrar variantes com preços diferentes (ex: Essência Coco R$150, Lavanda R$120)',
      'Seleção de variantes ao criar/editar fórmulas',
      'Exibição de variantes expandíveis na tabela de matérias-primas (clique na seta)',
      'Relatórios de fórmulas atualizados para exibir nome da variante',
      'Cálculo de custos considera o preço da variante selecionada',
      'Visual diferenciado para ingredientes com variantes (borda roxa)',
    ]
  },
  {
    version: '1.6.0',
    date: '2024-12-19',
    changes: [
      'Relatório de Fórmulas: Nome e código da matéria-prima separados com espaço e código em itálico entre parênteses',
      'Relatório de Fórmulas: Coluna "Custo Unit." com R$ alinhado à esquerda e valores à direita',
      'Relatório de Fórmulas: Quantidade sempre com 3 casas decimais (ex: 0,500)',
      'Relatório de Fórmulas: Cor de fundo do cabeçalho da tabela alterada de preto para cinza (melhor contraste)',
      'Relatório de Fórmulas: Layout otimizado para caber em folha A4',
      'Relatório de Fórmulas: Fontes e espaçamentos ajustados proporcionalmente',
    ]
  },
  {
    version: '1.5.0',
    date: '2024-12-19',
    changes: [
      'Correção definitiva do problema da logo nos relatórios de impressão',
      'Logos em base64 grandes são substituídas por texto fallback (OC) na impressão',
      'Estilos inline aplicados diretamente nos elementos para garantir tamanho fixo',
      'Classe logo-container padronizada em todos os relatórios',
      'Tratamento de erro onError para logos que falham ao carregar',
    ]
  },
  {
    version: '1.4.0',
    date: '2024-12-19',
    changes: [
      'Corrigido problema da logo "estourada" nos relatórios de impressão',
      'Logo agora fica contida corretamente com tamanho fixo',
      'Adicionado CSS específico para conter imagens nos relatórios',
      'Melhorias de estabilidade nos relatórios de Fórmulas, Precificação e Simulação',
    ]
  },
  {
    version: '1.3.0',
    date: '2024-12-19',
    changes: [
      'Logo personalizada agora funciona nos relatórios de impressão',
      'Adicionado sistema de versão e changelog',
      'Backup agora inclui informação da versão',
      'Botão OK adicionado nas Configurações',
      'Removido card de alerta de estoque do Dashboard',
    ]
  },
  {
    version: '1.2.0',
    date: '2024-12-18',
    changes: [
      'Relatório de precificação reorganizado e otimizado para impressão A4',
      'Removidos gráficos, ponto de equilíbrio e análise competitiva do relatório',
      'Adicionada aba de Simulações na Precificação',
      'Novo sistema de arredondamento: Varejo x,95, Atacado x,90, Fardo x,80',
    ]
  },
  {
    version: '1.1.0',
    date: '2024-12-17',
    changes: [
      'Precificação: Campo de preço de venda com slider horizontal',
      'Markup calculado automaticamente e destacado',
      'Campos compactos para quantidade, desconto e despesas',
      'Gráficos com valores visíveis',
    ]
  },
  {
    version: '1.0.0',
    date: '2024-12-16',
    changes: [
      'Versão inicial do sistema',
      'Módulos: Dashboard, Matérias-Primas, Fórmulas, Precificação',
      'Sistema de login e tema claro/escuro',
      'Relatórios de impressão em formato A4',
    ]
  }
];

export const BackupRestore: React.FC<BackupRestoreProps> = ({ isOpen, onClose }) => {
  const { rawMaterials, formulas, pricings, companyLogo, setRawMaterials, setFormulas, setPricings, setCompanyLogo } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreWarnings, setRestoreWarnings] = useState<FieldWarning[]>([]);
  const [showWarnings, setShowWarnings] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const formatDateTime = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}h${pad(date.getMinutes())}m${pad(date.getSeconds())}s`;
  };

  const getCurrentFields = () => {
    return {
      rawMaterials: ['id', 'name', 'sku', 'unit', 'unitValue', 'supplier', 'minStock', 'currentStock', 'status', 'createdAt', 'image'],
      formulas: ['id', 'name', 'code', 'description', 'finalWeight', 'finalUnit', 'yield', 'ingredients', 'status', 'createdAt', 'notes'],
      pricings: ['id', 'formulaId', 'retailMarkup', 'wholesaleMarkup', 'bundleDiscount', 'bundleQuantity', 'fixedCosts', 'competitorPrice', 'createdAt']
    };
  };

  const handleBackup = () => {
    const now = new Date();
    const backupData: BackupData = {
      version: APP_VERSION,
      backupVersion: APP_VERSION,
      exportedAt: now.toISOString(),
      data: {
        rawMaterials,
        formulas,
        pricings,
        companyLogo
      },
      fields: getCurrentFields()
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ohana-clean-backup_${formatDateTime(now)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const compareFields = (backupFields: string[], currentFields: string[], moduleName: string): FieldWarning | null => {
    const missingFields = currentFields.filter(f => !backupFields.includes(f));
    const extraFields = backupFields.filter(f => !currentFields.includes(f));
    
    if (missingFields.length > 0 || extraFields.length > 0) {
      return { module: moduleName, missingFields, extraFields };
    }
    return null;
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData: BackupData = JSON.parse(e.target?.result as string);
        
        // Verificar campos
        const warnings: FieldWarning[] = [];
        const currentFields = getCurrentFields();
        
        if (backupData.fields) {
          const rawMaterialsWarning = compareFields(
            backupData.fields.rawMaterials || [],
            currentFields.rawMaterials,
            'Matérias-Primas'
          );
          if (rawMaterialsWarning) warnings.push(rawMaterialsWarning);

          const formulasWarning = compareFields(
            backupData.fields.formulas || [],
            currentFields.formulas,
            'Fórmulas'
          );
          if (formulasWarning) warnings.push(formulasWarning);

          const pricingsWarning = compareFields(
            backupData.fields.pricings || [],
            currentFields.pricings,
            'Precificações'
          );
          if (pricingsWarning) warnings.push(pricingsWarning);
        }

        // Restaurar dados
        if (backupData.data.rawMaterials) {
          setRawMaterials(backupData.data.rawMaterials);
        }
        if (backupData.data.formulas) {
          setFormulas(backupData.data.formulas);
        }
        if (backupData.data.pricings) {
          setPricings(backupData.data.pricings);
        }
        if (backupData.data.companyLogo) {
          setCompanyLogo(backupData.data.companyLogo);
        }

        if (warnings.length > 0) {
          setRestoreWarnings(warnings);
          setShowWarnings(true);
        } else {
          setRestoreSuccess(true);
          setTimeout(() => {
            setRestoreSuccess(false);
          }, 3000);
        }

        // Limpar input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        alert('Erro ao ler o arquivo de backup. Verifique se o arquivo é válido.');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Backup e Restauração
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Versão do Sistema: <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">v{APP_VERSION}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            O backup inclui a versão para compatibilidade futura
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Backup Section */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Fazer Backup</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Salva todas as matérias-primas, fórmulas e precificações em um arquivo JSON.
                </p>
                <button
                  onClick={handleBackup}
                  className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Baixar Backup
                </button>
              </div>
            </div>
          </div>

          {/* Restore Section */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Restaurar Backup</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Restaura todos os dados a partir de um arquivo de backup.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  className="hidden"
                  id="restore-file"
                />
                <label
                  htmlFor="restore-file"
                  className="mt-3 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer inline-flex"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Selecionar Arquivo
                </label>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {restoreSuccess && (
            <div className="bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 rounded-xl p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-800 dark:text-green-200 font-medium">
                Backup restaurado com sucesso!
              </span>
            </div>
          )}

          {/* Info */}
          <div className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-4">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Informações do Sistema
            </h4>
            <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Matérias-Primas:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{rawMaterials.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Fórmulas:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formulas.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Precificações:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{pricings.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings Modal */}
      {showWarnings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-full">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Atenção: Diferenças Detectadas</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">O backup foi restaurado, mas há diferenças nos campos</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 max-h-80 overflow-y-auto">
              {restoreWarnings.map((warning, index) => (
                <div key={index} className="mb-4 last:mb-0">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">{warning.module}</h4>
                  
                  {warning.missingFields.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                        Campos novos (não existiam no backup):
                      </p>
                      <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {warning.missingFields.map(field => (
                          <li key={field} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                            <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{field}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {warning.extraFields.length > 0 && (
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        Campos extras no backup (podem ser ignorados):
                      </p>
                      <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {warning.extraFields.map(field => (
                          <li key={field} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{field}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <button
                onClick={() => {
                  setShowWarnings(false);
                  setRestoreWarnings([]);
                }}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
