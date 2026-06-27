import { create } from "zustand"

export interface ReferenceItem {
  id: string
  type: "law" | "decree" | "manual" | "dashboard"
  title: string
  url?: string
}

export interface DecisionNode {
  id: string
  type: "decision" | "result" | "final"
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
  label?: "SIM" | "NÃO"
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
  setCaseGraph: (caseId: string, nodes: DecisionNode[], edges: Relationship[]) => void
}

export const mockAppPayload: { nodes: DecisionNode[]; edges: Relationship[] } = {
  nodes: [
    {
      id: "node-root-tamanho",
      type: "decision",
      title: "Classificação Fundiária (Art. 3º, V)",
      description: "O imóvel rural atende ao conceito de pequena propriedade rural (área de até 4 módulos fiscais), conforme disposto no Art. 3º, inciso V da Lei nº 12.651/2012?",
      simplifiedText: "Sua propriedade rural possui até 4 Módulos Fiscais? (Esse é o limite da lei para ser considerado pequeno produtor)",
      references: [
        {
          id: "ref-lei-art3",
          type: "law",
          title: "Art. 3º, V, Lei 12.651/12",
          url: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm"
        }
      ]
    },
    {
      id: "node-pequeno-marco",
      type: "decision",
      title: "Marco Temporal (Pequeno Produtor)",
      description: "Conforme o Art. 61-A, caput, a supressão de vegetação nativa na Área de Preservação Permanente (APP) ocorreu até 22 de julho de 2008 (área rural consolidada)?",
      simplifiedText: "O desmatamento ou ocupação da área perto do rio começou antes de 22 de julho de 2008?",
      references: [
        {
          id: "ref-lei-art61a",
          type: "law",
          title: "Art. 61-A, Lei 12.651/12",
          url: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm"
        }
      ]
    },
    {
      id: "node-grande-marco",
      type: "decision",
      title: "Marco Temporal (Médio/Grande Produtor)",
      description: "Para imóveis superiores a 4 módulos fiscais, as atividades agrossilvipastoris na Área de Preservação Permanente (APP) foram consolidadas até 22 de julho de 2008?",
      simplifiedText: "Como sua propriedade é maior que 4 módulos fiscais, a ocupação perto do rio é antiga e aconteceu antes de 22 de julho de 2008?",
      references: [
        {
          id: "ref-lei-art61a-grande",
          type: "law",
          title: "Art. 61-A, Lei 12.651/12",
          url: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm"
        }
      ]
    },
    {
      id: "node-result-escadinha",
      type: "result",
      title: "Recomposição Reduzida (Art. 61-A, § 1º ao § 4º)",
      description: "Direito à recomposição de APP em faixas menores: 5m (até 1 módulo fiscal), 8m (1 a 2 módulos) ou 15m (2 a 4 módulos). Suspensão de sanções garantida mediante adesão ao PRA (Art. 59, § 4º).",
      simplifiedText: "Boas notícias! Pela 'regra da escadinha' do Código Florestal, você só precisará recuperar uma pequena faixa (de 5 a 15 metros) da margem do rio. Aderindo ao PRA, suas multas antigas serão suspensas.",
      benefits: [
        "Suspensão de Multas (Art. 59)",
        "Recuperação de APP Reduzida",
        "Acesso ao Crédito Rural"
      ],
      references: [
        {
          id: "ref-manual-pra",
          type: "manual",
          title: "Manual do PRA (Módulo de Regularização)",
          url: "https://www.car.gov.br/publico/manuais/Manual_de_Apoio_CAR.pdf"
        }
      ]
    },
    {
      id: "node-result-pra-comum",
      type: "result",
      title: "Recomposição Proporcional (Art. 61-A, § 6º)",
      description: "Área consolidada reconhecida. Para imóveis acima de 4 módulos, a recomposição da APP será de no mínimo 20 metros até no máximo 100 metros, conforme a largura do curso d'água. Exige adesão ao PRA.",
      simplifiedText: "Como o uso é anterior a 2008, você tem direito a participar do PRA para regularizar multas. No entanto, precisará recuperar faixas maiores (mínimo de 20 metros) por conta do tamanho da sua propriedade.",
      benefits: [
        "Adesão ao PRA Autorizada",
        "Regularização de Passivo"
      ],
      references: [
        {
          id: "ref-lei-art61a-paragrafo6",
          type: "law",
          title: "Art. 61-A, § 6º, Lei 12.651/12",
          url: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm"
        }
      ]
    },
    {
      id: "node-result-ilegal",
      type: "result",
      title: "Infração - Área Não Consolidada (Art. 4º)",
      description: "Supressão não autorizada após 22 de julho de 2008. Não há direito aos benefícios de área consolidada. Obrigatoriedade de recomposição integral das faixas marginais (ex: 30 metros para rios de até 10m), sujeito a embargo.",
      simplifiedText: "Atenção: O desmatamento ocorreu após 2008. A lei exige a recuperação total da área (pelo menos 30 metros de mata ciliar para rios pequenos). Regularize o quanto antes para não sofrer multas e embargo ambiental.",
      benefits: [],
      references: [
        {
          id: "ref-lei-art4",
          type: "law",
          title: "Art. 4º, Lei 12.651/12",
          url: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm"
        }
      ]
    },
    {
      id: "node-result-final",
      type: "final",
      title: "Resumo Técnico Consolidado (Diagnóstico)",
      description: "Parecer consolidado final. O imóvel rural foi diagnosticado sob a égide da Lei 12.651/12 (Código Florestal). Requisitos ambientais: imóveis consolidados pré-2008 têm obrigações reduzidas (escadinha de 5m a 15m para pequenos ou proporcional de 20m a 100m para médios/grandes). Áreas degradadas pós-2008 exigem recuperação integral e estão sob risco de embargos.",
      simplifiedText: "Resumo Final do Diagnóstico: Analisamos suas respostas e a legislação. Se a supressão da sua propriedade for anterior a 2008, você tem direito a obrigações reduzidas. Imóveis com desmatamento pós-2008 exigem recomposição integral. Regularize no PRA para suspender sanções.",
      benefits: [
        "Consolidação de Passivos",
        "Segurança Jurídica do CAR",
        "Orientação de Plantio"
      ],
      references: [
        {
          id: "ref-resumo-lei",
          type: "law",
          title: "Código Florestal Consolidado",
          url: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm"
        }
      ]
    }
  ],
  edges: [
    { id: "edge-root-sim", source: "node-root-tamanho", target: "node-pequeno-marco", label: "SIM" },
    { id: "edge-root-nao", source: "node-root-tamanho", target: "node-grande-marco", label: "NÃO" },
    { id: "edge-pequeno-antes", source: "node-pequeno-marco", target: "node-result-escadinha", label: "SIM" },
    { id: "edge-pequeno-depois", source: "node-pequeno-marco", target: "node-result-ilegal", label: "NÃO" },
    { id: "edge-grande-antes", source: "node-grande-marco", target: "node-result-pra-comum", label: "SIM" },
    { id: "edge-grande-depois", source: "node-grande-marco", target: "node-result-ilegal", label: "NÃO" },
    { id: "edge-final-escadinha", source: "node-result-escadinha", target: "node-result-final" },
    { id: "edge-final-pra", source: "node-result-pra-comum", target: "node-result-final" },
    { id: "edge-final-ilegal", source: "node-result-ilegal", target: "node-result-final" }
  ]
};

