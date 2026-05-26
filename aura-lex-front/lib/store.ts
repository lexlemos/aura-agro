import { create } from "zustand"

export interface ReferenceItem {
  id: string
  type: "jurisprudence" | "law" | "doctrine"
  title: string
  url?: string
}

export interface DecisionNode {
  id: string
  type: "decision" | "result"
  title: string
  description: string
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
  setActiveCaseId: (id: string) => void
  setFocusedNodeId: (id: string | null) => void
  setReadingNodeData: (data: DecisionNode | null) => void
  addNewCase: (title: string) => void
  deleteCase: (id: string) => void
  addCustomNode: (caseId: string, node: DecisionNode, edge: Relationship) => void
}

const defaultCases: CaseItem[] = [
  {
    id: "case-1",
    title: "Recurso Ordinário Trabalhista",
    nodes: [
      {
        id: "node-root",
        type: "decision",
        title: "Admissibilidade Recursal",
        description: "O recurso ordinário foi protocolado dentro do prazo de 8 dias úteis?",
        references: [
          {
            id: "ref-1",
            type: "law",
            title: "Art. 895, CLT",
            url: "https://www.jusbrasil.com.br/topicos/10714774/artigo-895-da-consolidacao-das-leis-do-trabalho-decreto-lei-n-5452-de-01-de-maio-de-1943",
          },
          {
            id: "ref-2",
            type: "doctrine",
            title: "Teoria da Recorribilidade Trabalhista",
          },
        ],
      },
      {
        id: "node-preparo",
        type: "decision",
        title: "Preparo Efetuado",
        description: "As custas processuais e o depósito recursal foram devidamente pagos e comprovados?",
        references: [
          {
            id: "ref-3",
            type: "jurisprudence",
            title: "Súmula 245, TST",
            url: "https://www.jusbrasil.com.br/jurisprudencia/sumulas/tst/sumula-245",
          },
        ],
      },
      {
        id: "node-intempestivo",
        type: "result",
        title: "Recurso Intempestivo",
        description: "Extinção do processo sem resolução do mérito por intempestividade.",
        references: [
          {
            id: "ref-4",
            type: "law",
            title: "Art. 932, III, CPC",
            url: "https://www.jusbrasil.com.br/topicos/28892497/artigo-932-da-lei-n-13105-de-16-de-marco-de-2015",
          },
        ],
      },
      {
        id: "node-vinculo",
        type: "decision",
        title: "Vínculo Empregatício",
        description: "Ficou caracterizada a subordinação, habitualidade, onerosidade e pessoalidade?",
        references: [
          {
            id: "ref-5",
            type: "law",
            title: "Art. 3º, CLT",
            url: "https://www.jusbrasil.com.br/topicos/10729780/artigo-3-da-consolidacao-das-leis-do-trabalho-decreto-lei-n-5452-de-01-de-maio-de-1943",
          },
          {
            id: "ref-6",
            type: "doctrine",
            title: "Curso de Trabalho - M. Godinho",
          },
        ],
      },
      {
        id: "node-deserto",
        type: "result",
        title: "Recurso Deserto",
        description: "Não conhecimento do recurso ordinário por deserção do preparo.",
        references: [
          {
            id: "ref-7",
            type: "jurisprudence",
            title: "Súmula 128, TST",
            url: "https://www.jusbrasil.com.br/jurisprudencia/sumulas/tst/sumula-128",
          },
        ],
      },
      {
        id: "node-procedente",
        type: "result",
        title: "Sentença Mantida",
        description: "Manutenção do reconhecimento do vínculo empregatício em segunda instância.",
        references: [
          {
            id: "ref-8",
            type: "jurisprudence",
            title: "Acórdão Regional, TRT",
          },
        ],
      },
      {
        id: "node-improcedente",
        type: "result",
        title: "Sentença Reformada",
        description: "Afastamento do vínculo por ausência de prova de subordinação.",
        references: [
          {
            id: "ref-9",
            type: "jurisprudence",
            title: "Precedente Subordinação, TRT",
          },
        ],
      },
    ],
    edges: [
      { id: "e1", source: "node-root", target: "node-preparo", label: "SIM" },
      { id: "e2", source: "node-root", target: "node-intempestivo", label: "NÃO" },
      { id: "e3", source: "node-preparo", target: "node-vinculo", label: "SIM" },
      { id: "e4", source: "node-preparo", target: "node-deserto", label: "NÃO" },
      { id: "e5", source: "node-vinculo", target: "node-procedente", label: "SIM" },
      { id: "e6", source: "node-vinculo", target: "node-improcedente", label: "NÃO" },
    ],
  },
  {
    id: "case-2",
    title: "Indenização por Danos Morais",
    nodes: [
      {
        id: "node-root-2",
        type: "decision",
        title: "Ato Ilícito",
        description: "Houve conduta ilícita, culposa ou dolosa do réu?",
        references: [
          {
            id: "ref-2-1",
            type: "law",
            title: "Art. 186, CC",
            url: "https://www.jusbrasil.com.br/topicos/10718503/artigo-186-da-lei-n-10406-de-10-de-janeiro-de-2002",
          },
        ],
      },
      {
        id: "node-dano-2",
        type: "decision",
        title: "Dano Comprovado",
        description: "A vítima sofreu efetivo abalo psicológico ou ofensa aos direitos de personalidade?",
        references: [
          {
            id: "ref-2-2",
            type: "law",
            title: "Art. 5º, V, CF/88",
            url: "https://www.jusbrasil.com.br/topicos/10647895/artigo-5-da-constituicao-federal-de-1988",
          },
        ],
      },
      {
        id: "node-sem-ato-2",
        type: "result",
        title: "Ausência de Conduta",
        description: "Improcedência. A conduta do réu estava no exercício regular de um direito.",
        references: [
          {
            id: "ref-2-3",
            type: "law",
            title: "Art. 188, I, CC",
            url: "https://www.jusbrasil.com.br/topicos/10718302/artigo-188-da-lei-n-10406-de-10-de-janeiro-de-2002",
          },
        ],
      },
      {
        id: "node-nexo-2",
        type: "decision",
        title: "Nexo Causal",
        description: "Existe relação direta de causa e efeito entre o ato ilícito e o dano?",
        references: [
          {
            id: "ref-2-4",
            type: "law",
            title: "Art. 403, CC",
            url: "https://www.jusbrasil.com.br/topicos/10708682/artigo-403-da-lei-n-10406-de-10-de-janeiro-de-2002",
          },
        ],
      },
      {
        id: "node-sem-dano-2",
        type: "result",
        title: "Ausência de Dano",
        description: "Improcedência. Mero dissabor cotidiano não gera direito a indenização moral.",
        references: [
          {
            id: "ref-2-5",
            type: "jurisprudence",
            title: "Inadimplemento Contratual, STJ",
          },
        ],
      },
      {
        id: "node-indenizar-2",
        type: "result",
        title: "Dever de Indenizar",
        description: "Procedência da ação com arbitramento do quantum indenizatório.",
        references: [
          {
            id: "ref-2-6",
            type: "law",
            title: "Art. 927, CC",
            url: "https://www.jusbrasil.com.br/topicos/10675662/artigo-927-da-lei-n-10406-de-10-de-janeiro-de-2002",
          },
        ],
      },
      {
        id: "node-sem-nexo-2",
        type: "result",
        title: "Ausência de Responsabilidade",
        description: "Improcedência. Ocorrência de culpa exclusiva da vítima ou de força maior.",
        references: [
          {
            id: "ref-2-7",
            type: "doctrine",
            title: "Responsabilidade Civil - S. Venosa",
          },
        ],
      },
    ],
    edges: [
      { id: "e2-1", source: "node-root-2", target: "node-dano-2", label: "SIM" },
      { id: "e2-2", source: "node-root-2", target: "node-sem-ato-2", label: "NÃO" },
      { id: "e2-3", source: "node-dano-2", target: "node-nexo-2", label: "SIM" },
      { id: "e2-4", source: "node-dano-2", target: "node-sem-dano-2", label: "NÃO" },
      { id: "e2-5", source: "node-nexo-2", target: "node-indenizar-2", label: "SIM" },
      { id: "e2-6", source: "node-nexo-2", target: "node-sem-nexo-2", label: "NÃO" },
    ],
  },
]

export const useGraphStore = create<GraphState>((set) => ({
  cases: defaultCases,
  activeCaseId: "case-1",
  focusedNodeId: null,
  readingNodeData: null,

  setActiveCaseId: (id) => set({ activeCaseId: id, focusedNodeId: null, readingNodeData: null }),
  setFocusedNodeId: (id) => set({ focusedNodeId: id }),
  setReadingNodeData: (data) => set({ readingNodeData: data }),

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
