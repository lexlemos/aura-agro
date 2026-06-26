import { create } from "zustand"

export interface ReferenceItem {
  id: string
  type: "law" | "decree" | "manual" | "dashboard"
  title: string
  url?: string
}

export interface DecisionNode {
  id: string
  type: "decision" | "result"
  title: string
  description: string
  simplifiedText: string
  benefits?: string[]
  references: ReferenceItem[]
}

export interface Relationship {
  id: string
  source: string
  target: string
  label: "SIM" | "NÃO"
}

export interface CaseItem {
  id: string
  title: string
  nodes: DecisionNode[]
  edges: Relationship[]
}

interface GraphState {
  cases: CaseItem[]
  activeCaseId: string
  focusedNodeId: string | null
  readingNodeData: DecisionNode | null
  isProducerView: boolean
  setActiveCaseId: (id: string) => void
  setFocusedNodeId: (id: string | null) => void
  setReadingNodeData: (data: DecisionNode | null) => void
  toggleView: () => void
  addNewCase: (title: string) => void
  deleteCase: (id: string) => void
  addCustomNode: (caseId: string, node: DecisionNode, edge: Relationship) => void
}

const defaultCases: CaseItem[] = [
  {
    id: "trilha-app-completa",
    title: "Trilha de Regularização de APP (Marco Temporal)",
    nodes: [
      {
        id: "node-root-tamanho",
        type: "decision",
        title: "Classificação Fundiária",
        description: "O imóvel rural possui área total líquida de ATÉ 4 (quatro) módulos fiscais, enquadrando-se no conceito de pequena propriedade ou posse rural familiar?",
        simplifiedText: "O tamanho total da sua propriedade é de até 4 Módulos Fiscais? (Considerada uma pequena propriedade)",
        references: [
          {
            id: "ref-lei-pequeno",
            type: "law",
            title: "Art. 3º, V, Lei nº 12.651/2012 (Código Florestal)",
            url: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm"
          },
          {
            id: "ref-manual-car",
            type: "manual",
            title: "Manual do CAR - Conceitos Básicos",
            url: "https://www.car.gov.br/publico/manuais/Manual_de_Apoio_CAR.pdf"
          }
        ]
      },
      {
        id: "node-pequeno-marco",
        type: "decision",
        title: "Marco Temporal (Pequeno Produtor)",
        description: "A supressão de vegetação nativa na Área de Preservação Permanente (APP) constitui área rural consolidada, ou seja, ocorreu ANTES de 22 de julho de 2008?",
        simplifiedText: "O desmatamento ou o uso dessa área perto do rio (para plantio ou pasto) começou antes de julho de 2008?",
        references: [
          {
            id: "ref-decreto-consolidada",
            type: "decree",
            title: "Art. 2º, IV, Decreto nº 7.830/2012",
            url: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/decreto/d7830.htm"
          }
        ]
      },
      {
        id: "node-grande-marco",
        type: "decision",
        title: "Marco Temporal (Médio/Grande Produtor)",
        description: "Para imóveis acima de 4 módulos fiscais, a ocupação antrópica na Área de Preservação Permanente (APP) ocorreu ANTES de 22 de julho de 2008?",
        simplifiedText: "Como sua propriedade é maior que 4 módulos fiscais, o uso da área perto do rio começou antes de julho de 2008?",
        references: [
          {
            id: "ref-lei-marco",
            type: "law",
            title: "Art. 61-A, Lei nº 12.651/2012",
            url: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm"
          }
        ]
      },
      {
        id: "node-result-escadinha",
        type: "result",
        title: "Regularização - Regra da Escadinha",
        description: "Imóvel elegível à recomposição reduzida de APP (Regra da Escadinha) proporcional ao tamanho da propriedade. Suspensão imediata de sanções mediante adesão ao Programa de Regularização Ambiental (PRA).",
        simplifiedText: "Excelente notícia! Como sua propriedade é pequena e o uso é antigo (antes de 2008), você tem direito a regras mais brandas. A faixa de mata a ser recuperada será menor e você não pagará multas retroativas. Basta aderir ao PRA.",
        benefits: [
          "Isenção de Multas Pretéritas",
          "Faixa de Recuperação Reduzida",
          "Garantia de Crédito Rural (PRONAF)"
        ],
        references: [
          {
            id: "ref-painel-pra",
            type: "dashboard",
            title: "Painel da Regularização Ambiental",
            url: "https://www.florestal.gov.br/painel-da-regularizacao-ambiental"
          }
        ]
      },
      {
        id: "node-result-pra-comum",
        type: "result",
        title: "Regularização - Recomposição Padrão",
        description: "Área consolidada reconhecida. Obrigatória a recomposição das faixas marginais conforme larguras mínimas do Art. 61-A, sem os redutores da pequena propriedade. Exigida adesão ao PRA para conversão de multas.",
        simplifiedText: "Como o uso é antigo (antes de 2008), você pode converter suas multas aderindo ao PRA (Programa de Regularização Ambiental), mas terá que recuperar a faixa padrão de mata ciliar exigida para o tamanho da sua propriedade.",
        benefits: [
          "Conversão de Multas (Adesão ao PRA)",
          "Acesso Mantido ao Crédito Agrícola"
        ],
        references: [
          {
            id: "ref-lei-61a",
            type: "law",
            title: "Art. 61-A, Lei nº 12.651/2012",
            url: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm"
          }
        ]
      },
      {
        id: "node-result-ilegal",
        type: "result",
        title: "Infração - Supressão Ilegal Pós-2008",
        description: "Supressão não autorizada após o marco temporal estabelecido pelo Código Florestal. Sujeito a embargo da área, autuação pelo IBAMA/OEMA e obrigatoriedade de recomposição integral da APP conforme Art. 4º.",
        simplifiedText: "Atenção: O desmatamento ocorreu após 2008. A área está em situação irregular. É necessário interromper as atividades produtivas nesse local específico e realizar o plantio para recuperar toda a área degradada para evitar bloqueio de financiamentos.",
        benefits: [],
        references: [
          {
            id: "ref-lei-art4",
            type: "law",
            title: "Art. 4º, Lei nº 12.651/2012 (Código Florestal)",
            url: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm"
          },
          {
            id: "ref-snif",
            type: "dashboard",
            title: "Bases de Referência - SNIF",
            url: "https://snif.florestal.gov.br/"
          }
        ]
      }
    ],
    edges: [
      // Se for pequeno produtor -> Vai para marco temporal do pequeno
      { id: "edge-root-sim", source: "node-root-tamanho", target: "node-pequeno-marco", label: "SIM" },
      // Se for grande produtor -> Vai para marco temporal do grande
      { id: "edge-root-nao", source: "node-root-tamanho", target: "node-grande-marco", label: "NÃO" },
      
      // Fluxo Pequeno Produtor
      { id: "edge-pequeno-antes", source: "node-pequeno-marco", target: "node-result-escadinha", label: "SIM" },
      { id: "edge-pequeno-depois", source: "node-pequeno-marco", target: "node-result-ilegal", label: "NÃO" },
      
      // Fluxo Grande Produtor
      { id: "edge-grande-antes", source: "node-grande-marco", target: "node-result-pra-comum", label: "SIM" },
      { id: "edge-grande-depois", source: "node-grande-marco", target: "node-result-ilegal", label: "NÃO" }
    ]
  }
]