const defaultCases: CaseItem[] = [
  {
    id: "trilha-app-completa",
    title: "Trilha de Regularização de APP (Marco Temporal)",
    nodes: [
      {
        id: "node-root-inicio",
        type: "decision",
        title: "Bem-vindo à Aura Agro",
        description: "Olá! Descreva a situação do seu imóvel rural ou faça uma pergunta sobre a conformidade do CAR (Cadastro Ambiental Rural) e das Áreas de Preservação Permanente (APP) para começarmos.",
        simplifiedText: "Olá! Conte-nos um pouco sobre a sua propriedade rural para analisarmos a sua situação com o CAR.",
        references: [
          {
            id: "ref-codigo-florestal",
            type: "law",
            title: "Código Florestal (Lei nº 12.651/2012)",
            url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm"
          },
          {
            id: "ref-decreto-car",
            type: "decree",
            title: "Regulamento do CAR (Decreto nº 7.830/2012)",
            url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/decreto/d7830.htm"
          }
        ]
      }
    ],
    edges: []
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

  setCaseGraph: (caseId, nodes, edges) =>
    set((state) => ({
      cases: state.cases.map((c) => {
        if (c.id === caseId) {
          return {
            ...c,
            nodes,
            edges,
          }
        }
        return c
      }),
    })),
}))