export const useGraphStore = create<GraphState>((set) => ({
  cases: defaultCases,
  activeCaseId: "trilha-app-completa",
  focusedNodeId: null,
  readingNodeData: null,
  isProducerView: false,

  setActiveCaseId: (id) => set({ activeCaseId: id, focusedNodeId: null, readingNodeData: null }),
  setFocusedNodeId: (id) => set({ focusedNodeId: id }),
  setReadingNodeData: (data) => set({ readingNodeData: data }),
  toggleView: () => set((state) => ({ isProducerView: !state.isProducerView })),

  addNewCase: (title) =>
    set((state) => {
      const newId = `case-${Date.now()}`
      const newCase: CaseItem = {
        id: newId,
        title,
        nodes: [
          {
            id: `node-root-${Date.now()}`,
            type: "decision",
            title: "Nó Inicial",
            description: "Escreva no chat para criar novas hipóteses de decisão.",
            simplifiedText: "Nó inicial do seu processo de análise ambiental.",
            references: [
              {
                id: `ref-init-${Date.now()}`,
                type: "law",
                title: "Art. 1º, Geral",
              },
            ],
          },
        ],
        edges: [],
      }
      return {
        cases: [newCase, ...state.cases],
        activeCaseId: newId,
        focusedNodeId: null,
        readingNodeData: null,
      }
    }),

  deleteCase: (id) =>
    set((state) => {
      const updatedCases = state.cases.filter((c) => c.id !== id)
      let nextActiveId = state.activeCaseId

      if (state.activeCaseId === id) {
        nextActiveId = updatedCases.length > 0 ? updatedCases[0].id : ""
      }

      if (updatedCases.length === 0) {
        const defaultId = "case-default"
        const defaultCase: CaseItem = {
          id: defaultId,
          title: "Novo Caso Padrão",
          nodes: [
            {
              id: "node-default-root",
              type: "decision",
              title: "Nó Inicial",
              description: "Digite uma mensagem no chat para começar.",
              simplifiedText: "Nó de início do caso para análise.",
              references: [
                {
                  id: "ref-default-init",
                  type: "law",
                  title: "Art. 1º, Geral",
                },
              ],
            },
          ],
          edges: [],
        }
        return {
          cases: [defaultCase],
          activeCaseId: defaultId,
          focusedNodeId: null,
          readingNodeData: null,
        }
      }

      return {
        cases: updatedCases,
        activeCaseId: nextActiveId,
        focusedNodeId: null,
        readingNodeData: null,
      }
    }),

  addCustomNode: (caseId, node, edge) =>
    set((state) => ({
      cases: state.cases.map((c) => {
        if (c.id === caseId) {
          return {
            ...c,
            nodes: [...c.nodes, node],
            edges: [...c.edges, edge],
          }
        }
        return c
      }),
    })),
}))
